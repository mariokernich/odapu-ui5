import DialogController from "../../util/DialogController";
import MessageToast from "sap/m/MessageToast";
import MessageBox from "sap/m/MessageBox";
import Table from "sap/m/Table";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import { Project } from "../../Types";
import { Input$LiveChangeEvent } from "sap/m/Input";
import ListBinding from "sap/ui/model/ListBinding";
import ListItem from "sap/ui/core/ListItem";
import { Button$PressEvent } from "sap/m/Button";
import { SearchField$LiveChangeEvent } from "sap/m/SearchField";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class ProjectListDialogController extends DialogController {
    data = {
        projects: [] as Project[],
        selectedProject: null as Project | null
    };

    public onSearch(event: SearchField$LiveChangeEvent): void {
        const query = event.getParameter("newValue")?.toLowerCase() ?? "";
        const table = this.getElement<Table>("idProjectsTable");
        const binding = table.getBinding("items") as ListBinding;
        
        if (binding) {
            binding.filter(
                query
                    ? new Filter("ProjectName", FilterOperator.Contains, query)
                    : []
            );
            this.updateDialogTitle();
        }
    }

    public onLoad(): void {
        const table = this.getElement<Table>("idProjectsTable");
        const selectedItem = table.getSelectedItem();
        
        if (!selectedItem) {
            MessageToast.show("Please select a project");
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

    public async onDelete(event: Button$PressEvent): Promise<void> {
        const source = event.getSource();
        const listItem = source.getParent()?.getParent() as ListItem;
        const bindingContext = listItem.getBindingContext("dialog");
        
        if (!bindingContext) {
            return;
        }

        const project = bindingContext.getObject() as Project;
        const confirmed = await this.dialogManager.showConfirmationDialog(
            `Are you sure you want to delete project "${project.ProjectName}"?`
        );

        if (confirmed) {
            this.dialog.setBusy(true);
            try {
                await this.requests.deleteProject(project);
                MessageToast.show("Project deleted successfully");

                const index = this.data.projects.findIndex(
                    (p) => p.ProjectName === project.ProjectName
                );
                if (index > -1) {
                    this.data.projects.splice(index, 1);
                    this.updateDialogTitle();
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                MessageBox.error(`Error deleting project: ${errorMessage}`);
            } finally {
                this.dialog.setBusy(false);
            }
        }
    }

    private updateDialogTitle(): void {
        const table = this.getElement<Table>("idProjectsTable");
        const binding = table.getBinding("items") as ListBinding;
        const filteredLength = binding ? binding.getLength() : 0;
        this.dialog.setTitle(`Saved Projects (${filteredLength})`);
    }
} 