import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./FunctionImportPreview" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $FunctionImportPreviewSettings extends $ControlSettings {
        functions?: object | PropertyBindingInfo | `{${string}}`;
    }

    export default interface FunctionImportPreview {

        // property: functions
        getFunctions(): object;
        setFunctions(functions: object): this;
    }
}
