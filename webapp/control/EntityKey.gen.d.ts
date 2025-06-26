import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./EntityKey" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $EntityKeySettings extends $ControlSettings {
        keyName?: string | PropertyBindingInfo;
        keyType?: string | PropertyBindingInfo;
    }

    export default interface EntityKey {

        // property: keyName
        getKeyName(): string;
        setKeyName(keyName: string): this;

        // property: keyType
        getKeyType(): string;
        setKeyType(keyType: string): this;
    }
}
