import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./Mermaid" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $MermaidSettings extends $ControlSettings {
        zoomLevel?: number | PropertyBindingInfo | `{${string}}`;
    }

    export default interface Mermaid {

        // property: zoomLevel
        getZoomLevel(): number;
        setZoomLevel(zoomLevel: number): this;
    }
}
