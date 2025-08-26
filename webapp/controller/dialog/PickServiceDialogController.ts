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
import JSONModel from "sap/ui/model/json/JSONModel";
import { Button$PressEvent } from "sap/m/Button";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class PickServiceDialogController extends DialogController {
	data = {
		services: [] as ServiceEntity[],
		odataTypes: [] as { key: string; text: string }[],
		searchQuery: "",
		selectedODataType: "ALL",
		selectedService: null as ServiceEntity | null,
	};

	onInit() {
		this.data.odataTypes = [
			{ key: "ALL", text: this.getText("lbl.all") },
			{ key: "2", text: "2" },
			{ key: "4", text: "4" },
		];
		void this.handleInit();
	}

	private async handleInit() {
		this.dialog.setBusy(true);
		try {
			const services = await this.requests.getServices();
			const model = this.getModel("dialog") as JSONModel;
			model.setProperty("/services", services);
			this.dialog.setTitle(this.getText("dlg.title.selectService") + ` (${services.length})`);
		} finally {
			this.dialog.setBusy(false);
		}
	}

	onSearch(event: SearchField$LiveChangeEvent) {
		const query = event.getParameter("newValue")?.toLowerCase() ?? "";
		const table = this.getElement<Table>("idServicesTable");
		const binding = table.getBinding("items") as ListBinding;

		binding.filter(
			query
				? new Filter({
						filters: [
							new Filter("ServiceName", FilterOperator.Contains, query),
							new Filter("ServicePath", FilterOperator.Contains, query),
						],
						and: false,
				  })
				: []
		);

		const filteredLength = binding ? binding.getLength() : 0;
		this.dialog.setTitle(this.getText("dlg.title.selectService") + ` (${filteredLength})`);
	}

	onODataTypeChange(event: Select$ChangeEvent) {
		const selectedKey = event.getParameter("selectedItem")?.getKey() ?? "ALL";
		this.data.selectedODataType = selectedKey;
		this.applyFilters();
	}

	onRefresh() {
		void this.handleRefresh();
	}

	async handleRefresh() {
		this.dialog.setBusy(true);
		try {
			const model = this.getModel("dialog") as JSONModel;
			const services = await this.requests.getServices({ refresh: true });
			model.setProperty("/services", services);
			MessageToast.show(this.getText("msg.servicesRefreshed"));
		} finally {
			this.dialog.setBusy(false);
		}
	}

	onChoose() {
		const table = this.getElement<Table>("idServicesTable");
		const selectedItem = table.getSelectedItem();

		if (!selectedItem) {
			MessageToast.show(this.getText("msg.selectService"));
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
		const table = this.getElement<Table>("idServicesTable");
		const binding = table.getBinding("items") as ListBinding;
		const filters: Filter[] = [];

		// Add search filter if query exists
		if (this.data.searchQuery) {
			filters.push(
				new Filter(
					"ServiceName",
					FilterOperator.Contains,
					this.data.searchQuery
				),
				new Filter(
					"ServicePath",
					FilterOperator.Contains,
					this.data.searchQuery
				)
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
		this.dialog.setTitle(this.getText("dlg.title.selectService") + ` (${filteredLength})`);
	}

	onFavorite(isFavorite: boolean, event: Button$PressEvent) {
		const binding = event.getSource().getBindingContext("dialog") as Context;
		const service = binding.getObject() as ServiceEntity;
		void this.handleFavorite(service, isFavorite);
	}

	async handleFavorite(service: ServiceEntity, isFavorite: boolean) {
		this.dialog.setBusy(true);
		try {
			await this.requests.markAsFavorite({
				servicePath: service.ServicePath,
				isFavorite: isFavorite,
			});
			await this.handleRefresh();
		} finally {
			this.dialog.setBusy(false);
		}
	}
}
