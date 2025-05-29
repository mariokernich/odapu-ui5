import Event from "sap/ui/base/Event";
import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $CardSettings } from "sap/f/Card";

declare module "./ApcCard" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $ApcCardSettings extends $CardSettings {
        path?: string | PropertyBindingInfo;
        applicationId?: string | PropertyBindingInfo;
        delete?: (event: ApcCard$DeleteEvent) => void;
    }

    export default interface ApcCard {

        // property: path
        getPath(): string;
        setPath(path: string): this;

        // property: applicationId
        getApplicationId(): string;
        setApplicationId(applicationId: string): this;

        // event: delete
        attachDelete(fn: (event: ApcCard$DeleteEvent) => void, listener?: object): this;
        attachDelete<CustomDataType extends object>(data: CustomDataType, fn: (event: ApcCard$DeleteEvent, data: CustomDataType) => void, listener?: object): this;
        detachDelete(fn: (event: ApcCard$DeleteEvent) => void, listener?: object): this;
        fireDelete(parameters?: ApcCard$DeleteEventParameters): this;
    }

    /**
     * Interface describing the parameters of ApcCard's 'delete' event.
     */
    // eslint-disable-next-line
    export interface ApcCard$DeleteEventParameters {
    }

    /**
     * Type describing the ApcCard's 'delete' event.
     */
    export type ApcCard$DeleteEvent = Event<ApcCard$DeleteEventParameters>;
}
