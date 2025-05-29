import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseController from "./BaseController";
import Dialog from "sap/m/Dialog";
import Button, { Button$PressEvent } from "sap/m/Button";
import JSONModel from "sap/ui/model/json/JSONModel";
import Label from "sap/m/Label";
import MessageToast from "sap/m/MessageToast";
import {
	FilterRecord,
	MainViewModel,
	MetadataFunction,
	Project,
	RequestHeader,
	RequestHistory,
	SelectedFunctionModel,
	SelectedServiceModel,
	ServiceEntity,
} from "../Types";
import Constants from "../Constants";
import Input from "sap/m/Input";
import VBox from "sap/m/VBox";
import MessageBox from "sap/m/MessageBox";
import Util from "../util/Util";
import Device from "sap/ui/Device";
import Control from "sap/ui/core/Control";
import OData2Client from "../util/OData2Client";
import IODataClient from "../util/IODataClient";
import OData4Client from "../util/OData4Client";
import Filter from "sap/ui/model/Filter";
import Core from "sap/ui/core/Core";
import Table from "sap/m/Table";
import Column from "sap/m/Column";
import Text from "sap/m/Text";
import ColumnListItem from "sap/m/ColumnListItem";
import HBox from "sap/m/HBox";
import Icon from "sap/ui/core/Icon";
import { Input$ChangeEvent } from "sap/ui/webc/main/Input";
import Sorter from "sap/ui/model/Sorter";

/**
 * @namespace de.kernich.odpu.controller
 */
export default class OData extends BaseController {
	private selectedService: SelectedServiceModel = {
		service: null,
		entities: null,
		actions: null,
	};

	private localData: MainViewModel = {
		resourceType: "entity",
		selectedEntityName: "",
		selectedFunctionName: "",
		response: "",
		selectedMethod: "GET",
		selectedServiceFunctions: [],
		selectedEntityProperties: {
			properties: [],
			keyProperties: [],
		},
		entityCount: 0,
		functionCount: 0,
		actionCount: 0,
		top: 10,
		skip: 0,
		dark: false,
		statusCode: 0,
		view: "odata",
		folderTreeIcon: sap.ui.require.toUrl(
			"de/kernich/odpu/img/folder-tree-light.svg"
		),
		dataViewMode: "json",
		selectedServiceActions: [],
	};
	private odataClient?: IODataClient;
	public fragmentId: string = "";

	onInit() {
		super.onInit();
		void this.handleInit();
		this.registerModels();
	}

	private registerModels() {
		this.getView().setModel(new JSONModel(this.localData, true), "local");
		this.getView().setModel(
			new JSONModel(this.selectedService, true),
			"selectedService"
		);
		this.getView().setModel(
			new JSONModel({
				name: "",
				returnType: "",
				entitySet: "",
				method: "GET",
				parameters: [],
			} as SelectedFunctionModel, true),
			"selectedFunction"
		);
		this.getView().setModel(
			new JSONModel([], true),
			"entityFilters"
		);
		this.getView().setModel(
			new JSONModel([], true),
			"entitySorting"
		);
		this.getView().setModel(
			new JSONModel([], true),
			"requestHistory"
		);
		this.getView().setModel(
			new JSONModel([], true),
			"requestHeaders"
		);
	}

	private async handleInit() {
		await this.getGlobalModel().dataLoaded();
		this.setBusy(true);
		
		const model = this.getOwnerComponent().getModel() as ODataModel;
		await model.metadataLoaded(true);
		model.setSizeLimit(Constants.SERVICE_QUERY_LIMIT);

		this.setBusy(false);

		if (!Device.support.websocket) {
			MessageToast.show("Note: WebSocket not supported");
		}
	}

	/**
	 * Event handler: Select service
	 */
	onSelectService() {
		void this.handleServiceSelection();
	}

	/**
	 * Event handler: Entity selection changed
	 */
	onSelectEntity() {
		this.handleEntityChanged();
	}

	/**
	 * Event handler: Function selection changed
	 */
	onSelectFunction() {
		this.handleFunctionChanged();
	}

