import Column from "sap/m/Column";
import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import {
	PushChannelEntity,
	FilterRecord,
	MetadataEntityProperty,
	Project,
	ServiceEntity,
	InfoEntity,
} from "../Types";
import ManagedObject from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import Table from "sap/m/Table";
import ColumnListItem from "sap/m/ColumnListItem";
import Button from "sap/m/Button";
import MessageToast from "sap/m/MessageToast";
import Text from "sap/m/Text";
import ListBinding from "sap/ui/model/ListBinding";
import SearchField, { SearchField$LiveChangeEvent } from "sap/m/SearchField";
import Item from "sap/ui/core/Item";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import Toolbar from "sap/m/Toolbar";
import FilterOperator from "sap/ui/model/FilterOperator";
import Filter from "sap/ui/model/Filter";
import Select, { Select$ChangeEvent } from "sap/m/Select";
import VBox from "sap/m/VBox";
import Input from "sap/m/Input";
import SegmentedButtonItem from "sap/m/SegmentedButtonItem";
import SegmentedButton from "sap/m/SegmentedButton";
import Util from "./Util";
import HBox from "sap/m/HBox";
import MessageBox from "sap/m/MessageBox";
import { Button$PressEvent } from "sap/m/Button";
import Component from "sap/ui/core/Component";
import ODataRequests from "./ODataRequests";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import Context from "sap/ui/model/odata/v2/Context";
import FormattedText from "sap/m/FormattedText";
import Fragment from "sap/ui/core/Fragment";

/**
 * @namespace de.kernich.odpu.util
 */
export default class DialogManager extends ManagedObject {
	private component: Component;
	private requests: ODataRequests;
	private fragmentRoot = "de.kernich.odpu.view.dialogs";

	constructor(component: Component) {
		super();
		this.component = component;
		this.requests = new ODataRequests(component.getModel() as ODataModel);
	}

	public async pickApc(apc: PushChannelEntity[]): Promise<PushChannelEntity> {
		const dialog = new Dialog({
			title: `Select Push Channel (${apc.length})`,
			contentWidth: "80%",
			contentHeight: "80%",
		});

		dialog.setModel(new JSONModel(apc), "apc");

		const updateDialogTitle = () => {
			const binding = table.getBinding("items") as ListBinding;
			const filteredLength = binding ? binding.getLength() : 0;
			dialog.setTitle(`Select Push Channel (${filteredLength})`);
		};

		const searchInput = new SearchField({
			placeholder: "Search Push Channels",
			liveChange: (event: SearchField$LiveChangeEvent) => {
				const query = event.getParameter("newValue")?.toLowerCase() ?? "";
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
				updateDialogTitle();
			},
		});

		const toolbar = new Toolbar({
			content: [searchInput, new ToolbarSpacer()],
		});

		dialog.addContent(toolbar);

		const table = new Table({
			columns: [
				new Column({ header: new Label({ text: "Application ID" }) }),
				new Column({ header: new Label({ text: "Path" }) }),
				new Column({ header: new Label({ text: "Description" }) }),
				new Column({
					header: new Label({ text: "protocol_type_id" }),
				}),
				new Column({
					header: new Label({ text: "amc_message_type_id" }),
				}),
			],
			growing: true,
			growingThreshold: 100,
		});

		table.setMode("SingleSelectMaster");

		table.bindItems({
			path: "apc>/",
			template: new ColumnListItem({
				cells: [
					new Text({ text: "{apc>ApplicationId}" }),
					new Text({ text: "{apc>Path}" }),
					new Text({ text: "{apc>Description}" }),
					new Text({ text: "{apc>ProtocolTypeId}" }),
					new Text({ text: "{apc>AmcMessageTypeId}" }),
				],
			}),
		});

		dialog.addContent(table);

		return new Promise((resolve, reject) => {
			dialog.addButton(
				new Button({
					text: "Choose",
					press: () => {
						const selectedItem = table.getSelectedItem();

						if (!selectedItem) {
							MessageToast.show("Please select a push channel.");
							return;
						}

						const bindingContext = selectedItem.getBindingContext(
							"apc"
						) as Context;
						const apc = bindingContext.getObject() as PushChannelEntity;
						resolve(apc);
						dialog.close();
						dialog.destroy();
					},
					type: "Emphasized",
					icon: "sap-icon://accept",
				})
			);
			dialog.addButton(
				new Button({
					text: "Cancel",
					press: () => {
						reject(new Error("Dialog closed"));
						dialog.close();
						dialog.destroy();
					},
					type: "Ghost",
					icon: "sap-icon://decline",
				})
			);

			dialog.open();
		});
	}

