import MetadataAction from "MetadataAction";
import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./ActionPreview" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $ActionPreviewSettings extends $ControlSettings {
        action?: MetadataAction | PropertyBindingInfo | `{${string}}`;
    }

    export default interface ActionPreview {

        // property: action
        getAction(): MetadataAction;
        setAction(action: MetadataAction): this;
    }
}