	/**
	 * Event handler: Add filter button pressed
	 */
	onAddFilterButtonPress() {
		void this.handleAddFilter();
	}

	/**
	 * Event handler: Add sorter button pressed
	 */
	onAddSortButtonPress() {
		void this.handleAddSort();
	}

	/**
	 * Event handler: Delete sorter button pressed
	 */
	onButtonSortDeletePress(event: Button$PressEvent) {
		const binding = event.getSource().getBindingContext("entitySorting");
		const obj = binding.getObject() as { property: string; direction: "asc" | "desc" };
		void this.handleButtonSortDeletePress(obj);
	}

	/**
	 * Event handler: Execute request
	 */
	onSendRequest() {
		this.clearResult();
		if (this.localData.resourceType === "entity") {
			switch (this.localData.selectedMethod) {
				case "GET":
					void this.execEntityRead();
					break;
				case "GETBY":
					void this.execEntityGetSingle();
					break;
				case "POST":
					void this.execEntityCreate();
					break;
				case "DELETE":
					void this.execEntityDelete();
					break;
			}
		} else if (this.localData.resourceType === "function") {
			void this.execFunctionRequest();
		} else {
			throw new Error(`Unknown resource type: ${this.localData.resourceType}`);
		}
	}

	/**
	 * Event handler: Show metadata button pressed
	 */
	public onShowMetadata() {
		const xml = this.odataClient?.getMetadataText();
		void this.component.dialogManager.showXmlCodeEditor(xml);
	}

	/**
	 * Event handler: Add header button pressed
	 */
	onAddHeader() {
		void this.handleAddHeader();
	}

	/**
	 * Event handler: Save configuration button pressed
	 */
	onButtonSaveConfigurationPress() {
		void this.handleSaveConfiguration();
	}

	/**
	 * Event handler: Load configuration button pressed
	 */
	onButtonLoadConfigurationPress() {
		void this.handleLoadConfiguration();
	}

	/**
	 * Selected service and load data from selected service
	 * This will load entities, functions and actions
	 */
	private async handleServiceSelection() {
		const service = await this.pickService();
		await this.loadService(service);
	}

	private async loadService(service: ServiceEntity) {
		this.setBusy(true);
		try {
			this.selectedService.service = service;
			this.setTitle(service.ServiceName);

			this.localData.selectedEntityName = "";
			this.localData.selectedFunctionName = "";
			this.localData.selectedServiceFunctions = [];
			this.localData.resourceType = "entity";
			this.localData.selectedMethod = "GET";

			this.odataClient?.destroy();
			this.odataClient = undefined;

			// based on ODATA version, create the correct client
			switch (service.ODataType) {
				case "2":
					this.odataClient = new OData2Client(service.ServicePath);
					break;
				case "4":
					this.odataClient = new OData4Client(service.ServicePath);
					break;
				default:
					MessageToast.show("Service Type not supported");
					break;
			}

			await this.odataClient.initAsync();
			this.handleServiceSelected();
		} finally {
			this.setBusy(false);
		}
	}

	private handleServiceSelected() {
		this.setBusy(true);
		try {
			this.resetFilters();
			this.resetSorting();
			this.resetEntityInputs();

			this.selectedService.entities = this.odataClient?.getEntities() || [];
			this.localData.selectedServiceFunctions =
				this.odataClient?.getFunctions() || [];

			this.localData.selectedServiceActions =
				this.odataClient?.getActions() || [];

			this.localData.entityCount = this.selectedService.entities.length;
			this.localData.functionCount =
				this.localData.selectedServiceFunctions.length;
			this.localData.actionCount = this.localData.selectedServiceActions.length;
			if (this.selectedService.entities.length > 0) {
				this.localData.selectedEntityName = this.selectedService.entities[0].name;
				this.handleEntityChanged();
			}

			if (this.localData.selectedServiceFunctions.length > 0) {
				this.localData.selectedFunctionName =
					this.localData.selectedServiceFunctions[0].name;
				this.handleFunctionChanged();
			}
		} finally {
			this.setBusy(false);
		}
	}