	public async pickService(): Promise<ServiceEntity> {
		let resolveFn: (value: ServiceEntity) => void;
		let rejectFn: (reason?: Error) => void;

		const resultPromise = new Promise<ServiceEntity>((resolve, reject) => {
			resolveFn = resolve;
			rejectFn = reject;
		});

		const services = await this.requests.getServices();
		const serviceModel = new JSONModel(services);

		const dialogModel = new JSONModel({
			odataTypes: [
				{ key: "ALL", text: "All" },
				{ key: "2", text: "2" },
				{ key: "4", text: "4" }
			],
			searchQuery: "",
			selectedODataType: "ALL"
		});

		const dialog = (await Fragment.load({
			name: `${this.fragmentRoot}.PickService`,
			controller: {
				onSearch: (event: SearchField$LiveChangeEvent) => {
					const query = event.getParameter("newValue")?.toLowerCase() ?? "";
					dialogModel.setProperty("/searchQuery", query);
					applyFilters();
				},
				onODataTypeChange: (event: Select$ChangeEvent) => {
					const selectedKey = event.getParameter("selectedItem")?.getKey() ?? "ALL";
					dialogModel.setProperty("/selectedODataType", selectedKey);
					applyFilters();
				},
				onRefresh: async () => {
					dialog.setBusy(true);
					try {
						const updatedServices = await this.requests.getServices();
						serviceModel.setProperty("/", updatedServices);
						dialog.setTitle(`Select Service (${updatedServices.length})`);
						MessageToast.show("Services refreshed");
					} finally {
						dialog.setBusy(false);
					}
				},
				onChoose: () => {
					const selectedItem = table.getSelectedItem();
					if (!selectedItem) {
						MessageToast.show("Please select a service.");
						return;
					}
					const bindingContext = selectedItem.getBindingContext("services") as Context;
					const service = bindingContext.getObject() as ServiceEntity;
					resolveFn(service);
					dialog.close();
					dialog.destroy();
				},
				onCustomService: async () => {
					try {
						const service = await this.pickCustomService();
						resolveFn(service);
						dialog.close();
						dialog.destroy();
					} catch {
						// Ignore error as it's handled in pickCustomService
					}
				},
				onCancel: () => {
					rejectFn(new Error("Dialog closed"));
					dialog.close();
					dialog.destroy();
				}
			}
		})) as Dialog;

		const table = dialog.getContent()[1] as Table;
		const updateDialogTitle = () => {
			const binding = table.getBinding("items") as ListBinding;
			const filteredLength = binding ? binding.getLength() : 0;
			dialog.setTitle(`Select Service (${filteredLength})`);
		};

		const applyFilters = () => {
			const binding = table.getBinding("items") as ListBinding;
			const filters: Filter[] = [];
			const searchQuery = dialogModel.getProperty("/searchQuery") as string;
			const selectedODataType = dialogModel.getProperty("/selectedODataType") as string;

			// Add search filter if query exists
			if (searchQuery) {
				filters.push(
					new Filter({
						filters: [
							new Filter("ServiceName", FilterOperator.Contains, searchQuery),
							new Filter("ServicePath", FilterOperator.Contains, searchQuery),
						],
						and: false,
					})
				);
			}

			// Add OData type filter if not ALL
			if (selectedODataType !== "ALL") {
				filters.push(
					new Filter("ODataType", FilterOperator.EQ, selectedODataType)
				);
			}

			// Apply combined filters
			binding.filter(
				filters.length > 0 ? new Filter({ filters: filters, and: true }) : []
			);
			updateDialogTitle();
		};

		dialog.setModel(serviceModel, "services");
		dialog.setModel(dialogModel, "dialog");
		dialog.setTitle(`Select Service (${services.length})`);
		dialog.open();

		return resultPromise;
	}

