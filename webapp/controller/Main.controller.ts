import BaseController from "./BaseController";
import DialogManager from "../util/DialogManager";
import TabContainer from "sap/m/TabContainer";
import TabContainerItem from "sap/m/TabContainerItem";
import Fragment from "sap/ui/core/Fragment";
import OData from "./OData.controller";
import VBox from "sap/m/VBox";
import View from "sap/ui/core/mvc/View";
import APC from "./APC.controller";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace de.kernich.odpu.controller
 */
export default class Main extends BaseController {
	local = {
		githubIcon: sap.ui.require.toUrl("de/kernich/odpu/img/github-brands.svg"),
		linkedinIcon: sap.ui.require.toUrl(
			"de/kernich/odpu/img/linkedin-brands.svg"
		),
		odapuIcon: sap.ui.require.toUrl("de/kernich/odpu/img/odapu-logo.png"),
	};

	onTabContainerAddNewButtonPress() {
		void this.handleAddNewButtonPress();
	}

	onTabContainerItemClose() {}

	onInit() {
		super.onInit();

		void this.handleInit();

		this.getView().setModel(new JSONModel(this.local), "local");
	}

	private async handleInit() {
		const tabContainer = this.getTabContainer();

		const item = new TabContainerItem({
			name: "Untitled",
			additionalText: "ODATA",
			modified: false,
		});

		const id = "__" + new Date().getTime().toString();

		const controller = new OData(id);
		controller.component = this.getOwnerComponent();
		controller.getOwnerComponent = () => this.getOwnerComponent();
		controller.fragmentId = id;

		const fragment = await Fragment.load({
			name: "de.kernich.odpu.view.fragments.ODATA.Main",
			controller: controller,
			id: id,
		});

		controller.getView = () => fragment as unknown as View;

		item.addContent(
			new VBox({
				items: fragment,
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

	private setSelectedItem(item: TabContainerItem) {
		while (this.getTabContainer().getSelectedItem() !== item.getId()) {
			this.getTabContainer().setSelectedItem(item);
		}
	}

	private async handleAddNewButtonPress() {
		const projectType = await DialogManager.selectProjectType();
		console.log(projectType);

		const tabContainer = this.getTabContainer();

		const item = new TabContainerItem({
			name: "Untitled",
			additionalText: projectType,
			modified: false,
		});

		const id = "__" + new Date().getTime().toString();

		if (projectType === "ODATA") {
			const controller = new OData(id);
			controller.component = this.getOwnerComponent();
			controller.getOwnerComponent = () => this.getOwnerComponent();
			controller.fragmentId = id;

			const fragment = await Fragment.load({
				name: "de.kernich.odpu.view.fragments.ODATA.Main",
				controller: controller,
				id: id,
			});

			controller.getView = () => fragment as unknown as View;

			item.addContent(
				new VBox({
					items: fragment,
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

			tabContainer.setSelectedItem(item);
		}

		if (projectType === "APC") {
			const controller = new APC(id);
			controller.component = this.getOwnerComponent();
			controller.getOwnerComponent = () => this.getOwnerComponent();
			controller.fragmentId = id;

			const fragment = await Fragment.load({
				name: "de.kernich.odpu.view.fragments.APC.Main",
				controller: controller,
				id: id,
			});

			tabContainer.addItem(item);

			controller.getView = () => fragment as unknown as View;
			controller.onInit();

			item.addContent(
				new VBox({
					items: fragment,
					renderType: "Bare",
					fitContainer: true,
					height: "100%",
				})
			);

			controller.setTitle = (title: string) => {
				item.setName(title);
			};

			this.setSelectedItem(item);
		}
	}

	private getTabContainer() {
		return this.getView().byId("idTabContainer") as TabContainer;
	}
}
