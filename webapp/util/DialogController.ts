import Dialog from "sap/m/Dialog";
import Fragment from "sap/ui/core/Fragment";
import JSONModel from "sap/ui/model/json/JSONModel";
import Model from "sap/ui/model/Model";
import BaseObject from "sap/ui/base/Object";
import DialogManager from "./DialogManager";
import ODataRequests from "./ODataRequests";
import Control from "sap/ui/core/Control";

type PromiseHelper<T> = {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (value: unknown) => void;
};

/**
 * @namespace de.kernich.odpu.util
 */
class DialogController extends BaseObject {
    public data = {};
    public promiseHelper?: PromiseHelper<typeof this.data>;
    public get dialog() {
        return this._dialog;
    }

    public get dialogManager() {
        return this._dialogManager;
    }

    protected set dialog(value: Dialog) {
        this._dialog = value;
    }

    private set dialogManager(value: DialogManager) {
        this._dialogManager = value;
    }

    public set requests(value: ODataRequests) {
        this._requests = value;
    }

    public get requests() {
        return this._requests;
    }

    private dialogName?: string;
    private dialogId = "";
    private _dialog!: Dialog;
    private _dialogManager!: DialogManager;
    private _requests!: ODataRequests;
    
    async init(options: {
        path: string;
        name: string;
        id: string;
        models?: { [key: string]: Model };
        dialogManager: DialogManager;
        requests: ODataRequests;
    }) {
        return Promise.all([this.initDialog(options), this.initPromise()]);
    }

    public setModel(model: Model, modelName?: string) {
        this.dialog.setModel(model, modelName);
    }

    public getModel(modelName?: string) {
        return this.dialog?.getModel(modelName);
    }

    private async initDialog(options: {
        path: string;
        name: string;
        id: string;
        models?: { [key: string]: Model };
        dialogManager: DialogManager;
        requests: ODataRequests;
    }): Promise<Dialog> {
        let dialog = this.dialog;

        this.dialogId = options.id;

        if (!dialog) {
            const reqOptions = Object.assign({}, options, { models: {} });
            const models = Object.entries(reqOptions.models);

            this.dialogName = options.name;
            dialog = await this.createDialogFromFragment({
                path: options.path,
                id: options.id,
                controller: this
            });

            this.dialog = dialog;
            this.dialogManager = options.dialogManager;
            this.requests = options.requests;
            const dialogModel = new JSONModel(this.data, true);

            this.setModel(dialogModel, "dialog");
            models.forEach(([name, value]) => {
                this.setModel(value, name === "undefined" ? undefined : name);
            });

            dialog.setBusyIndicatorDelay(0);
        }

        return dialog;
    }

    public getElement<TType extends Control>(id: string): TType {
        const el = Fragment.byId(this.dialogId, id) as TType;

        if (!el) {
            throw new Error(`Element in dialog ${this.dialogId} w/ id ${id} not found`);
        }

        return el;
    }

    private async createDialogFromFragment(options: {
        path: string;
        controller: object;
        id: string;
    }): Promise<Dialog> {
        return (await Fragment.load({
            name: options.path,
            controller: options.controller,
            id: options.id
        })) as Dialog;
    }

    public async initPromise(): Promise<PromiseHelper<typeof this.data>> {
        this.promiseHelper = await this.createPromise();

        return this.promiseHelper;
    }

    private async createPromise(): Promise<PromiseHelper<typeof this.data>> {
        let resolve: (value: typeof this.data) => void;
        let reject: (value: unknown) => void;

        const promise = new Promise<typeof this.data>((s, e) => {
            resolve = s;
            reject = e;
        });

        return new Promise((res) => {
            res({
                promise: promise,
                reject: reject,
                resolve: resolve
            });
        });
    }

    onConfirm() {
        this.resolve();

        if (this.dialog) {
            this.dialog.close();
            this.dialog.destroy();
        }
    }

    onCancel() {
        this.reject();

        if (this.dialog) {
            this.dialog.close();
            this.dialog.destroy();
        }
    }

    resolve(data?: typeof this.data) {
        this.promiseHelper?.resolve(data || this.data);
    }

    reject(reason?: string) {
        this.promiseHelper?.reject(reason || "Cancelled");
    }

    destroy() {
        super.destroy();
        this.dialog?.destroy();
        this.promiseHelper?.reject("destroy routine");
    }
}

export default DialogController;
export { DialogController };