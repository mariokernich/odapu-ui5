import Control from "sap/ui/core/Control";
import RenderManager from "sap/ui/core/RenderManager";
import Icon from "sap/ui/core/Icon";
import { MetadataEntity } from "../Types";

/**
 * @namespace de.kernich.odpu.control
 */
export default class EntityPreview extends Control {
    public static readonly metadata = {
        properties: {
            entities: { type: "object", defaultValue: [] }
        }
    };

    public static renderer = {
        apiVersion: 2,
        render: function(rm: RenderManager, control: EntityPreview) {
            rm.openStart("div", control);
            rm.class("entity-preview-container");
            rm.style("padding", "20px");
            rm.style("overflow", "auto");
            rm.style("height", "100%");
            rm.style("position", "relative");
            rm.openEnd();

            const entities = control.getEntities() as MetadataEntity[];
            if (entities && entities.length > 0) {
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
                    
                    // Add entities to this column
                    for (let j = i; j < entities.length; j += columns) {
                        const entity = entities[j];
                        
                        // Render entity box
                        rm.openStart("div");
                        rm.class("entity-box");
                        rm.style("border", "1px solid #333");
                        rm.style("border-radius", "8px");
                        rm.style("padding", "0");
                        rm.style("margin", "0 0 16px 0");
                        rm.style("background", "white");
                        rm.style("break-inside", "avoid");
                        rm.openEnd();

                        // Entity type header
                        rm.openStart("div");
                        rm.style("border-bottom", "1px solid #ccc");
                        rm.style("padding", "4px 8px");
                        rm.style("text-align", "center");
                        rm.style("font-size", "12px");
                        rm.style("color", "#666");
                        rm.openEnd();
                        rm.text("ENTITY");
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
                        rm.text(entity.name);
                        rm.close("div");

                        // Keys section
                        if (entity.keys && entity.keys.length > 0) {
                            rm.openStart("div");
                            rm.style("border-bottom", "1px solid #ccc");
                            rm.style("padding", "8px");
                            rm.style("font-size", "12px");
                            rm.openEnd();
                            
                            entity.keys.forEach(key => {
                                rm.openStart("div");
                                rm.style("margin", "2px 0");
                                rm.style("display", "flex");
                                rm.style("align-items", "center");
                                rm.style("gap", "4px");
                                rm.style("word-break", "break-word");
                                rm.openEnd();
                                
                                // Key icon
                                rm.renderControl(new Icon({
                                    src: "sap-icon://key",
                                    size: "1rem"
                                }));
                                
                                rm.text(key.name + ": " + (key.maxLength > 0 ? `${key.type}(${key.maxLength})` : key.type));
                                rm.close("div");
                            });
                            
                            rm.close("div");
                        }

                        // Properties section
                        if (entity.properties && entity.properties.length > 0) {
                            rm.openStart("div");
                            rm.style("border-bottom", "1px solid #ccc");
                            rm.style("padding", "8px");
                            rm.style("font-size", "12px");
                            rm.openEnd();
                            
                            entity.properties.forEach(property => {
                                rm.openStart("div");
                                rm.style("margin", "2px 0");
                                rm.style("display", "flex");
                                rm.style("align-items", "center");
                                rm.style("gap", "4px");
                                rm.style("word-break", "break-word");
                                rm.openEnd();
                                
                                // Property icon
                                rm.renderControl(new Icon({
                                    src: "sap-icon://document-text",
                                    size: "1rem"
                                }));
                                
                                rm.text(property.name + ": " + (property.maxLength > 0 ? `${property.type}(${property.maxLength})` : property.type));
                                rm.close("div");
                            });
                            
                            rm.close("div");
                        }

                        // Navigation Properties section
                        if (entity.navigationProperties && entity.navigationProperties.length > 0) {
                            rm.openStart("div");
                            rm.style("padding", "8px");
                            rm.style("font-size", "12px");
                            rm.openEnd();
                            
                            entity.navigationProperties.forEach(navProp => {
                                rm.openStart("div");
                                rm.style("margin", "2px 0");
                                rm.style("display", "flex");
                                rm.style("align-items", "center");
                                rm.style("gap", "4px");
                                rm.style("word-break", "break-word");
                                rm.openEnd();
                                
                                // Navigation icon
                                rm.renderControl(new Icon({
                                    src: "sap-icon://chain-link",
                                    size: "1rem"
                                }));
                                
                                rm.text(navProp.name);
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
                rm.text("Keine Entitäten verfügbar");
                rm.close("div");
            }

            rm.close("div");
        }
    };
} 