	public async pickCustomService(): Promise<ServiceEntity> {
		return new Promise((resolve, reject) => {
			const dialog = new Dialog({
				title: "Select Custom Service",
				draggable: true,
				contentWidth: "500px",
			});

			const segmentedButton = new SegmentedButton({
				items: [
					new SegmentedButtonItem({ text: "OData V2", key: "2" }),
					new SegmentedButtonItem({ text: "OData V4", key: "4" }),
				],
				width: "100%",
			});

			const servicePathInput = new Input({
				placeholder: "Enter service path",
				width: "100%",
			});

			const saveButton = new Button({
				text: "Save",
				type: "Emphasized",
				icon: "sap-icon://accept",
				press: () => {
					const value = servicePathInput.getValue();
					if (!value || value.trim().length === 0) {
						MessageToast.show("Please enter a service path");
						return;
					}

					resolve({
						ServicePath: value.trim(),
						ODataType: segmentedButton.getSelectedKey() as "2" | "4",
						Version: "",
						ServiceName: "Custom Service",
					});
					dialog.close();
					dialog.destroy();
				},
			});

			const cancelButton = new Button({
				text: "Cancel",
				type: "Ghost",
				icon: "sap-icon://decline",
				press: () => {
					dialog.close();
					dialog.destroy();
					reject(new Error("Dialog closed"));
				},
			});

			dialog.addContent(
				new VBox({
					items: [
						segmentedButton,
						servicePathInput,
						new HBox({ items: [saveButton, cancelButton] }),
					],
				}).addStyleClass("sapUiSmallMargin")
			);

			dialog.setBeginButton(saveButton);
			dialog.setEndButton(cancelButton);
			dialog.setInitialFocus(servicePathInput);
			dialog.open();
		});
	}

	public async showAddHeaderDialog(): Promise<{
		key: string;
		value: string;
	}> {
		return new Promise((resolve, reject) => {
			const segmentedButton = new SegmentedButton({
				items: [
					new SegmentedButtonItem({ text: "Custom Header", key: "custom" }),
					new SegmentedButtonItem({ text: "Pre defined", key: "predefined" }),
				],
				width: "100%",
				selectionChange: () => {
					if (segmentedButton.getSelectedKey() === "custom") {
						keyInput.setVisible(true);
						select.setVisible(false);
					} else {
						keyInput.setVisible(false);
						select.setVisible(true);
					}
				},
			}).addStyleClass("sapUiSmallMarginBottom");

			const select = new Select({
				width: "100%",
				visible: false,
			});
			const predefinedHeaders = [
				{ key: "sap-client", value: "100" },
				{ key: "sap-language", value: "EN" },
				{ key: "accept", value: "application/json" },
				{ key: "content-type", value: "application/json" },
				{ key: "x-csrf-token", value: "fetch" },
			];
			predefinedHeaders.forEach((header) => {
				select.addItem(new Item({ key: header.key, text: header.key }));
			});

			const submit = () => {
				let key: string = "";
				const value = valueInput.getValue();
				switch (segmentedButton.getSelectedKey()) {
					case "custom":
						key = keyInput.getValue();
						break;
					case "predefined":
						key = select.getSelectedKey();
						break;
				}

				if (!key) {
					MessageToast.show("Please enter a key.");
					return;
				}

				if (!value) {
					MessageToast.show("Please enter a value.");
					return;
				}

				dialog.close();
				dialog.destroy();
				resolve({ key: key, value: value });
			};

			const valueInput = new Input({
				placeholder: "Enter value",
				submit: submit,
				width: "100%",
			});

			const keyInput = new Input({
				placeholder: "Enter key",
				submit: submit,
				width: "100%",
			});

			const dialog = new Dialog({
				title: "Add Header",
				contentWidth: "400px",
				draggable: true,
				content: [
					new VBox({
						items: [
							segmentedButton,
							new Label({ text: "Key" }),
							keyInput,
							select,
							new Label({ text: "Value" }).addStyleClass("sapUiSmallMarginTop"),
							valueInput,
						],
					}).addStyleClass("sapUiSmallMargin"),
				],
			});

			dialog.setBeginButton(
				new Button({
					text: "Save",
					press: submit,
					type: "Emphasized",
					icon: "sap-icon://accept",
				})
			);
			dialog.setEndButton(
				new Button({
					text: "Cancel",
					press: () => {
						dialog.close();
						dialog.destroy();
						reject(new Error("Dialog closed"));
					},
					type: "Ghost",
					icon: "sap-icon://decline",
				})
			);

			dialog.open();
		});
	}

