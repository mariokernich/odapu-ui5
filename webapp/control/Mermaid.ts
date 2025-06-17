import Control from "sap/ui/core/Control";
import RenderManager from "sap/ui/core/RenderManager";

/**
 * @namespace de.kernich.odpu.control
 */
export default class Mermaid extends Control {
	static readonly metadata = {
		interfaces: ["sap.ui.core.IContent"],
		properties: {
			zoomLevel: {
				type: "float",
				defaultValue: 1
			}
		}
	};

	renderer = {
		apiVersion: 2,
		render: (rm: RenderManager, control: Mermaid) => {
			rm.openStart("div");
			rm.attr("id", "mermaid-diagram-wrapper");
			rm.attr("style", "overflow-x: scroll;padding:20px;overflow-y: scroll;");
			rm.openEnd();

			rm.openStart("div", control);
			rm.attr("id", "mermaid-diagram");
			rm.openEnd();


			rm.close("div");
			rm.close("div");
		}
	};
}