	/**
	 * Show dialog to pick an ODATA service
	 */
	private async pickService() {
		this.setBusy(true);
		try {
			const services = await this.component.requests.getServices();
			return await this.component.dialogManager.pickService(services);
		} finally {
			this.setBusy(false);
		}
	}

	/**
	 * Load data of selected entity to selectedService model
	 */
	private handleEntityChanged() {
		this.resetFilters();
		this.resetSorting();
		this.resetEntityInputs();
		const properties = this.selectedService.entities.find(
			(entity) => entity.name === this.localData.selectedEntityName
		)?.properties;
		this.localData.selectedEntityProperties.properties = properties || [];
		this.localData.selectedEntityProperties.keyProperties =
			this.selectedService.entities.find(
				(entity) => entity.name === this.localData.selectedEntityName
			)?.keys || [];

		this.localData.selectedEntityProperties.properties =
			this.localData.selectedEntityProperties.properties.filter(
				(property) =>
					!this.localData.selectedEntityProperties.keyProperties.some(
						(keyProperty) => keyProperty.name === property.name
					)
			);
	}

	/**
	 * Load data of selected function to selectedFunction model
	 */
	private handleFunctionChanged() {
		this.resetFunctionInputs();
		
		const selectedFunction = this.localData.selectedServiceFunctions.find(
			(func) => func.name === this.localData.selectedFunctionName
		);

		(this.getView().getModel("selectedFunction") as JSONModel).setProperty("/", selectedFunction);
	}

	private async execEntityCreate() {
		this.setBusy(true);
		try {
			const properties = this.getEntityPropertyValues();
			const keyProperties = properties.keyProperties;
			const allProperties = { ...properties.properties, ...keyProperties };
			await this.odataClient?.createEntity(
				this.localData.selectedEntityName,
				allProperties
			);
			this.localData.response = "";
		} catch (error) {
			MessageBox.error((error as Error).toString());
		} finally {
			this.setBusy(false);
		}
	}

	private async execEntityDelete() {
		this.setBusy(true);
		const properties = this.getEntityPropertyValues();

		if (Object.values(properties.keyProperties).some((value) => value === "")) {
			MessageBox.error(
				"Please enter value for key properties: " +
					Object.keys(properties.keyProperties).join(", ")
			);
			this.setBusy(false);
			return;
		}

		await this.odataClient?.deleteEntity(
			this.localData.selectedEntityName,
			properties.keyProperties
		);
		this.localData.response = "";
		this.setBusy(false);
	}

	private async execEntityGetSingle() {
		this.setBusy(true);

		try {
			const properties = this.getEntityPropertyValues();

			if (
				Object.values(properties.keyProperties).some((value) => value === "")
			) {
				const emptyKeyProperties = Object.keys(properties.keyProperties).filter(
					(key) => properties.keyProperties[key] === ""
				);
				MessageBox.error(
					"Please enter value for key properties: " +
						emptyKeyProperties.join(", ")
				);
				this.setBusy(false);
				return;
			}

			const data = await this.odataClient?.getEntity(
				this.localData.selectedEntityName,
				properties.keyProperties
			);
			this.localData.response = JSON.stringify(data, null, 2);
			this.setTableResponse(data);
		} finally {
			this.setBusy(false);
		}
	}

	private async execEntityRead() {
		this.setBusy(true);

		const headers = this.getHeaders();
		const filters = (this.getView().getModel("entityFilters") as JSONModel).getProperty("/") as FilterRecord[];
		const sorting = (this.getView().getModel("entitySorting") as JSONModel).getProperty("/") as { property: string; direction: "asc" | "desc" }[];

		try {
			const response = await this.odataClient?.readEntity({
				entityName: this.localData.selectedEntityName,
				filters: filters.map((filter) => {
					return new Filter(filter.property, filter.operator, filter.value);
				}),
				sorting: sorting.map((sort) => new Sorter(sort.property, sort.direction === "desc")),
				headers: headers,
				top: this.localData.top,
				skip: this.localData.skip,
			});
			this.localData.response = JSON.stringify(response, null, 2);
			this.setTableResponse(response);

			const history = (this.getView().getModel("requestHistory") as JSONModel).getProperty("/") as RequestHistory[];

			history.push({
				method: "READ",
				entity: this.localData.selectedEntityName,
				timestamp: new Date().toISOString(),	
				statusCode: 200,
				response: this.localData.response,
			});

			(this.getView().getModel("requestHistory") as JSONModel).setProperty(
				"/",
				history
			);
		} finally {
			this.setBusy(false);
		}
	}