	public async addFilter(
		properties: MetadataEntityProperty[]
	): Promise<FilterRecord> {
		return new Promise((resolve, reject) => {
			const submit = () => {
				dialog.close();
				dialog.destroy();
				resolve({
					property: propertySelect.getSelectedKey(),
					operator: operatorSelect.getSelectedKey() as FilterOperator,
					value: input.getValue(),
				});
			};

			const propertySelect = new Select({
				items: properties
					.filter(
						(x) =>
							x.name.toLowerCase() !== "delete_mc" &&
							x.name.toLowerCase() !== "update_mc" &&
							x.name.toLowerCase() !== "create_mc"
					)
					.map((p) => new Item({ key: p.name, text: p.name })),
				width: "100%",
			});
			const operatorSelect = new Select({
				items: [
					new Item({ key: FilterOperator.Contains, text: "Contains" }),
					new Item({
						key: FilterOperator.NotContains,
						text: "Does Not Contain",
					}),
					new Item({ key: FilterOperator.StartsWith, text: "Starts With" }),
					new Item({ key: FilterOperator.EndsWith, text: "Ends With" }),
					new Item({
						key: FilterOperator.NotStartsWith,
						text: "Does Not Start With",
					}),
					new Item({
						key: FilterOperator.NotEndsWith,
						text: "Does Not End With",
					}),
					new Item({ key: FilterOperator.EQ, text: "Equal" }),
					new Item({ key: FilterOperator.NE, text: "Not Equal" }),
					new Item({ key: FilterOperator.GT, text: "Greater Than" }),
					new Item({ key: FilterOperator.LT, text: "Less Than" }),
					new Item({
						key: FilterOperator.GE,
						text: "Greater Than or Equal",
					}),
					new Item({
						key: FilterOperator.LE,
						text: "Less Than or Equal",
					}),
				],
				width: "100%",
			});
			const input = new Input({
				placeholder: "Enter value",
				submit: submit,
				width: "100%",
			});

			const dialog = new Dialog({
				title: "Add Filter",
				contentWidth: "400px",
				draggable: true,
				initialFocus: propertySelect,
				content: [
					new VBox({
						items: [
							new Label({ text: "Property" }),
							propertySelect,
							new Label({ text: "Operator" }),
							operatorSelect,
							new Label({ text: "Value" }),
							input,
						],
					}).addStyleClass("sapUiSmallMargin"),
				],
			});
			dialog.setBeginButton(
				new Button({
					text: "Save",
					press: submit,
					type: "Emphasized",
					icon: "sap-icon://accept",
				})
			);
			dialog.setEndButton(
				new Button({
					text: "Cancel",
					press: () => {
						dialog.close();
						dialog.destroy();
						reject(new Error("Dialog closed"));
					},
					type: "Ghost",
					icon: "sap-icon://decline",
				})
			);
			dialog.open();
		});
	}

	public async editFilter(
		filter: FilterRecord,
		properties: MetadataEntityProperty[]
	): Promise<FilterRecord> {
		return new Promise((resolve, reject) => {
			const submit = () => {
				dialog.close();
				dialog.destroy();
				resolve({
					property: propertySelect.getSelectedKey(),
					operator: operatorSelect.getSelectedKey() as FilterOperator,
					value: input.getValue(),
				});
			};

			const propertySelect = new Select({
				items: properties
					.filter(
						(x) =>
							x.name.toLowerCase() !== "delete_mc" &&
							x.name.toLowerCase() !== "update_mc" &&
							x.name.toLowerCase() !== "create_mc"
					)
					.map((p) => new Item({ key: p.name, text: p.name })),
				width: "100%",
			});
			const operatorSelect = new Select({
				items: [
					new Item({ key: FilterOperator.Contains, text: "Contains" }),
					new Item({ key: FilterOperator.EQ, text: "Equal" }),
					new Item({ key: FilterOperator.NE, text: "Not Equal" }),
					new Item({ key: FilterOperator.GT, text: "Greater Than" }),
					new Item({ key: FilterOperator.LT, text: "Less Than" }),
				],
				width: "100%",
			});

			const input = new Input({
				placeholder: "Enter value",
				submit: submit,
				width: "100%",
			});

			input.setValue(filter.value);
			propertySelect.setSelectedKey(filter.property);
			operatorSelect.setSelectedKey(filter.operator);

			const dialog = new Dialog({
				title: "Edit Filter",
				contentWidth: "400px",
				draggable: true,
				initialFocus: propertySelect,
				content: [
					new VBox({
						items: [
							new Label({ text: "Property" }),
							propertySelect,
							new Label({ text: "Operator" }),
							operatorSelect,
							new Label({ text: "Value" }),
							input,
						],
					}).addStyleClass("sapUiSmallMargin"),
				],
			});
			dialog.setBeginButton(
				new Button({
					text: "Save",
					press: submit,
					type: "Emphasized",
					icon: "sap-icon://accept",
				})
			);
			dialog.setEndButton(
				new Button({
					text: "Cancel",
					press: () => {
						dialog.close();
						dialog.destroy();
						reject(new Error("Dialog closed"));
					},
					type: "Ghost",
					icon: "sap-icon://decline",
				})
			);
			dialog.open();
		});
	}

