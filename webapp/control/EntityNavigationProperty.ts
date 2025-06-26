import Control from "sap/ui/core/Control";
import RenderManager from "sap/ui/core/RenderManager";

/**
 * @namespace de.kernich.odpu.control
 */
export default class EntityNavigationProperty extends Control {
    public static readonly metadata = {
        properties: {
            navigationName: { type: "string", defaultValue: "" }
        }
    };

    public static renderer = {
        apiVersion: 2,
        render: function(rm: RenderManager, control: EntityNavigationProperty) {
            // This control is not rendered directly, it's used as aggregation
        }
    };
} 