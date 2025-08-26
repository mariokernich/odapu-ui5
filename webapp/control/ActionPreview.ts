import Control from "sap/ui/core/Control";
import RenderManager from "sap/ui/core/RenderManager";
import Icon from "sap/ui/core/Icon";
import { MetadataAction } from "../Types";

/**
 * @namespace de.kernich.odpu.control
 */
export default class ActionPreview extends Control {
    public static readonly metadata = {
        properties: {
            action: { type: "MetadataAction", defaultValue: null }
        }
    };

    public static renderer = {
        apiVersion: 2,
        render: function(rm: RenderManager, control: ActionPreview) {
            rm.openStart("div", control);
            rm.style("background", "white");
            rm.style("border-radius", "0.75rem");
            rm.style("box-shadow", "0 0.125rem 0.5rem 0 rgba(0, 0, 0, 0.08), 0 0.0625rem 0.125rem 0 rgba(0, 0, 0, 0.12)");
            rm.style("overflow", "hidden");
            rm.style("border", "1px solid #e5e6e7");
            rm.style("height", "fit-content");
            rm.style("box-sizing", "border-box");
            rm.openEnd();

            const action = control.getProperty("action") as MetadataAction;
            if (action) {
                // Header section with icon and title
                rm.openStart("div");
                rm.style("background", "linear-gradient(135deg, #28a745 0%, #20c997 100%)");
                rm.style("color", "white");
                rm.style("padding", "0.75rem");
                rm.style("display", "flex");
                rm.style("align-items", "center");
                rm.style("gap", "0.5rem");
                rm.openEnd();
                
                // Action icon
                rm.renderControl(new Icon({
                    src: "sap-icon://play",
                    size: "1.25rem",
                    color: "white"
                }));
                
                rm.openStart("div");
                rm.style("flex", "1");
                rm.openEnd();
                rm.openStart("div");
                rm.style("font-size", "0.625rem");
                rm.style("opacity", "0.8");
                rm.style("font-weight", "500");
                rm.openEnd();
                rm.text("ACTION");
                rm.close("div");
                rm.openStart("div");
                rm.style("font-size", "0.875rem");
                rm.style("font-weight", "600");
                rm.style("word-break", "break-word");
                rm.openEnd();
                rm.text(action.name);
                rm.close("div");
                rm.close("div");
                rm.close("div");

                // Content section
                rm.openStart("div");
                rm.style("padding", "1rem");
                rm.openEnd();

                // Return type section
                if (action.returnType) {
                    rm.openStart("div");
                    rm.style("margin-bottom", "1rem");
                    rm.openEnd();
                    
                    rm.openStart("div");
                    rm.style("font-size", "0.875rem");
                    rm.style("font-weight", "600");
                    rm.style("color", "#354a5f");
                    rm.style("margin-bottom", "0.5rem");
                    rm.style("display", "flex");
                    rm.style("align-items", "center");
                    rm.style("gap", "0.5rem");
                    rm.openEnd();
                    
                    rm.renderControl(new Icon({
                        src: "sap-icon://arrow-return",
                        size: "1rem",
                        color: "#28a745"
                    }));
                    rm.text("Return Type");
                    rm.close("div");
                    
                    rm.openStart("div");
                    rm.style("padding", "0.5rem");
                    rm.style("background", "#f8f9fa");
                    rm.style("border-radius", "0.5rem");
                    rm.style("font-size", "0.875rem");
                    rm.style("color", "#354a5f");
                    rm.style("word-wrap", "break-word");
                    rm.openEnd();
                    rm.text(action.returnType);
                    rm.close("div");
                    
                    rm.close("div");
                }

                // Parameters section
                if (action.parameters && action.parameters.length > 0) {
                    rm.openStart("div");
                    rm.style("margin-bottom", "0");
                    rm.openEnd();
                    
                    rm.openStart("div");
                    rm.style("font-size", "0.875rem");
                    rm.style("font-weight", "600");
                    rm.style("color", "#354a5f");
                    rm.style("margin-bottom", "0.5rem");
                    rm.style("display", "flex");
                    rm.style("align-items", "center");
                    rm.style("gap", "0.5rem");
                    rm.openEnd();
                    
                    rm.renderControl(new Icon({
                        src: "sap-icon://input",
                        size: "1rem",
                        color: "#28a745"
                    }));
                    rm.text("Parameters");
                    rm.close("div");
                    
                    action.parameters.forEach(parameter => {
                        rm.openStart("div");
                        rm.style("padding", "0.5rem");
                        rm.style("background", "#f8f9fa");
                        rm.style("border-radius", "0.5rem");
                        rm.style("margin", "0.25rem 0");
                        rm.style("font-size", "0.875rem");
                        rm.style("color", "#354a5f");
                        rm.style("word-wrap", "break-word");
                        rm.openEnd();
                        rm.text(parameter.name + ": " + parameter.type + (parameter.nullable ? " (nullable)" : ""));
                        rm.close("div");
                    });
                    
                    rm.close("div");
                }

                rm.close("div"); // Close content section
            }

            rm.close("div");
        }
    };
} 