	private getResultTable() {
		return this.getById("idResponseTable") as Table;
	}

	private clearResult() {
		const table = this.getResultTable();
		table.removeAllColumns();
		table.removeAllItems();
		this.localData.response = "";
	}

	private setTableResponse(data: unknown) {
		const table = this.getById("idResponseTable") as Table;

		const propertiesMerged = {
			...this.localData.selectedEntityProperties.properties,
			...this.localData.selectedEntityProperties.keyProperties,
		};
		const properties = [];
		// fill properties with name and isKey flag
		const keys = Object.keys(propertiesMerged);
		for (const key of keys) {
			properties.push({
				name: propertiesMerged[key].name,
				isKey: this.localData.selectedEntityProperties.keyProperties.some(
					(keyProp) => keyProp.name === propertiesMerged[key].name
				),
			});
		}

		// Handle different data formats
		let items: Record<string, unknown>[] = [];
		if (Array.isArray(data)) {
			items = data as Record<string, unknown>[];
		} else if (data && typeof data === "object") {
			const dataObj = data as Record<string, unknown>;
			if ("results" in dataObj && Array.isArray(dataObj.results)) {
				items = dataObj.results as Record<string, unknown>[];
			} else {
				items = [dataObj];
			}
		}

		if (items.length === 0) {
			return;
		}

		// Create columns with calculated widths
		
		for (const property of properties) {
			// Calculate header text length
			const headerText = property.name;
			let maxLength = headerText.length;

			// Find longest value in this column
			items.forEach((item) => {
				const value = item[property.name];
				let displayValue = "";
				if (value !== null && value !== undefined) {
					if (typeof value === "object") {
						displayValue = JSON.stringify(value, null, 2);
					} else {
						displayValue = String(value);
					}
				}
				maxLength = Math.max(maxLength, displayValue.length);
			});

			// Calculate width based on content
			// 8px per character for monospace font
			// Add 16px padding (8px on each side)
			const columnWidth = (maxLength * 10) + 16;

			// Create header with optional key icon
			const headerContent = new VBox({
				items: [
					new HBox({
						items: [
							property.isKey ? new Icon({
								src: "sap-icon://key",
							}).addStyleClass("sapUiTinyMarginEnd") : null,
							new Text({ text: headerText })
						].filter(Boolean),
						alignItems: "Center",
					})
				]
			});

			table.addColumn(new Column({
				header: headerContent,
				width: `${columnWidth}px`,
			}));
		}

		for (const item of items) {
			const cells = properties.map((property) => {
				const value = item[property.name];
				let displayValue = "";
				if (value !== null && value !== undefined) {
					if (typeof value === "object") {
						displayValue = JSON.stringify(value, null, 2);
					} else {
						displayValue = String(value);
					}
				}
				return new Text({ text: displayValue });
			});

			table.addItem(new ColumnListItem({
				cells: cells,
			}));
		}
	}

	private async execFunctionRequest() {
		this.setBusy(true);
		try {
			const fn = (this.getView().getModel("selectedFunction") as JSONModel).getProperty("/") as MetadataFunction;
			const parameters = this.getFunctionParameterValues();

			const response = await this.odataClient?.executeFunction({
				functionName: fn.name,
				parameters: parameters,
				method: fn.method,
			});
			
			this.localData.response = JSON.stringify(response, null, 2);
		} finally {
			this.setBusy(false);
		}
	}

	private resetFilters() {
		(this.getView().getModel("entityFilters") as JSONModel).setProperty("/", []);
	}

