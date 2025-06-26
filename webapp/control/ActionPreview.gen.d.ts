import MetadataAction from "MetadataAction";
import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./ActionPreview" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $ActionPreviewSettings extends $ControlSettings {
        actions?: MetadataAction[] | PropertyBindingInfo | `{${string}}`;
    }

    export default interface ActionPreview {

        // property: actions
        getActions(): MetadataAction[];
        setActions(actions: MetadataAction[]): this;
    }
}
