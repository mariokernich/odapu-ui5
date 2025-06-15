import Dialog from "sap/m/Dialog";
import {
	PushChannelEntity,
	FilterRecord,
	MetadataEntityProperty,
	Project,
	ServiceEntity,
	InfoEntity,
} from "../Types";
import ManagedObject from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import Util from "./Util";
import Component from "../Component";
import ODataRequests from "./ODataRequests";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import DialogController from "./DialogController";
import SelectProjectDialogController from "../controller/dialog/SelectProjectDialogController";
import AboutDialogController from "../controller/dialog/AboutDialogController";
import XmlCodeDialogController from "../controller/dialog/XmlCodeDialogController";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import SaveProjectDialogController from "../controller/dialog/SaveProjectDialogController";
import ProjectListDialogController from "../controller/dialog/ProjectListDialogController";
import ConfirmationDialogController from "../controller/dialog/ConfirmationDialogController";
import UpdateAvailableDialogController from "../controller/dialog/UpdateAvailableDialogController";
import AddSortDialogController from "../controller/dialog/AddSortDialogController";
import AddFilterDialogController from "../controller/dialog/AddFilterDialogController";
import AddHeaderDialogController from "../controller/dialog/AddHeaderDialogController";
import PickCustomServiceDialogController from "../controller/dialog/PickCustomServiceDialogController";
import EditFilterDialogController from "../controller/dialog/EditFilterDialogController";
import PickApcDialogController from "../controller/dialog/PickApcDialogController";
import PickServiceDialogController from "../controller/dialog/PickServiceDialogController";

type DialogManagerEntry<TController extends DialogController> = {
	dialog: Dialog;
	controller: TController;
	promise: Promise<TController["data"]>;
};

type DialogConfigResult<T extends DialogController> = Promise<
	DialogManagerEntry<T>
>;

/**
 * @namespace de.kernich.odpu.util
 */
export default class DialogManager extends ManagedObject {
	private component: Component;
	private requests: ODataRequests;
	private fragmentPath = "de.kernich.odpu.view.dialogs";

	constructor(component: Component) {
		super();
		this.component = component;
		this.requests = new ODataRequests(component.getModel() as ODataModel);
	}

	public async pickApc(apc: PushChannelEntity[]): Promise<PushChannelEntity> {
		const { controller, dialog, promise } = await this.createDialog({
			fragmentName: "PickApcDialog",
			controllerClass: PickApcDialogController
		});

		const model = controller.getModel("dialog") as JSONModel;
		model.setProperty("/apc", apc);
		dialog.setTitle(`Select Push Channel (${apc.length})`);

		dialog.open();
		const result = await promise;
		
		return result.selectedApc as PushChannelEntity;
	}

	public async pickService(): Promise<ServiceEntity> {
		const { controller, dialog, promise } = await this.createDialog({
			fragmentName: "PickServiceDialog",
			controllerClass: PickServiceDialogController
		});

		const services = await this.requests.getServices();
		const model = controller.getModel("dialog") as JSONModel;
		model.setProperty("/services", services);
		dialog.setTitle(`Select Service (${services.length})`);

		dialog.open();
		const result = await promise;
		return result.selectedService as ServiceEntity;
	}

	public async pickCustomService(): Promise<ServiceEntity> {
		const { controller, dialog, promise } = await this.createDialog({
			fragmentName: "PickCustomServiceDialog",
			controllerClass: PickCustomServiceDialogController
		});

		dialog.open();
		const result = await promise;
		return {
			ServicePath: result.servicePath.trim(),
			ODataType: result.selectedType as "2" | "4",
			Version: "",
			ServiceName: "Custom Service"
		};
	}

	public async showAddHeaderDialog(): Promise<{
		key: string;
		value: string;
	}> {
		const { controller, dialog, promise } = await this.createDialog({
			fragmentName: "AddHeaderDialog",
			controllerClass: AddHeaderDialogController
		});

		dialog.open();
		const result = await promise;
		return {
			key: result.selectedType === "custom" ? result.selectedInputKey : result.selectedKey,
			value: result.selectedValue
		};
	}

	public async addFilter(
		properties: MetadataEntityProperty[]
	): Promise<FilterRecord> {
		const { controller, dialog, promise } = await this.createDialog({
			fragmentName: "AddFilterDialog",
			controllerClass: AddFilterDialogController
		});

		const model = controller.getModel("dialog") as JSONModel;
		model.setProperty("/properties", properties
			.filter(
				(x) =>
					x.name.toLowerCase() !== "delete_mc" &&
					x.name.toLowerCase() !== "update_mc" &&
					x.name.toLowerCase() !== "create_mc"
			)
			.map((p) => ({ key: p.name, text: p.name })));

		dialog.open();
		const result = await promise;
		return {
			property: result.selectedProperty,
			operator: result.selectedOperator,
			value: result.selectedValue
		};
	}

	public async editFilter(
		filter: FilterRecord,
		properties: MetadataEntityProperty[]
	): Promise<FilterRecord> {
		const { controller, dialog, promise } = await this.createDialog({
			fragmentName: "AddFilterDialog",
			controllerClass: EditFilterDialogController
		});

		const model = controller.getModel("dialog") as JSONModel;
		model.setProperty("/properties", properties
			.filter(
				(x) =>
					x.name.toLowerCase() !== "delete_mc" &&
					x.name.toLowerCase() !== "update_mc" &&
					x.name.toLowerCase() !== "create_mc"
			)
			.map((p) => ({ key: p.name, text: p.name })));

		model.setProperty("/selectedProperty", filter.property);
		model.setProperty("/selectedOperator", filter.operator);
		model.setProperty("/selectedValue", filter.value);

		dialog.open();
		const result = await promise;
		return {
			property: result.selectedProperty,
			operator: result.selectedOperator,
			value: result.selectedValue
		};
	}

