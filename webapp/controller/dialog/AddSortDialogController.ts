import DialogController from "../../util/DialogController";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class AddSortDialogController extends DialogController {

    public data = {
        properties: [] as { key: string; text: string }[],
        directions: [
            { key: "asc", text: "Ascending" },
            { key: "desc", text: "Descending" }
        ],
        selectedProperty: "",
        selectedDirection: "asc"
    };
} 