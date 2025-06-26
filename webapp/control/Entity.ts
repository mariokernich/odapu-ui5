import Control from "sap/ui/core/Control";
import RenderManager from "sap/ui/core/RenderManager";
import EntityKey from "./EntityKey";
import EntityProperty from "./EntityProperty";
import EntityNavigationProperty from "./EntityNavigationProperty";

/**
 * @namespace de.kernich.odpu.control
 */
export default class Entity extends Control {
    public static readonly metadata = {
        properties: {
            prefix: { type: "string", defaultValue: "" },
            title: { type: "string", defaultValue: "Untitled" }
        },
        aggregations: {
            keys: { type: "de.kernich.odpu.control.EntityKey", multiple: true },
            properties: { type: "de.kernich.odpu.control.EntityProperty", multiple: true },
            navigationProperties: { type: "de.kernich.odpu.control.EntityNavigationProperty", multiple: true }
        }
    };

    public static renderer = {
        apiVersion: 2,
        render: function(rm: RenderManager, control: Entity) {
            rm.openStart("div", control);
            rm.class("entity-box");
            rm.style("border", "2px solid #333");
            rm.style("border-radius", "8px");
            rm.style("padding", "0");
            rm.style("margin", "10px");
            rm.style("min-width", "200px");
            rm.style("display", "inline-block");
            rm.style("background", "white");
            rm.openEnd();

            // Prefix section (if exists)
            const prefix = control.getPrefix();
            if (prefix) {
                rm.openStart("div");
                rm.class("entity-prefix");
                rm.style("border-bottom", "1px solid #ccc");
                rm.style("padding", "8px");
                rm.style("text-align", "center");
                rm.style("font-size", "12px");
                rm.style("color", "#666");
                rm.openEnd();
                rm.text(prefix);
                rm.close("div");
            }

            // Title section
            rm.openStart("div");
            rm.class("entity-title");
            rm.style("border-bottom", "1px solid #ccc");
            rm.style("padding", "8px");
            rm.style("text-align", "center");
            rm.style("font-weight", "bold");
            rm.style("font-size", "14px");
            rm.style("background", "#f0f0f0");
            rm.openEnd();
            rm.text(control.getTitle());
            rm.close("div");

            // Keys section
            const keys = control.getKeys();
            if (keys && keys.length > 0) {
                rm.openStart("div");
                rm.class("entity-keys");
                rm.style("border-bottom", "1px solid #ccc");
                rm.style("padding", "8px");
                rm.style("font-size", "12px");
                rm.openEnd();
                
                keys.forEach(key => {
                    rm.openStart("div");
                    rm.style("margin", "2px 0");
                    rm.openEnd();
                    rm.text("🔑 ");
                    rm.text(key.getKeyName() + ": " + key.getKeyType());
                    rm.close("div");
                });
                
                rm.close("div");
            }

            // Properties section
            const properties = control.getProperties();
            if (properties && properties.length > 0) {
                rm.openStart("div");
                rm.class("entity-properties");
                rm.style("border-bottom", "1px solid #ccc");
                rm.style("padding", "8px");
                rm.style("font-size", "12px");
                rm.openEnd();
                
                properties.forEach(property => {
                    rm.openStart("div");
                    rm.style("margin", "2px 0");
                    rm.openEnd();
                    rm.text("📝 ");
                    rm.text(property.getPropertyName() + ": " + property.getPropertyType());
                    rm.close("div");
                });
                
                rm.close("div");
            }

            // Navigation Properties section
            const navigationProperties = control.getNavigationProperties();
            if (navigationProperties && navigationProperties.length > 0) {
                rm.openStart("div");
                rm.class("entity-navigation");
                rm.style("padding", "8px");
                rm.style("font-size", "12px");
                rm.openEnd();
                
                navigationProperties.forEach(navProp => {
                    rm.openStart("div");
                    rm.style("margin", "2px 0");
                    rm.openEnd();
                    rm.text("🔗 ");
                    rm.text(navProp.getNavigationName());
                    rm.close("div");
                });
                
                rm.close("div");
            }

            rm.close("div");
        }
    };
} 