	private resetSorting() {
		(this.getView().getModel("entitySorting") as JSONModel).setProperty("/", []);
	}

	private async handleAddFilter() {
		const entity = this.selectedService.entities.find(
			(e) => e.name === this.localData.selectedEntityName
		);
		if (!entity) {
			MessageBox.error("Entity not found");
			return;
		}
		const filter = await this.component.dialogManager.addFilter(
			entity.properties
		);
		const filters = (this.getView().getModel("entityFilters") as JSONModel).getProperty("/") as FilterRecord[];

		const conflict = filters.find(f => f.property === filter.property && f.operator === filter.operator && f.value === filter.value);
		if (conflict) {
			MessageBox.error("Conflict with existing record");
			return;
		}

		filters.push(filter);
		(this.getView().getModel("entityFilters") as JSONModel).setProperty("/", filters);
	}

	private async handleAddHeader() {
		const header = await this.component.dialogManager.showAddHeaderDialog();
		const headers = (this.getView().getModel("requestHeaders") as JSONModel).getProperty("/") as RequestHeader[];
		const existingHeader = headers.find(
			(h) => h.key === header.key
		);
		if (existingHeader) {
			MessageBox.error(
				`Header with key ${header.key} already exists. Please use a different key.`
			);
		} else {
			headers.push({
				key: header.key,
				value: header.value,
			});
			(this.getView().getModel("requestHeaders") as JSONModel).setProperty("/", headers);
		}
	}

	onEditHeader(event: Button$PressEvent) {
		const binding = event.getSource().getBindingContext("requestHeaders");
		const headers = (this.getView().getModel("requestHeaders") as JSONModel).getProperty("/") as RequestHeader[];
		const obj = binding.getObject() as { key: string; value: string };

		const submit = () => {
			if (valueInput.getValue() === "") {
				MessageToast.show("Please enter a value.");
				return;
			}
			const index = headers.findIndex(
				(header) => header.key === obj.key
			);
			if (index > -1) {
				headers[index].value = valueInput.getValue();
				(this.getView().getModel("requestHeaders") as JSONModel).setProperty("/", headers);
			}
			dialog.close();
			dialog.destroy();
		};
		const valueInput = new Input({
			value: obj.value,
			submit: submit,
		});
		const dialog = new Dialog({
			title: "Edit Value of " + obj.key,
			contentWidth: "400px",
			content: [
				new VBox({
					items: [
						new Label({ text: "Value" }),
						valueInput.addStyleClass("sapUiSmallMarginBottom"),
					],
				}).addStyleClass("sapUiSmallMargin"),
			],
		});
		dialog.setEndButton(
			new Button({
				text: "Save",
				press: submit,
				type: "Accept",
				icon: "sap-icon://accept",
			})
		);
		dialog.open();
		valueInput.selectText(0, obj.value.length);
	}

	onDeleteHeader(event: Button$PressEvent) {
		const binding = event.getSource().getBindingContext("requestHeaders");
		const obj = binding.getObject() as { key: string; value: string };
		const headers = (this.getView().getModel("requestHeaders") as JSONModel).getProperty("/") as RequestHeader[];
		const index = headers.findIndex(
			(header) => header.key === obj.key
		);
		if (index > -1) {
			headers.splice(index, 1);
		}
		(this.getView().getModel("requestHeaders") as JSONModel).setProperty("/", headers);
	}

	private getHeaders() {
		const headers: Record<string, string> = {};
		const headerValues = (this.getView().getModel("requestHeaders") as JSONModel).getProperty("/") as RequestHeader[];
		headerValues.forEach((header) => {
			headers[header.key] = header.value;
		});
		return headers;
	}

	onCopyTodpupboard() {
		void this.handleCopy();
	}

	private async handleCopy() {
		const response = this.localData.response;
		if (response) {
			await Util.copy2Clipboard(response);
			MessageToast.show("Response copied to clipboard");
		} else {
			MessageToast.show("No response to copy");
		}
	}

	private values: Record<string, string | number | boolean> = {};
	public onInputPropertyChange(event: Input$ChangeEvent): void {
		const source = event.getSource();
		const propertyName = source.getName();
		const value = source.getValue();
		this.values[propertyName] = value;
	}

