import MessageToast from "sap/m/MessageToast";
import DialogController from "../../util/DialogController";
import Util from "../../util/Util";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class XmlCodeDialogController extends DialogController {
    data = {
        xml: "",
    }
    onCopy() {
        void Util.copy2Clipboard(this.data.xml);
        MessageToast.show("Copied to clipboard");
    }

    onDownload() {
        void Util.download(this.data.xml, "metadata.xml");
    }
}