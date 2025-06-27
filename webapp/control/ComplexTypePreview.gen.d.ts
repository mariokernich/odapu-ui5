import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./ComplexTypePreview" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $ComplexTypePreviewSettings extends $ControlSettings {
        complexType?: object | PropertyBindingInfo | `{${string}}`;
    }

    export default interface ComplexTypePreview {

        // property: complexType
        getComplexType(): object;
        setComplexType(complexType: object): this;
    }
}
