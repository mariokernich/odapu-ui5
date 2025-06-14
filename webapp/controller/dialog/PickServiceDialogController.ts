import DialogController from "../../util/DialogController";
import { ServiceEntity } from "../../Types";
import { SearchField$LiveChangeEvent } from "sap/m/SearchField";
import { Select$ChangeEvent } from "sap/m/Select";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import ListBinding from "sap/ui/model/ListBinding";
import Table from "sap/m/Table";
import MessageToast from "sap/m/MessageToast";
import Context from "sap/ui/model/odata/v2/Context";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class PickServiceDialogController extends DialogController {
    data = {
        services: [] as ServiceEntity[],
        odataTypes: [
            { key: "ALL", text: "All" },
            { key: "2", text: "2" },
            { key: "4", text: "4" }
        ],
        searchQuery: "",
        selectedODataType: "ALL",
        selectedService: null as ServiceEntity | null
    };

    onSearch(event: SearchField$LiveChangeEvent) {
        const query = event.getParameter("newValue")?.toLowerCase() ?? "";
        this.data.searchQuery = query;
        this.applyFilters();
    }

    onODataTypeChange(event: Select$ChangeEvent) {
        const selectedKey = event.getParameter("selectedItem")?.getKey() ?? "ALL";
        this.data.selectedODataType = selectedKey;
        this.applyFilters();
    }

    async onRefresh() {
        this.dialog.setBusy(true);
        try {
            const updatedServices = await this.requests.getServices();
            this.data.services = updatedServices;
            this.dialog.setTitle(`Select Service (${updatedServices.length})`);
            MessageToast.show("Services refreshed");
        } finally {
            this.dialog.setBusy(false);
        }
    }

    onChoose() {
        const table = this.getElement<Table>("idServiceTable");
        const selectedItem = table.getSelectedItem();

        if (!selectedItem) {
            MessageToast.show("Please select a service.");
            return;
        }

        const bindingContext = selectedItem.getBindingContext("dialog") as Context;
        const service = bindingContext.getObject() as ServiceEntity;
        this.data.selectedService = service;
        this.onConfirm();
    }

    async onCustomService() {
        try {
            const service = await this.dialogManager.pickCustomService();
            this.data.selectedService = service;
            this.onConfirm();
        } catch {
            // Ignore error as it's handled in pickCustomService
        }
    }

    private applyFilters() {
        const table = this.getElement<Table>("idServiceTable");
        const binding = table.getBinding("items") as ListBinding;
        const filters: Filter[] = [];

        // Add search filter if query exists
        if (this.data.searchQuery) {
            filters.push(
                new Filter({
                    filters: [
                        new Filter("ServiceName", FilterOperator.Contains, this.data.searchQuery),
                        new Filter("ServicePath", FilterOperator.Contains, this.data.searchQuery),
                    ],
                    and: false,
                })
            );
        }

        // Add OData type filter if not ALL
        if (this.data.selectedODataType !== "ALL") {
            filters.push(
                new Filter("ODataType", FilterOperator.EQ, this.data.selectedODataType)
            );
        }

        // Apply combined filters
        binding.filter(
            filters.length > 0 ? new Filter({ filters: filters, and: true }) : []
        );

        const filteredLength = binding ? binding.getLength() : 0;
        this.dialog.setTitle(`Select Service (${filteredLength})`);
    }
}