	public static async showConfirmationDialog(
		message: string
	): Promise<boolean> {
		return new Promise((resolve) => {
			const dialog = new Dialog({
				title: "Confirm",
				content: new Text({ text: message }).addStyleClass("sapUiSmallMargin"),
			});
			dialog.setBeginButton(
				new Button({
					text: "Yes",
					press: () => {
						dialog.close();
						dialog.destroy();
						resolve(true);
					},
					type: "Emphasized",
					icon: "sap-icon://accept",
				})
			);
			dialog.setEndButton(
				new Button({
					text: "No",
					press: () => {
						dialog.close();
						dialog.destroy();
						resolve(false);
					},
					type: "Ghost",
					icon: "sap-icon://decline",
				})
			);
			dialog.setEscapeHandler(() => {
				dialog.close();
				dialog.destroy();
				resolve(false);
			});
			dialog.open();
		});
	}

	public showUpdateAvailableDialog() {
		const info = this.component.getModel("info") as JSONModel;
		const infoEntity = info.getData() as InfoEntity;

		const dialog = new Dialog({
			title: "Update Available",
			contentWidth: "400px",
			draggable: true,
			content: new VBox({
				items: [
					// Header with version info
					new VBox({
						items: [
							new Text({
								text: "A new version is available!",
								wrapping: true,
							}).addStyleClass("sapThemeFontSizeLarge"),
							new Text({
								text: "Current Version: " + infoEntity.Version,
								wrapping: true,
							}).addStyleClass("sapUiTinyMarginTop"),
							new Text({
								text: "Latest Version: " + infoEntity.RemoteVersion,
								wrapping: true,
							}).addStyleClass("sapUiTinyMarginTop"),
						],
						alignItems: "Center",
					}).addStyleClass("sapUiSmallMarginBottom"),

					new FormattedText({
						htmlText:
							infoEntity.LatestReleaseBody || "No release notes available.",
					}).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
				],
				alignItems: "Center",
			}).addStyleClass("sapUiSmallMargin"),
		});

		dialog.setBeginButton(
			new Button({
				text: "Get Update",
				press: () => {
					window.open(
						"https://github.com/mariokernich/odapu-abap/releases/latest",
						"_blank"
					);
				},
				type: "Emphasized",
				icon: "sap-icon://chain-link",
			})
		);

		dialog.setEndButton(
			new Button({
				text: "Close",
				press: () => {
					dialog.close();
					dialog.destroy();
				},
				type: "Ghost",
				icon: "sap-icon://decline",
			})
		);

		dialog.setInitialFocus(dialog.getBeginButton());
		dialog.open();
	}

	public async showAboutDialog() {
		let resolveFn: () => void;
		const resultPromise = new Promise<void>((resolve) => {
			resolveFn = resolve;
		});

		const info = this.component.getModel("info") as JSONModel;
		const infoEntity = info.getData() as InfoEntity;

		const model = new JSONModel({
			Version: infoEntity.Version,
			RemoteVersion: infoEntity.RemoteVersion,
			UpdateAvailable: infoEntity.UpdateAvailable,
			Logo: sap.ui.require.toUrl("de/kernich/odpu/img/odapu-logo.png"),
		});

		const dialog = (await Fragment.load({
			name: `${this.fragmentRoot}.AboutDialog`,
			controller: {
				onClose: () => {
					dialog.close();
					resolveFn();
				},
			},
		})) as Dialog;

		dialog.setModel(model, "dialog");
		dialog.open();

		return resultPromise;
	}

