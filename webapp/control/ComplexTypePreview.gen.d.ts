import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./ComplexTypePreview" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $ComplexTypePreviewSettings extends $ControlSettings {
        complexTypes?: object | PropertyBindingInfo | `{${string}}`;
    }

    export default interface ComplexTypePreview {

        // property: complexTypes
        getComplexTypes(): object;
        setComplexTypes(complexTypes: object): this;
    }
}
