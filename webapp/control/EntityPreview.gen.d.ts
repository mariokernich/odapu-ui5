import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./EntityPreview" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $EntityPreviewSettings extends $ControlSettings {
        entity?: object | PropertyBindingInfo | `{${string}}`;
    }

    export default interface EntityPreview {

        // property: entity
        getEntity(): object;
        setEntity(entity: object): this;
    }
}
