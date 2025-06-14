import DialogController from "../../util/DialogController";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class SelectProjectDialogController extends DialogController {
    data = {
        selectedType: ""
    }
    public onSelectOData() {
        this.data.selectedType = "ODATA";
        this.onConfirm();
    }
    public onSelectAPC() {
        this.data.selectedType = "APC";
        this.onConfirm();
    }
    public onShowAbout() {
        void this.dialogManager.showAboutDialog();
    }
}