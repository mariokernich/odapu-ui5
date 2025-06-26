import UIComponent from "sap/ui/core/UIComponent";
import DialogManager from "./util/DialogManager";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import ODataRequests from "./util/ODataRequests";
import Device from "sap/ui/Device";
import JSONModel from "sap/ui/model/json/JSONModel";
import { Model$RequestFailedEvent } from "sap/ui/model/Model";
import MessageBox from "sap/m/MessageBox";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";

/**
 * @namespace de.kernich.odpu
 */
export default class Component extends UIComponent {
	public static metadata = {
		manifest: "json",
	};

	private contentDensityClass = "";
	public dialogManager!: DialogManager;
	public model!: ODataModel;
	public requests!: ODataRequests;
	public bundle!: ResourceBundle;

	public init(): void {
		super.init();

		this.setModel(new JSONModel(Device), "device");

		this.dialogManager = new DialogManager(this);
		this.model = this.getModel() as ODataModel;
		this.requests = new ODataRequests(this.model);

		void this.handleInitAsync();
	}

	private async handleInitAsync() {
		this.registerErrorHandler(this.model);
		this.setIconModel();

		this.bundle = await (this.getModel("i18n") as ResourceModel).getResourceBundle();

		this.getRouter().initialize();
	}

	private registerErrorHandler(model: ODataModel) {
		model.attachRequestFailed({}, (event: Model$RequestFailedEvent) => {
			const parameters = event.getParameters() as {
				response: {
					responseText: string;
				};
			};
			const responseText = parameters.response.responseText;

			if (responseText.startsWith("<?xml")) {
				// Handle XML response
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(responseText, "text/xml");
				const messageNode = xmlDoc.getElementsByTagName("message")[0];
				if (messageNode) {
					MessageBox.error(messageNode.textContent);
				} else {
					MessageBox.error("Unknown error occurred");
				}
			} else {
				// Handle JSON response
				const json = JSON.parse(responseText) as {
					error: {
						code: string;
						message: {
							lang: string;
							value: string;
						};
						innererror: {
							errordetails: {
								message: string;
								code: string;
								severity: "Error" | "Warning" | "Information";
							}[];
						};
					};
				};
				MessageBox.error(json.error.message.value);
			}
		});
	}

	public getText(key: string, args?: string[]) {
		return this.bundle.getText(key, args) ?? key;
	}

	private setIconModel() {
		this.setModel(new JSONModel({
			githubIcon: sap.ui.require.toUrl("de/kernich/odpu/img/github-brands.svg"),
			linkedinIcon: sap.ui.require.toUrl(
				"de/kernich/odpu/img/linkedin-brands.svg"
			),
			odapuIcon: sap.ui.require.toUrl("de/kernich/odpu/img/odapu-logo.png"),
		}), "icons");
	}

	/**
	 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
	 * design mode class should be set, which influences the size appearance of some controls.
	 * @public
	 * @returns css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
	 */
	public getContentDensityClass(): string {
		if (this.contentDensityClass === undefined) {
			// check whether FLP has already set the content density class; do nothing in this case
			if (
				document.body.classList.contains("sapUiSizeCozy") ||
				document.body.classList.contains("sapUiSizeCompact")
			) {
				this.contentDensityClass = "";
			} else if (!Device.support.touch) {
				// apply "compact" mode if touch is not supported
				this.contentDensityClass = "sapUiSizeCompact";
			} else {
				// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
				this.contentDensityClass = "sapUiSizeCozy";
			}
		}
		return this.contentDensityClass;
	}
}
