import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./EntityNavigationProperty" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $EntityNavigationPropertySettings extends $ControlSettings {
        navigationName?: string | PropertyBindingInfo;
    }

    export default interface EntityNavigationProperty {

        // property: navigationName
        getNavigationName(): string;
        setNavigationName(navigationName: string): this;
    }
}
