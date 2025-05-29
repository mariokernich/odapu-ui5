import UIComponent from "sap/ui/core/UIComponent";
import DialogManager from "./util/DialogManager";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import ODataRequests from "./util/ODataRequests";
import * as Device from "sap/ui/Device";
import JSONModel from "sap/ui/model/json/JSONModel";
import { Model$RequestFailedEvent } from "sap/ui/model/Model";
import MessageBox from "sap/m/MessageBox";

/**
 * @namespace de.kernich.odpu
 */
export default class Component extends UIComponent {
	public static metadata = {
		manifest: "json",
	};

	private contentDensityClass: string;

	public dialogManager: DialogManager;
	public model: ODataModel;
	public requests: ODataRequests;

	public init(): void {
		super.init();

		this.setModel(new JSONModel(Device), "device");

		this.dialogManager = new DialogManager(this);
		this.model = this.getModel() as ODataModel;
		this.requests = new ODataRequests(this.model);

		this.model.attachRequestFailed({}, (event: Model$RequestFailedEvent) => {
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

		this.getRouter().initialize();
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
