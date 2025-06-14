import DialogController from "../../util/DialogController";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class ConfirmationDialogController extends DialogController {
    data = {
        message: "",
        confirmed: false
    };

    public onConfirm(): void {
        this.data.confirmed = true;
        this.onConfirm();
    }

    public onCancel(): void {
        this.data.confirmed = false;
        this.onCancel();
    }
} 