	private getById(id: string): Control | undefined {
		const fragmentId = this.fragmentId;
		const globalId = `${fragmentId}--${id}`;

		const control = Core.byId(globalId);
		return control as Control;
	}

	private getFunctionParameterValues() {
		const parametersVbox = this.getById("idParametersVBox") as VBox;
		const parameterInputs = Util.getAllInputValues(parametersVbox);
		return parameterInputs;
	}

	private getEntityPropertyValues() {
		const propertiesVbox = this.getById("idPropertiesVBox") as VBox;
		const keyPropertiesVbox = this.getById("idKeyPropertiesVBox") as VBox;
		const propertyInputs = Util.getAllInputValues(propertiesVbox);
		const keyPropertyInputs = Util.getAllInputValues(keyPropertiesVbox);

		return {
			properties: propertyInputs,
			keyProperties: keyPropertyInputs,
		};
	}

	private resetEntityInputs() {
		const propertiesVbox = this.getById("idPropertiesVBox") as VBox;
		const keyPropertiesVbox = this.getById("idKeyPropertiesVBox") as VBox;
		Util.resetInputs(propertiesVbox);
		Util.resetInputs(keyPropertiesVbox);
	}

	private resetFunctionInputs() {
		const parametersVbox = this.getById("idParametersVBox") as VBox;
		Util.resetInputs(parametersVbox);
	}

	onButtonFilterDeletePress(event: Button$PressEvent) {
		const binding = event.getSource().getBindingContext("entityFilters");
		const obj = binding.getObject() as FilterRecord;
		void this.handleButtonFilterDeletePress(obj);
	}

	onButtonFilterEditPress(event: Button$PressEvent) {
		const binding = event.getSource().getBindingContext("entityFilters");
		const obj = binding.getObject() as FilterRecord;
		void this.handleButtonFilterEditPress(obj);
	}

	private handleButtonFilterDeletePress(obj: FilterRecord) {
		const filters = (this.getView().getModel("entityFilters") as JSONModel).getProperty("/") as FilterRecord[];
		const filteredList = filters.filter(
			(filter) => filter.property !== obj.property && filter.operator !== obj.operator && filter.value !== obj.value
		);
		(this.getView().getModel("entityFilters") as JSONModel).setProperty(
			"/",
			filteredList
		);
	}

	private async handleButtonFilterEditPress(obj: FilterRecord) {
		const entity = this.selectedService.entities.find(
			(e) => e.name === this.localData.selectedEntityName
		);
		if (!entity) {
			MessageBox.error("Entity not found");
			return;
		}
		const filters = (this.getView().getModel("entityFilters") as JSONModel).getProperty("/") as FilterRecord[];
		const index = filters.findIndex(f => f.property === obj.property && f.operator === obj.operator && f.value === obj.value);
		const updated = await this.component.dialogManager.editFilter(obj, entity.properties);

		const conflict = filters.find(f => f.property === updated.property && f.operator === updated.operator && f.value === updated.value);
		if (conflict) {
			MessageBox.error("Conflict with existing record");
			return;
		}

		filters[index] = updated;
		(this.getView().getModel("entityFilters") as JSONModel).setProperty("/", filters);
	}

	onButtonViewResponsePress(event: Button$PressEvent) {
		const binding = event.getSource().getBindingContext("requestHistory");
		const historyItem = binding.getObject() as RequestHistory;
		this.localData.response = historyItem.response;
	}

	private async handleAddSort() {
		const entity = this.selectedService.entities.find(
			(e) => e.name === this.localData.selectedEntityName
		);
		if (!entity) {
			MessageBox.error("Entity not found");
			return;
		}

		const sort = await this.component.dialogManager.addSort(
			entity.properties
		);

		const sorting = (this.getView().getModel("entitySorting") as JSONModel).getProperty("/") as { property: string; direction: "asc" | "desc" }[];

		const conflict = sorting.find(s => s.property === sort.property);
		if (conflict) {
			MessageBox.error("Property already sorted");
			return;
		}

		sorting.push(sort);
		(this.getView().getModel("entitySorting") as JSONModel).setProperty("/", sorting);
	}