	public async selectProjectType() {
		let resolveFn: (value: string) => void;
		let rejectFn: (reason?: Error) => void;

		const resultPromise = new Promise<string>((resolve, reject) => {
			resolveFn = resolve;
			rejectFn = reject;
		});

		const dialog = (await Fragment.load({
			name: `${this.fragmentRoot}.SelectProjectType`,
			controller: {
				onSelectOData: () => {
					resolveFn("ODATA");
					dialog.close();
					dialog.destroy();
				},
				onSelectAPC: () => {
					resolveFn("ODATA");
					dialog.close();
					dialog.destroy();
				},
				onShowAbout: () => {
					void this.showAboutDialog();
				},
				onCancel: () => {
					rejectFn(new Error("Dialog closed"));
					dialog.close();
					dialog.destroy();
				},
			},
		})) as Dialog;

		dialog.open();

		return resultPromise;
	}

	public async addSort(
		properties: MetadataEntityProperty[]
	): Promise<{ property: string; direction: "asc" | "desc" }> {
		return new Promise((resolve, reject) => {
			const submit = () => {
				dialog.close();
				dialog.destroy();
				resolve({
					property: propertySelect.getSelectedKey(),
					direction: directionSelect.getSelectedKey() as "asc" | "desc",
				});
			};

			const propertySelect = new Select({
				items: properties
					.filter(
						(x) =>
							x.name.toLowerCase() !== "delete_mc" &&
							x.name.toLowerCase() !== "update_mc" &&
							x.name.toLowerCase() !== "create_mc"
					)
					.map((p) => new Item({ key: p.name, text: p.name })),
				width: "100%",
			});
			const directionSelect = new Select({
				items: [
					new Item({ key: "asc", text: "Ascending" }),
					new Item({ key: "desc", text: "Descending" }),
				],
				width: "100%",
			});

			const dialog = new Dialog({
				title: "Add Sorter",
				contentWidth: "400px",
				draggable: true,
				initialFocus: propertySelect,
				content: [
					new VBox({
						items: [
							new Label({ text: "Property" }),
							propertySelect,
							new Label({ text: "Direction" }),
							directionSelect,
						],
					}).addStyleClass("sapUiSmallMargin"),
				],
			});
			dialog.setBeginButton(
				new Button({
					text: "Save",
					press: submit,
					type: "Emphasized",
					icon: "sap-icon://accept",
				})
			);
			dialog.setEndButton(
				new Button({
					text: "Cancel",
					press: () => {
						dialog.close();
						dialog.destroy();
						reject(new Error("Dialog closed"));
					},
					type: "Ghost",
					icon: "sap-icon://decline",
				})
			);
			dialog.open();
		});
	}

	public async showXmlCodeEditor(xml: string) {
		let resolveFn: () => void;
		const resultPromise = new Promise<void>((resolve) => {
			resolveFn = resolve;
		});
		const formattedXml = xml ? Util.formatXml(xml) : "";

		const model = new JSONModel({
			xml: formattedXml
		});

		const dialog = (await Fragment.load({
			name: `${this.fragmentRoot}.XmlCodeEditor`,
			controller: {
				onCopy: () => {
					void Util.copy2Clipboard(formattedXml);
					MessageToast.show("Copied to clipboard");
				},
				onClose: () => {
					dialog.close();
					dialog.destroy();
					resolveFn();
				}
			}
		})) as Dialog;

		dialog.setModel(model, "dialog");
		dialog.open();

		return resultPromise;
	}

