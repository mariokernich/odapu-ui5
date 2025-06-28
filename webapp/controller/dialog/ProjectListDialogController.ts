import DialogController from "../../util/DialogController";
import MessageToast from "sap/m/MessageToast";
import MessageBox from "sap/m/MessageBox";
import List from "sap/m/List";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import { Project } from "../../Types";
import ListBinding from "sap/ui/model/ListBinding";
import { Button$PressEvent } from "sap/m/Button";
import { SearchField$LiveChangeEvent } from "sap/m/SearchField";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class ProjectListDialogController extends DialogController {
	data = {
		projects: [] as Project[],
		selectedProject: null as Project | null,
	};

	public onSearch(event: SearchField$LiveChangeEvent): void {
		const query = event.getParameter("newValue")?.toLowerCase() ?? "";
		const list = this.getElement<List>("idProjectsList");
		const binding = list.getBinding("items") as ListBinding;

		if (binding) {
			binding.filter(
				query ? new Filter("ProjectName", FilterOperator.Contains, query) : []
			);
			this.updateDialogTitle();
		}
	}

	public onLoad(): void {
		const list = this.getElement<List>("idProjectsList");
		const selectedItem = list.getSelectedItem();

		if (!selectedItem) {
			MessageToast.show(this.getText("msg.selectProject"));
			return;
		}

		const bindingContext = selectedItem.getBindingContext("dialog");
		if (!bindingContext) {
			return;
		}

		const project = bindingContext.getObject() as Project;
		this.data.selectedProject = project;
		this.onConfirm();
	}

	public async refresh() {
		this.dialog.setBusy(true);
		try {
			const projects = await this.requests.getProjects();
			const model = this.dialog.getModel("dialog") as JSONModel;
			model.setProperty("/projects", projects);
			model.refresh(true);
		} finally {
			this.dialog.setBusy(false);
		}
	}

	public onAfterOpen(): void {
		super.onAfterOpen();
		this.updateDialogTitle();
	}

	public async onDelete(event: Button$PressEvent): Promise<void> {
		const source = event.getSource();

		// Get project data from custom data
		const customData = source.getCustomData();
		const projectData = customData.find((data) => data.getKey() === "project");

		if (!projectData) {
			console.error("Could not find project data in custom data");
			return;
		}

		const project = projectData.getValue() as Project;
		const confirmed = await this.dialogManager.showConfirmationDialog(
			`Are you sure you want to delete project "${project.ProjectName}"?`
		);

		if (confirmed) {
			this.dialog.setBusy(true);
			try {
				await this.requests.deleteProject(project);
				MessageToast.show(this.getText("msg.projectDeleted"));

				await this.refresh();

				this.updateDialogTitle();
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				MessageBox.error(`Error deleting project: ${errorMessage}`);
			} finally {
				this.dialog.setBusy(false);
			}
		}
	}

	private updateDialogTitle(): void {
		const list = this.getElement<List>("idProjectsList");
		const binding = list.getBinding("items") as ListBinding;
		const filteredLength = binding ? binding.getLength() : 0;
		const title = this.getText("dlg.title.savedProjects");
		this.dialog.setTitle(`${title} (${filteredLength})`);
	}
}
