import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./EntityProperty" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $EntityPropertySettings extends $ControlSettings {
        propertyName?: string | PropertyBindingInfo;
        propertyType?: string | PropertyBindingInfo;
    }

    export default interface EntityProperty {

        // property: propertyName
        getPropertyName(): string;
        setPropertyName(propertyName: string): this;

        // property: propertyType
        getPropertyType(): string;
        setPropertyType(propertyType: string): this;
    }
}
