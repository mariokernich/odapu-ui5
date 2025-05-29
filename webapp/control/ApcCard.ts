import Card from "sap/f/Card";
import Header from "sap/f/cards/Header";
import Button from "sap/m/Button";
import Column from "sap/m/Column";
import ColumnListItem from "sap/m/ColumnListItem";
import HBox from "sap/m/HBox";
import Input from "sap/m/Input";
import MessageToast from "sap/m/MessageToast";
import Table from "sap/m/Table";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import Renderer from "sap/ui/core/Renderer";
import SapPcpWebSocket from "sap/ui/core/ws/SapPcpWebSocket";
import JSONModel from "sap/ui/model/json/JSONModel";
import DialogManager from "../util/DialogManager";

/**
 * @namespace de.kernich.odpu.control
 */
export default class ApcCard extends Card {
	static readonly metadata = {
		properties: {
			path: {
				type: "string",
				defaultValue: "",
			},
			applicationId: {
				type: "string",
				defaultValue: "",
			},
		},
		events: {
			delete: {},
		},
	};

	private apcData = {
		applicationId: "",
		path: "",
		running: false,
		busy: false,
	};

	private table: Table;

	private socket?: SapPcpWebSocket;

	static readonly renderer = Renderer.extend(Card);

	constructor(idOrSettings?: string | $ApcCardSettings);
	constructor(id?: string, settings?: $ApcCardSettings);
	constructor(id?: string, settings?: $ApcCardSettings) {
		super(id, settings);

		this.setModel(new JSONModel(this.apcData, true), "control");

		const header = new Header({
			title: "{control>/applicationId}",
			subtitle: "{control>/path}",
		});

		this.setHeader(header);

		const container = new VBox();
		this.setBusyIndicatorDelay(0);
		container.addStyleClass("sapUiSmallMargin");
		this.table = new Table();

		this.table.addColumn(
			new Column({
				header: new Text({
					text: "Event",
				}),
				width: "80px",
			})
		);

		this.table.addColumn(
			new Column({
				header: new Text({
					text: "Data",
				}),
			})
		);

		this.table.addColumn(
			new Column({
				header: new Text({
					text: "Time",
				}),
				width: "80px",
			})
		);

		const submitMessage = () => {
			this.sendMessage(messageInput.getValue());
			messageInput.setValue("");
		};

		const messageInput = new Input({
			placeholder: "Enter message...",
			enabled: "{control>/running}",
			width: "100%",
			submit: submitMessage,
		});

		const clearTable = async () => {
			const confirmed = await DialogManager.showConfirmationDialog(
				"Are you sure you want to clear the table?"
			);
			if (confirmed) {
				this.table.destroyItems();
			}
		};

		const stop = async () => {
			const confirmed = await DialogManager.showConfirmationDialog(
				"Are you sure you want to stop the connection?"
			);
			if (confirmed) {
				void this.stop();
			}
		};

		const subHeader = new HBox({
			justifyContent: "SpaceBetween",
			alignItems: "Center",
			items: [
				new Text({
					text: "Connected: {control>/running}",
				}),
				new HBox({
					items: [
						new Button({
							tooltip: "Connect",
							icon: "sap-icon://connected",
							visible: "{= ${control>/running} === false}",
							press: () => {
								void this.start();
							},
						}),
						new Button({
							tooltip: "Disconnect",
							icon: "sap-icon://disconnected",
							visible: "{= ${control>/running} === true}",
							press: () => {
								void stop();
							},
						}),
						new Button({
							tooltip: "Clear",
							icon: "sap-icon://clear-all",
							press: () => {
								void clearTable();
							},
						}).addStyleClass("sapUiTinyMarginBegin"),
						new Button({
							type: "Reject",
							icon: "sap-icon://delete",
							press: () => {
								this.fireDelete();
							},
						}).addStyleClass("sapUiTinyMarginBegin"),
					],
				}),
			],
		});

		container.addItem(subHeader);
		container.addItem(this.table);

		const menu = new HBox({
			renderType: "Bare",
			items: [
				messageInput,
				new Button({
					text: "Send",
					enabled: "{control>/running}",
					press: submitMessage,
				}).addStyleClass("sapUiSmallMarginBegin"),
			],
		});

		container.addItem(menu);

		this.setContent(container);
	}

	public async start() {
		this.setBusy(true);

		try {
			this.socket = new SapPcpWebSocket(this.apcData.path);

			this.socket.attachMessage(
				(message: {
					getParameters: () => {
						data: string;
						pcpFields?: object;
					};
				}) => {
					const body = message.getParameters().data;
					let text;

					if (typeof body === "string") {
						text = body;
					} else {
						text = JSON.stringify(body);
					}

					//const pcp = message.getParameters().pcpFields;
					this.table.addItem(
						new ColumnListItem({
							cells: [
								new Text({
									text: "Receiving",
								}),
								new Text({
									text: text,
								}),
								new Text({
									text: new Date().toLocaleTimeString(),
								}),
							],
						})
					);
				}
			);

			await new Promise<void>((resolve, reject) => {
				this.socket.attachOpen(() => {
					this.setBusy(false);
					this.apcData.running = true;
					MessageToast.show("connected: " + this.apcData.path);
					console.log("connected: " + this.apcData.path);
					resolve();
				});
				this.socket.attachError((error: Error) => {
					MessageToast.show("error: " + JSON.stringify(error));
					console.log(
						"error at " + this.apcData.path + ": " + JSON.stringify(error)
					);
					reject(new Error("failed to connect: " + JSON.stringify(error)));
				});
			});
		} finally {
			this.setBusy(false);
		}
	}

	public stop() {
		this.setBusy(true);
		this.socket?.close();
		this.socket.attachClose(() => {
			this.setBusy(false);
			this.apcData.running = false;
			MessageToast.show("disconnected");
		});
	}

	public sendMessage(message: string) {
		this.socket?.send(message);
		this.table.addItem(
			new ColumnListItem({
				cells: [
					new Text({
						text: "Sending",
					}),
					new Text({
						text: message,
					}),
					new Text({
						text: new Date().toLocaleTimeString(),
					}),
				],
			})
		);
	}

	public setPath(path: string) {
		this.setProperty("path", path);
		this.apcData.path = path;
	}

	public setApplicationId(applicationId: string) {
		this.setProperty("applicationId", applicationId);
		this.apcData.applicationId = applicationId;
	}
}
