import DialogController from "../../util/DialogController";
import MessageToast from "sap/m/MessageToast";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class SaveProjectDialogController extends DialogController {
	data = {
		projectName: "",
	};
	public onSave(): void {
		if (!this.data.projectName) {
			MessageToast.show(this.getText("msg.enterProjectName"));
			return;
		}
		this.onConfirm();
	}
}
