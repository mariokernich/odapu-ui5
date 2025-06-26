import Control from "sap/ui/core/Control";
import RenderManager from "sap/ui/core/RenderManager";
import Icon from "sap/ui/core/Icon";
import { MetadataFunction } from "../Types";

/**
 * @namespace de.kernich.odpu.control
 */
export default class FunctionImportPreview extends Control {
    public static readonly metadata = {
        properties: {
            functions: { type: "object", defaultValue: [] }
        }
    };

    public static renderer = {
        apiVersion: 2,
        render: function(rm: RenderManager, control: FunctionImportPreview) {
            rm.openStart("div", control);
            rm.class("function-preview-container");
            rm.style("padding", "20px");
            rm.style("overflow", "auto");
            rm.style("height", "100%");
            rm.style("position", "relative");
            rm.openEnd();

            const functions = control.getFunctions() as MetadataFunction[];
            if (functions && functions.length > 0) {
                // Create masonry columns
                const columns = 4;
                const gap = 16;
                const columnWidth = `calc((100% - ${(columns - 1) * gap}px) / ${columns})`;
                
                // Create column containers
                for (let i = 0; i < columns; i++) {
                    rm.openStart("div");
                    rm.class("masonry-column");
                    rm.style("width", columnWidth);
                    rm.style("float", "left");
                    rm.style("margin-right", i < columns - 1 ? gap + "px" : "0");
                    rm.openEnd();
                    
                    // Add functions to this column
                    for (let j = i; j < functions.length; j += columns) {
                        const func = functions[j];
                        
                        // Render function box
                        rm.openStart("div");
                        rm.class("function-box");
                        rm.style("border", "1px solid #333");
                        rm.style("border-radius", "8px");
                        rm.style("padding", "0");
                        rm.style("margin", "0 0 16px 0");
                        rm.style("background", "white");
                        rm.style("break-inside", "avoid");
                        rm.openEnd();

                        // Function type header
                        rm.openStart("div");
                        rm.style("border-bottom", "1px solid #ccc");
                        rm.style("padding", "4px 8px");
                        rm.style("text-align", "center");
                        rm.style("font-size", "12px");
                        rm.style("color", "#666");
                        rm.openEnd();
                        rm.text("FUNCTION");
                        rm.close("div");

                        // Title section
                        rm.openStart("div");
                        rm.style("border-bottom", "1px solid #ccc");
                        rm.style("padding", "8px");
                        rm.style("text-align", "center");
                        rm.style("font-weight", "bold");
                        rm.style("font-size", "14px");
                        rm.style("background", "#f0f0f0");
                        rm.style("word-break", "break-word");
                        rm.openEnd();
                        rm.text(func.name);
                        rm.close("div");

                        // Return type section
                        if (func.returnType) {
                            rm.openStart("div");
                            rm.style("border-bottom", "1px solid #ccc");
                            rm.style("padding", "8px");
                            rm.style("font-size", "12px");
                            rm.openEnd();
                            
                            rm.openStart("div");
                            rm.style("margin", "2px 0");
                            rm.style("display", "flex");
                            rm.style("align-items", "center");
                            rm.style("gap", "4px");
                            rm.style("word-break", "break-word");
                            rm.openEnd();
                            
                            // Return type icon
                            rm.renderControl(new Icon({
                                src: "sap-icon://arrow-return",
                                size: "1rem"
                            }));
                            
                            rm.text("Returns: " + func.returnType);
                            rm.close("div");
                            
                            rm.close("div");
                        }

                        // Method section
                        rm.openStart("div");
                        rm.style("border-bottom", "1px solid #ccc");
                        rm.style("padding", "8px");
                        rm.style("font-size", "12px");
                        rm.openEnd();
                        
                        rm.openStart("div");
                        rm.style("margin", "2px 0");
                        rm.style("display", "flex");
                        rm.style("align-items", "center");
                        rm.style("gap", "4px");
                        rm.openEnd();
                        
                        // Method icon
                        rm.renderControl(new Icon({
                            src: "sap-icon://request",
                            size: "1rem"
                        }));
                        
                        rm.text("Method: " + func.method);
                        rm.close("div");
                        
                        rm.close("div");

                        // Parameters section
                        if (func.parameters && func.parameters.length > 0) {
                            rm.openStart("div");
                            rm.style("padding", "8px");
                            rm.style("font-size", "12px");
                            rm.openEnd();
                            
                            func.parameters.forEach(parameter => {
                                rm.openStart("div");
                                rm.style("margin", "2px 0");
                                rm.style("display", "flex");
                                rm.style("align-items", "center");
                                rm.style("gap", "4px");
                                rm.style("word-break", "break-word");
                                rm.openEnd();
                                
                                // Parameter icon
                                rm.renderControl(new Icon({
                                    src: "sap-icon://input",
                                    size: "1rem"
                                }));
                                
                                rm.text(parameter.name + ": " + (parameter.maxLength > 0 ? `${parameter.type}(${parameter.maxLength})` : parameter.type));
                                rm.close("div");
                            });
                            
                            rm.close("div");
                        }

                        rm.close("div");
                    }
                    
                    rm.close("div");
                }
                
                // Clear float
                rm.openStart("div");
                rm.style("clear", "both");
                rm.openEnd();
                rm.close("div");
                
            } else {
                rm.openStart("div");
                rm.style("text-align", "center");
                rm.style("color", "#666");
                rm.style("font-style", "italic");
                rm.style("width", "100%");
                rm.style("padding", "40px");
                rm.openEnd();
                rm.text("Keine Function Imports verfügbar");
                rm.close("div");
            }

            rm.close("div");
        }
    };
} 