	public async showProjectListDialog(): Promise<Project> {
		const projects = await this.requests.getProjects();
		return new Promise((resolve, reject) => {
			const searchInput = new SearchField({
				placeholder: "Search Projects",
				liveChange: (event: SearchField$LiveChangeEvent) => {
					const query = event.getParameter("newValue")?.toLowerCase() ?? "";
					const binding = table.getBinding("items") as ListBinding;
					binding.filter(
						query
							? new Filter("ProjectName", FilterOperator.Contains, query)
							: []
					);
					updateDialogTitle();
				},
			});

			const dialog = new Dialog({
				title: `Saved Projects`,
				contentWidth: "400px",
				contentHeight: "600px",
				busyIndicatorDelay: 0,
				draggable: true,
				initialFocus: searchInput,
			});

			const updateDialogTitle = () => {
				const binding = table.getBinding("items") as ListBinding;
				const filteredLength = binding ? binding.getLength() : 0;
				dialog.setTitle(`Saved Projects (${filteredLength})`);
			};

			const toolbar = new Toolbar({
				content: [searchInput, new ToolbarSpacer()],
			});

			dialog.addContent(toolbar);

			const table = new Table({
				columns: [
					new Column({ header: new Label({ text: "Project Name" }) }),
					new Column({ header: new Label({ text: "Actions" }), hAlign: "End" }),
				],
				growing: true,
				growingThreshold: 100,
				noDataText: "No projects found",
			});

			table.setMode("SingleSelectMaster");

			table.bindItems({
				path: "projects>/",
				template: new ColumnListItem({
					cells: [
						new Text({ text: "{projects>ProjectName}" }),
						new HBox({
							items: [
								new Button({
									icon: "sap-icon://delete",
									type: "Reject",
									press: (event: Button$PressEvent) => {
										const source = event.getSource();
										const listItem = source.getParent() as ColumnListItem;
										const bindingContext =
											listItem.getBindingContext("projects");
										if (!bindingContext) {
											return;
										}
										const project = bindingContext.getObject() as Project;

										void DialogManager.showConfirmationDialog(
											`Are you sure you want to delete project "${project.ProjectName}"?`
										).then(async (confirmed) => {
											if (confirmed) {
												dialog.setBusy(true);
												try {
													await this.requests.deleteProject(project);
													MessageToast.show("Project deleted successfully");

													// Remove from table
													const model = dialog.getModel(
														"projects"
													) as JSONModel;
													const projects = model.getProperty("/") as Project[];
													const index = projects.findIndex(
														(p) => p.ProjectName === project.ProjectName
													);
													if (index > -1) {
														projects.splice(index, 1);
														model.setProperty("/", projects);
													}
													updateDialogTitle();
												} catch (error: unknown) {
													const errorMessage =
														error instanceof Error
															? error.message
															: String(error);
													MessageBox.error(
														`Error deleting project: ${errorMessage}`
													);
												} finally {
													dialog.setBusy(false);
												}
											}
										});
									},
								}),
							],
							justifyContent: "End",
						}),
					],
				}),
			});

			dialog.addContent(table);
			dialog.setModel(new JSONModel(projects), "projects");
			updateDialogTitle();

			dialog.addButton(
				new Button({
					text: "Load",
					press: () => {
						const selectedItem = table.getSelectedItem();
						if (!selectedItem) {
							MessageToast.show("Please select a project");
							return;
						}
						const bindingContext = selectedItem.getBindingContext("projects");
						if (!bindingContext) {
							return;
						}
						const project = bindingContext.getObject() as Project;
						resolve(project);
						dialog.close();
						dialog.destroy();
					},
					type: "Emphasized",
					icon: "sap-icon://accept",
				})
			);

			dialog.addButton(
				new Button({
					text: "Cancel",
					press: () => {
						reject(new Error("Dialog closed"));
						dialog.close();
						dialog.destroy();
					},
					type: "Ghost",
					icon: "sap-icon://decline",
				})
			);

			dialog.open();
		});
	}

	public async showSaveProjectDialog(): Promise<string> {
		return new Promise((resolve, reject) => {
			const submit = () => {
				const projectName = input.getValue();
				if (!projectName) {
					MessageToast.show("Please enter a project name");
					return;
				}
				resolve(projectName);
				dialog.close();
				dialog.destroy();
			};

			const input = new Input({
				placeholder: "Enter project name...",
				width: "100%",
				submit: submit,
			});

			const dialog = new Dialog({
				title: "Save Project",
				contentWidth: "400px",
				content: [
					new VBox({
						items: [new Label({ text: "Project Name" }), input],
					}).addStyleClass("sapUiSmallMargin"),
				],
				initialFocus: input,
				draggable: true,
			});

			dialog.setBeginButton(
				new Button({
					text: "Save",
					press: submit,
					type: "Emphasized",
					icon: "sap-icon://accept",
				})
			);

			dialog.setEndButton(
				new Button({
					text: "Cancel",
					press: () => {
						reject(new Error("Dialog closed"));
						dialog.close();
						dialog.destroy();
					},
					type: "Ghost",
					icon: "sap-icon://decline",
				})
			);

			dialog.open();
		});
	}
}
