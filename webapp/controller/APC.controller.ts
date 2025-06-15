import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageToast from "sap/m/MessageToast";
import Constants from "../Constants";
import Device from "sap/ui/Device";
import Control from "sap/ui/core/Control";
import Core from "sap/ui/core/Core";
import SapPcpWebSocket, {
	SapPcpWebSocket$MessageEvent,
} from "sap/ui/core/ws/SapPcpWebSocket";
import { FeedInput$PostEvent } from "sap/m/FeedInput";
import Util from "../util/Util";
import Table from "sap/m/Table";
/**
 * @namespace de.kernich.odpu.controller
 */
export default class APC extends BaseController {
	private local = {
		folderTreeIcon: sap.ui.require.toUrl(
			"de/kernich/odpu/img/folder-tree-light.svg"
		),
	};

	public fragmentId: string = "";
	public apcModel = {
		selectedApc: {
			path: "",
		},
		state: "disconnected" as "connected" | "disconnected",
	};
	public apcLog: {
		entries: {
			participant: string;
			data: string;
			timestamp: string;
		}[];
	} = {
		entries: [],
	};
	private socket: SapPcpWebSocket | undefined;
	private apcView = {
		githubIcon: sap.ui.require.toUrl("de/kernich/odpu/img/github-brands.svg"),
		linkedinIcon: sap.ui.require.toUrl(
			"de/kernich/odpu/img/linkedin-brands.svg"
		),
	};

	onInit() {
		super.onInit();
		void this.handleInit();

		this.getView()?.setModel(new JSONModel(this.apcModel, true), "apcModel");
		this.getView()?.setModel(new JSONModel(this.apcLog, true), "apcLog");
		this.getView()?.setModel(new JSONModel(this.apcView, true), "apcView");
	}

	private async handleInit() {
		await this.getGlobalModel().dataLoaded();
		this.setBusy(true);
		await this.initModel();

		this.setBusy(false);

		if (!Device.support.websocket) {
			MessageToast.show(this.component.getText("msg.noSocketSupport"));
		}
	}

	onChoosePushChannelButtonPress() {
		void this.handleAddApc();
	}

	onDisconnectPushChannelButtonPress() {
		this.socket?.close();
		this.apcModel.state = "disconnected";
		MessageToast.show(this.component.getText("msg.apcDisconnected", [this.apcModel.selectedApc.path]));
		this.apcModel.selectedApc = {
			path: "",
		};
	}

	onClearPushChannelButtonPress() {
		this.apcLog.entries = [];
		this.refreshApcLog();
	}

	private async handleAddApc() {
		this.setBusy(true);
		try {
			const apcList = await this.getOwnerComponent().requests.getPushChannels();
			const selectedApc = await this.component.dialogManager.pickApc(apcList);
			(this.getView()?.getModel("apcModel") as JSONModel).setProperty("/selectedApc/path", selectedApc.Path);
			this.setTitle(selectedApc.ApplicationId);
		} finally {
			this.setBusy(false);
		}
	}

	private async initModel() {
		const model = this.getOwnerComponent().getModel() as ODataModel;
		await model.metadataLoaded(true);
		model.setSizeLimit(Constants.SERVICE_QUERY_LIMIT);
	}

	async onConnectPushChannelButtonPress() {
		this.setBusy(true);
		try {
			await new Promise<void>((resolve, reject) => {
				this.socket = new SapPcpWebSocket(this.apcModel.selectedApc.path);
				this.socket.attachMessage((event: SapPcpWebSocket$MessageEvent) => {
					this.apcLog.entries.push({
						participant: "Server",
						data: event.getParameters().data,
						timestamp: new Date().toISOString(),
					});
					this.refreshApcLog();
				});
				this.socket.attachOpen(() => {
					this.apcModel.state = "connected";
					resolve();
				});
				this.socket.attachClose(() => {
					this.apcModel.state = "disconnected";
				});
				this.socket.attachError((error: Error) => {
					reject(new Error("failed to connect: " + JSON.stringify(error)));
				});
			});
			this.focusFeedInput();
			MessageToast.show(this.component.getText("msg.apcConnected", [this.apcModel.selectedApc.path]));
		} catch (error) {
			Util.showError(error);
		} finally {
			this.setBusy(false);
		}
	}

	private getById(id: string): Control | undefined {
		const fragmentId = this.fragmentId;
		const globalId = `${fragmentId}--${id}`;

		const control = Core.byId(globalId);
		return control as Control;
	}

	public refreshApcLog() {
		this.getView()?.getModel("apcLog")?.refresh();
		(this.getById("idLogTable") as Table).refreshAggregation("items");
	}

	public onPostMessageButtonPress(event: FeedInput$PostEvent) {
		this.apcLog.entries.push({
			participant: "Client",
			data: event.getParameters().value,
			timestamp: new Date().toISOString(),
		});
		this.socket?.send(event.getParameters().value);
		this.refreshApcLog();
		this.focusFeedInput();
	}

	public focusFeedInput() {
		this.getById("idFeedInput")?.focus();
	}

	public setTitle(title: string) {
		throw new Error("Not implemented: " + title);
	}
}
