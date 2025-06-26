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
            actions: { type: "object", defaultValue: [] }
        }
    };

    public static renderer = {
        apiVersion: 2,
        render: function(rm: RenderManager, control: ActionPreview) {
            rm.openStart("div", control);
            rm.class("action-preview-container");
            rm.style("padding", "20px");
            rm.style("overflow", "auto");
            rm.style("height", "100%");
            rm.style("position", "relative");
            rm.openEnd();

            const actions = control.getActions() as MetadataAction[];
            if (actions && actions.length > 0) {
                // Create masonry columns
                const columns = 4;
                const gap = 16;
                const columnWidth = `calc((100% - ${(columns - 1) * gap}px) / ${columns})`;
                
                // Distribute actions dynamically across columns
                const columnContents: MetadataAction[][] = Array.from({ length: columns }, () => []);
                const columnHeights: number[] = Array.from({ length: columns }, () => 0);
                
                // Simple height estimation based on content
                const estimateActionHeight = (action: MetadataAction): number => {
                    let height = 80; // Base height (header + title)
                    height += 40; // Bound/Unbound section
                    if (action.returnType) {
                        height += 40;
                    }
                    if (action.parameters && action.parameters.length > 0) {
                        height += 20 + (action.parameters.length * 20);
                    }
                    return height;
                };
                
                // Place each action in the shortest column
                actions.forEach(action => {
                    const actionHeight = estimateActionHeight(action);
                    let shortestColumn = 0;
                    let minHeight = columnHeights[0];
                    
                    for (let i = 1; i < columns; i++) {
                        if (columnHeights[i] < minHeight) {
                            minHeight = columnHeights[i];
                            shortestColumn = i;
                        }
                    }
                    
                    columnContents[shortestColumn].push(action);
                    columnHeights[shortestColumn] += actionHeight + 16; // 16px margin
                });
                
                // Create column containers
                for (let i = 0; i < columns; i++) {
                    rm.openStart("div");
                    rm.class("masonry-column");
                    rm.style("width", columnWidth);
                    rm.style("float", "left");
                    rm.style("margin-right", i < columns - 1 ? gap + "px" : "0");
                    rm.openEnd();
                    
                    // Add actions to this column
                    for (let j = 0; j < columnContents[i].length; j++) {
                        const action = columnContents[i][j];
                        
                        // Render action box
                        rm.openStart("div");
                        rm.class("action-box");
                        rm.style("border", "1px solid #333");
                        rm.style("border-radius", "8px");
                        rm.style("padding", "0");
                        rm.style("margin", "0 0 16px 0");
                        rm.style("background", "white");
                        rm.style("break-inside", "avoid");
                        rm.openEnd();

                        // Action type header
                        rm.openStart("div");
                        rm.style("border-bottom", "1px solid #ccc");
                        rm.style("padding", "4px 8px");
                        rm.style("text-align", "center");
                        rm.style("font-size", "12px");
                        rm.style("color", "#666");
                        rm.openEnd();
                        rm.text("ACTION");
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
                        rm.text(action.name);
                        rm.close("div");

                        // Bound/Unbound section
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
                        
                        // Bound icon
                        rm.renderControl(new Icon({
                            src: action.isBound ? "sap-icon://chain-link" : "sap-icon://unlink",
                            size: "1rem"
                        }));
                        
                        rm.text(action.isBound ? "Bound" : "Unbound");
                        rm.close("div");
                        
                        rm.close("div");

                        // Return type section (if exists)
                        if (action.returnType) {
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
                            
                            rm.text("Returns: " + action.returnType);
                            rm.close("div");
                            
                            rm.close("div");
                        }

                        // Parameters section
                        if (action.parameters && action.parameters.length > 0) {
                            rm.openStart("div");
                            rm.style("padding", "8px");
                            rm.style("font-size", "12px");
                            rm.openEnd();
                            
                            action.parameters.forEach(parameter => {
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
                                
                                rm.text(parameter.name + ": " + parameter.type + (parameter.nullable ? " (nullable)" : ""));
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
                rm.text("Keine Actions verfügbar");
                rm.close("div");
            }

            rm.close("div");
        }
    };
} 