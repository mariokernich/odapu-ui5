import DialogController from "../../util/DialogController";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class UpdateAvailableDialogController extends DialogController {
    data = {
        currentVersion: "",
        latestVersion: "",
        releaseNotes: ""
    };

    public onGetUpdate(): void {
        window.open(
            "https://github.com/mariokernich/odapu-abap/releases/latest",
            "_blank"
        );
        this.onClose();
    }

    public onClose(): void {
        this.onCancel();
    }
} 