	private handleButtonSortDeletePress(obj: { property: string; direction: "asc" | "desc" }) {
		const sorting = (this.getView().getModel("entitySorting") as JSONModel).getProperty("/") as { property: string; direction: "asc" | "desc" }[];
		const filteredList = sorting.filter(
			(sort) => sort.property !== obj.property
		);
		(this.getView().getModel("entitySorting") as JSONModel).setProperty(
			"/",
			filteredList
		);
	}

	private async handleSaveConfiguration() {
		this.setBusy(true);
		try {
			const projectName = await this.component.dialogManager.showSaveProjectDialog();
			const localData = (this.getView().getModel("local") as JSONModel).getProperty("/") as MainViewModel;
			const filters = (this.getView().getModel("entityFilters") as JSONModel).getProperty("/") as FilterRecord[];
			const headers = (this.getView().getModel("requestHeaders") as JSONModel).getProperty("/") as RequestHeader[];
			const sorters = (this.getView().getModel("entitySorting") as JSONModel).getProperty("/") as { property: string; direction: "asc" | "desc" }[];
			const selectedService = (this.getView().getModel("selectedService") as JSONModel).getProperty("/") as SelectedServiceModel;
			
			const project = {
				ProjectName: projectName,
				Odatatype: selectedService.service.ODataType,
				ServiceName: selectedService.service.ServiceName,
				ServicePath: selectedService.service.ServicePath,
				ServiceVersion: selectedService.service.Version,
				EntityMethod: localData.selectedMethod,
				EntityName: localData.selectedEntityName,
				FunctionName: localData.selectedFunctionName,
				ActionName: "",
				RequestType: localData.resourceType,
				Top: localData.top ?? 0,
				Skip: localData.skip ?? 0,
				Headers: JSON.stringify(headers),
				Filters: JSON.stringify(filters),
				Sorters: JSON.stringify(sorters),
			} as Project;

			await this.component.requests.createProject(project);
			MessageToast.show("Configuration saved successfully");
		} finally {
			this.setBusy(false);
		}
	}

	private async handleLoadConfiguration() {
		try {
			const selectedProject = await this.component.dialogManager.showProjectListDialog();
			
			if (selectedProject) {
				const localData = (this.getView().getModel("local") as JSONModel).getProperty("/") as MainViewModel;

				const service = {
					ServiceName: selectedProject.ServiceName,
					ODataType: selectedProject.Odatatype,
					ServicePath: selectedProject.ServicePath,
					Version: selectedProject.ServiceVersion
				} as ServiceEntity;

				await this.loadService(service);
				
				localData.resourceType = selectedProject.RequestType;
				localData.selectedEntityName = selectedProject.EntityName;
				localData.selectedFunctionName = selectedProject.FunctionName;
				//this.localData.selectedActionName = selectedProject.ActionName;
				localData.selectedMethod = selectedProject.EntityMethod;
				localData.top = selectedProject.Top ? parseInt(selectedProject.Top) : 10;
				localData.skip = selectedProject.Skip ? parseInt(selectedProject.Skip) : 0;
				
				(this.getView().getModel("local") as JSONModel).setProperty("/", localData);
				(this.getView().getModel("entityFilters") as JSONModel).setProperty("/", JSON.parse(selectedProject.Filters) as FilterRecord[]);
				(this.getView().getModel("entitySorting") as JSONModel).setProperty("/", JSON.parse(selectedProject.Sorters));
				(this.getView().getModel("requestHeaders") as JSONModel).setProperty("/", JSON.parse(selectedProject.Headers));
				
				MessageToast.show("Configuration loaded successfully");
			}
		} catch (error) {
			if (error instanceof Error && error.message !== "Dialog closed") {
				MessageBox.error(`Error loading configuration: ${error.message}`);
			}
		}
	}

	public setTitle(title: string) {
		throw new Error("Not implemented: " + title);
	}
}