	public async showConfirmationDialog(
		message: string
	): Promise<boolean> {
		const { controller, dialog, promise } = await this.createDialog({
			fragmentName: "ConfirmationDialog",
			controllerClass: ConfirmationDialogController
		});

		const model = controller.getModel("dialog") as JSONModel;
		model.setProperty("/message", message);

		dialog.open();
		const result = await promise;
		return result.confirmed;
	}

	public async showUpdateAvailableDialog() {
		const info = this.component.getModel("info") as JSONModel;
		const infoEntity = info.getData() as InfoEntity;

		const { controller, dialog } = await this.createDialog({
			fragmentName: "UpdateAvailableDialog",
			controllerClass: UpdateAvailableDialogController
		});

		const model = controller.getModel("dialog") as JSONModel;
		model.setProperty("/currentVersion", infoEntity.Version);
		model.setProperty("/latestVersion", infoEntity.RemoteVersion);
		model.setProperty("/releaseNotes", infoEntity.LatestReleaseBody || "No release notes available.");

		dialog.open();
	}

	public async showAboutDialog() {
		const info = this.component.getModel("info") as JSONModel;
		const infoEntity = info.getData() as InfoEntity;

		const { controller, dialog, promise } = await this.createDialog({
			fragmentName: "AboutDialog",
			controllerClass: AboutDialogController
		})

		const model = controller.getModel("dialog") as JSONModel;
		model.setProperty("/Version", infoEntity.Version);
		model.setProperty("/RemoteVersion", infoEntity.RemoteVersion);
		model.setProperty("/UpdateAvailable", infoEntity.UpdateAvailable);
		model.setProperty("/Logo", sap.ui.require.toUrl("de/kernich/odpu/img/odapu-logo.png"));

		dialog.open();

		return promise;
	}

	public async selectProjectType() {
		const { dialog, promise } = await this.createDialog({
			fragmentName: "SelectProjectType",
			controllerClass: SelectProjectDialogController
		})

		dialog.open();
		const result = await promise;
		return result.selectedType;
	}

	public async addSort(
		properties: MetadataEntityProperty[]
	): Promise<{ property: string; direction: "asc" | "desc" }> {
		const { controller, dialog, promise } = await this.createDialog({
			fragmentName: "AddSortDialog",
			controllerClass: AddSortDialogController
		});

		const model = controller.getModel("dialog") as JSONModel;
			model.setProperty("/properties", properties
				.filter(
					(x) =>
						x.name.toLowerCase() !== "delete_mc" &&
						x.name.toLowerCase() !== "update_mc" &&
						x.name.toLowerCase() !== "create_mc"
				)
				.map((p) => ({ key: p.name, text: p.name })));

		dialog.open();
		const result = await promise;
		return {
			property: result.selectedProperty,
			direction: result.selectedDirection as "asc" | "desc"
		};
	}

	public async showXmlCodeEditor(xml: string) {
		const { controller, dialog, promise } = await this.createDialog({
			fragmentName: "XmlCodeEditor",
			controllerClass: XmlCodeDialogController
		})

		const model = controller.getModel("dialog") as JSONModel;
		model.setProperty("/xml", Util.formatXml(xml));

		dialog.open();
		return promise;
	}

	public async showProjectListDialog(): Promise<Project> {
		const projects = await this.requests.getProjects();
		
		const { controller, dialog, promise } = await this.createDialog({
			fragmentName: "ProjectListDialog",
			controllerClass: ProjectListDialogController
		});

		const model = controller.getModel("dialog") as JSONModel;
		model.setProperty("/projects", projects);

		dialog.open();
		const result = await promise;
		return result.selectedProject as Project;
	}

	public async showSaveProjectDialog(): Promise<string> {
		const { dialog, promise } = await this.createDialog({
			fragmentName: "SaveProjectDialog",
			controllerClass: SaveProjectDialogController
		});

		dialog.open();
		const result = await promise;
		return result.projectName;
	}

	private getDialogId(params: { fragmentName: string; id?: string }): string {
        const dialogId = `${this.getMetadata()
            .getName()
            .replace(/\./g, "")}--${params.fragmentName.replace(/\//g, "")}`;

        if (params.id) {
            return `${dialogId}--${params.id}`;
        }

        return dialogId;
    }

	private async createDialog<TController extends DialogController>(options: {
        id?: string;
        fragmentName: string;
        controllerClass: new () => TController;
    }): DialogConfigResult<TController> {
        const dialogName = options.id || options.fragmentName;
        const dialogId = this.getDialogId(options);
        const controller = new options.controllerClass();

		const infoModel = this.component.getModel("info") as JSONModel;
		const i18nModel = this.component.getModel("i18n") as ResourceModel;

        await controller.init({
            path: this.fragmentPath + "/" + options.fragmentName,
            name: dialogName,
            id: dialogId,
			dialogManager: this,
			requests: this.requests,
			bundle: this.component.bundle
        });

		const promiseHelper = await controller.initPromise();

		controller.dialog.setModel(i18nModel, "i18n");
		controller.dialog.setModel(infoModel, "info");

        return {
            controller: controller,
            dialog: controller.dialog,
            promise: promiseHelper.promise
        };
    }
}
