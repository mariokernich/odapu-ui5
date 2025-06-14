import DialogController from "../../util/DialogController";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class AboutDialogController extends DialogController {
    data = {
        Version: "",
        RemoteVersion: "",
        UpdateAvailable: false,
        Logo: ""
    }
}