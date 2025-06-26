import MessageToast from "sap/m/MessageToast";
import DialogController from "../../util/DialogController";
import Util from "../../util/Util";
import IODataClient from "../../util/IODataClient";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class XmlCodeDialogController extends DialogController {
    data: {
        xml: string;
        viewMode: "xml" | "mermaid";
        selectedType: "entities" | "functions" | "actions";
        odataClient: IODataClient | null;
    } = {
        xml: "",
        viewMode: "xml",
        selectedType: "entities",
        odataClient: null
    }

    public onInit(): void {
        
    }


    onCopy() {
        void Util.copy2Clipboard(this.data.xml);
        MessageToast.show(this.getText("msg.copiedToClipboard"));
    }

    onDownload() {
        void Util.download(this.data.xml, "metadata.xml");
    }
}