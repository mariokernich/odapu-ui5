import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./EntityPreview" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $EntityPreviewSettings extends $ControlSettings {
        entities?: object | PropertyBindingInfo | `{${string}}`;
    }

    export default interface EntityPreview {

        // property: entities
        getEntities(): object;
        setEntities(entities: object): this;
    }
}
