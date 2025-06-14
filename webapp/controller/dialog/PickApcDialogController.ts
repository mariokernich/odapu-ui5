import DialogController from "../../util/DialogController";
import { PushChannelEntity } from "../../Types";
import { SearchField$LiveChangeEvent } from "sap/m/SearchField";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import ListBinding from "sap/ui/model/ListBinding";
import Table from "sap/m/Table";
import MessageToast from "sap/m/MessageToast";
import Context from "sap/ui/model/odata/v2/Context";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class PickApcDialogController extends DialogController {
    data = {
        apc: [] as PushChannelEntity[],
        selectedApc: null as PushChannelEntity | null
    };

    onSearch(event: SearchField$LiveChangeEvent) {
        const query = event.getParameter("newValue")?.toLowerCase() ?? "";
        const table = this.getElement<Table>("idApcTable");
        const binding = table.getBinding("items") as ListBinding;
        
        binding.filter(
            query
                ? new Filter({
                    filters: [
                        new Filter("ApplicationId", FilterOperator.Contains, query),
                        new Filter("Path", FilterOperator.Contains, query),
                    ],
                    and: false,
                })
                : []
        );

        const filteredLength = binding ? binding.getLength() : 0;
        this.dialog.setTitle(`Select Push Channel (${filteredLength})`);
    }

    onChoose() {
        const table = this.getElement<Table>("idApcTable");
        const selectedItem = table.getSelectedItem();

        if (!selectedItem) {
            MessageToast.show("Please select a push channel.");
            return;
        }

        const bindingContext = selectedItem.getBindingContext("dialog") as Context;
        const apc = bindingContext.getObject() as PushChannelEntity;
        this.data.selectedApc = apc;
        this.onConfirm();
    }
} 