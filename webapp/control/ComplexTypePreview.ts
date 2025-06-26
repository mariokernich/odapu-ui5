import Control from "sap/ui/core/Control";
import RenderManager from "sap/ui/core/RenderManager";
import Icon from "sap/ui/core/Icon";
import { MetadataComplexType } from "../Types";

/**
 * @namespace de.kernich.odpu.control
 */
export default class ComplexTypePreview extends Control {
    public static readonly metadata = {
        properties: {
            complexTypes: { type: "object", defaultValue: [] }
        }
    };

    public static renderer = {
        apiVersion: 2,
        render: function(rm: RenderManager, control: ComplexTypePreview) {
            rm.openStart("div", control);
            rm.class("complex-type-preview-container");
            rm.style("padding", "1rem");
            rm.style("overflow", "auto");
            rm.style("height", "100%");
            rm.style("position", "relative");
            rm.style("background", "#f5f6f7");
            rm.openEnd();

            const complexTypes = control.getProperty("complexTypes") as MetadataComplexType[] || [];
            if (complexTypes && complexTypes.length > 0) {
                // CSS Grid Layout with 5 items per row
                rm.openStart("div");
                rm.style("display", "grid");
                rm.style("grid-template-columns", "repeat(5, 1fr)");
                rm.style("gap", "1rem");
                rm.style("align-items", "start");
                rm.openEnd();
                
                complexTypes.forEach(complexType => {
                    // Render complex type card
                    rm.openStart("div");
                    rm.class("complex-type-card");
                    rm.style("background", "white");
                    rm.style("border-radius", "0.75rem");
                    rm.style("box-shadow", "0 0.125rem 0.5rem 0 rgba(0, 0, 0, 0.08), 0 0.0625rem 0.125rem 0 rgba(0, 0, 0, 0.12)");
                    rm.style("overflow", "hidden");
                    rm.style("border", "1px solid #e5e6e7");
                    rm.style("height", "fit-content");
                    rm.style("box-sizing", "border-box");
                    rm.openEnd();

                    // Header section with icon and title
                    rm.openStart("div");
                    rm.style("background", "linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)");
                    rm.style("color", "white");
                    rm.style("padding", "0.75rem");
                    rm.style("display", "flex");
                    rm.style("align-items", "center");
                    rm.style("gap", "0.5rem");
                    rm.openEnd();
                    
                    // Complex type icon
                    rm.renderControl(new Icon({
                        src: "sap-icon://puzzle",
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
                    rm.text("COMPLEX TYPE");
                    rm.close("div");
                    rm.openStart("div");
                    rm.style("font-size", "0.875rem");
                    rm.style("font-weight", "600");
                    rm.style("word-break", "break-word");
                    rm.openEnd();
                    rm.text(complexType.name);
                    rm.close("div");
                    rm.close("div");
                    rm.close("div");

                    // Content section
                    rm.openStart("div");
                    rm.style("padding", "1rem");
                    rm.openEnd();

                    // Properties section
                    if (complexType.properties && complexType.properties.length > 0) {
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
                            src: "sap-icon://document-text",
                            size: "1rem",
                            color: "#6f42c1"
                        }));
                        rm.text("Properties");
                        rm.close("div");
                        
                        complexType.properties.forEach(property => {
                            rm.openStart("div");
                            rm.style("padding", "0.5rem");
                            rm.style("background", "#f8f9fa");
                            rm.style("border-radius", "0.5rem");
                            rm.style("margin", "0.25rem 0");
                            rm.style("font-size", "0.875rem");
                            rm.style("color", "#354a5f");
                            rm.style("word-wrap", "break-word");
                            rm.openEnd();
                            rm.text(property.name + ": " + (property.maxLength > 0 ? `${property.type}(${property.maxLength})` : property.type));
                            rm.close("div");
                        });
                        
                        rm.close("div");
                    }

                    rm.close("div"); // Close content section
                    rm.close("div"); // Close card
                });
                
                rm.close("div"); // Close grid container
                
            } else {
                rm.openStart("div");
                rm.style("text-align", "center");
                rm.style("color", "#6a6d70");
                rm.style("font-style", "italic");
                rm.style("width", "100%");
                rm.style("padding", "3rem");
                rm.style("background", "white");
                rm.style("border-radius", "0.75rem");
                rm.style("box-shadow", "0 0.125rem 0.5rem 0 rgba(0, 0, 0, 0.08)");
                rm.style("box-sizing", "border-box");
                rm.openEnd();
                rm.text("Keine Complex Types verfügbar");
                rm.close("div");
            }

            rm.close("div");
        }
    };
} 