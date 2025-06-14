import DialogController from "../../util/DialogController";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class AddHeaderDialogController extends DialogController {
    public data = {
        selectedType: "custom",
        isCustomType: true,
        isPredefinedType: false,
        predefinedHeaders: [
            { key: "sap-client", text: "sap-client" },
            { key: "sap-language", text: "sap-language" },
            { key: "accept", text: "accept" },
            { key: "content-type", text: "content-type" },
            { key: "x-csrf-token", text: "x-csrf-token" }
        ],
        selectedKey: "sap-client",
        selectedInputKey: "",
        selectedValue: ""
    };

    public onHeaderTypeChange(): void {
        this.data.isCustomType = this.data.selectedType === "custom";
        this.data.isPredefinedType = this.data.selectedType === "predefined";
    }
} 