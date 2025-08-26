import TabContainer from "sap/m/TabContainer";
import TabContainerItem from "sap/m/TabContainerItem";
import VBox from "sap/m/VBox";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import APC from "./APC.controller";
import BaseController from "./BaseController";
import OData from "./OData.controller";

/**
 * @namespace de.kernich.odpu.controller
 */
export default class Main extends BaseController {
	onTabContainerAddNewButtonPress() {
		void this.handleAddNewButtonPress();
	}

	onTabContainerItemClose() { }

	onInit() {
		super.onInit();
		void this.handleInit();
	}

	private async handleInit() {
		const tabContainer = this.getTabContainer();

		// Create tab item immediately for better UX
		const item = new TabContainerItem({
			name: this.getOwnerComponent().getText("app.untitled"),
			additionalText: "ODATA",
			modified: false,
		});

		const id = "__" + new Date().getTime().toString();

		// Load info and create controller/fragment in parallel
		const [info, fragment] = await Promise.all([
			this.loadInfo(),
			this.createODataControllerAndFragment(id)
		]);

		const controller = this.getControllerById(id);
		controller.getView = () => fragment as unknown as View;

		item.addContent(
			new VBox({
				items: fragment as Control,
				renderType: "Bare",
				fitContainer: true,
				height: "100%",
			})
		);

		tabContainer.addItem(item);

		controller.onInit();

		controller.setTitle = (title: string) => {
			item.setName(title);
		};

		this.setSelectedItem(item);
	}

	private async createODataControllerAndFragment(id: string): Promise<any> {
		const controller = new OData(id);
		controller.component = this.getOwnerComponent();
		controller.getOwnerComponent = () => this.getOwnerComponent();
		controller.fragmentId = id;

		// Store controller reference for later retrieval
		this.setControllerById(id, controller);

		return Fragment.load({
			name: "de.kernich.odpu.view.fragments.ODATA.Main",
			controller: controller,
			id: id,
		});
	}

	private controllerMap = new Map<string, any>();

	private setControllerById(id: string, controller: any): void {
		this.controllerMap.set(id, controller);
	}

	private getControllerById(id: string): any {
		return this.controllerMap.get(id);
	}

	private async loadInfo() {
		this.setBusy(true);
		try {
			const info = await this.getOwnerComponent().requests.getInfo();
			this.getOwnerComponent().setModel(new JSONModel(info), "info");

			if (info.UpdateAvailable) {
				void this.getOwnerComponent().dialogManager.showUpdateAvailableDialog();
			}
		} finally {
			this.setBusy(false);
		}
	}

	private setSelectedItem(item: TabContainerItem) {
		while (this.getTabContainer().getSelectedItem() !== item.getId()) {
			this.getTabContainer().setSelectedItem(item);
		}
	}

	private async handleAddNewButtonPress() {
		const projectType = await this.getOwnerComponent().dialogManager.selectProjectType();

		const tabContainer = this.getTabContainer();

		const item = new TabContainerItem({
			name: this.getOwnerComponent().getText("app.untitled"),
			additionalText: projectType,
			modified: false,
		});

		const id = "__" + new Date().getTime().toString();

		// Add tab immediately for better UX
		tabContainer.addItem(item);

		try {
			let fragment: any;
			let controller: any;

			if (projectType === "ODATA") {
				fragment = await this.createODataControllerAndFragment(id);
				controller = this.getControllerById(id);
			} else if (projectType === "APC") {
				fragment = await this.createAPCControllerAndFragment(id);
				controller = this.getControllerById(id);
			}

			controller.getView = () => fragment as unknown as View;

			item.addContent(
				new VBox({
					items: fragment as any,
					renderType: "Bare",
					fitContainer: true,
					height: "100%",
				})
			);

			controller.onInit();

			controller.setTitle = (title: string) => {
				item.setName(title);
			};

			tabContainer.setSelectedItem(item);
		} catch (error) {
			// Remove tab if loading failed
			tabContainer.removeItem(item);
			throw error;
		}
	}

	private async createAPCControllerAndFragment(id: string): Promise<any> {
		const controller = new APC(id);
		controller.component = this.getOwnerComponent();
		controller.getOwnerComponent = () => this.getOwnerComponent();
		controller.fragmentId = id;

		// Store controller reference for later retrieval
		this.setControllerById(id, controller);

		return Fragment.load({
			name: "de.kernich.odpu.view.fragments.APC.Main",
			controller: controller,
			id: id,
		});
	}

	private getTabContainer() {
		return this.getView()?.byId("idTabContainer") as TabContainer;
	}
}
