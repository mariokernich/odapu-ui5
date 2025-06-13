import DatePicker from "sap/m/DatePicker";
import DateTimePicker from "sap/m/DateTimePicker";
import Input from "sap/m/Input";
import MessageBox from "sap/m/MessageBox";
import StepInput from "sap/m/StepInput";
import Switch from "sap/m/Switch";
import TimePicker from "sap/m/TimePicker";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";

/**
 * @namespace de.kernich.odpu.util
 */
export default class Util extends ManagedObject {
	public static async copy2Clipboard(text: string) {
		await navigator.clipboard.writeText(text);
	}

	public static openUrl(url: string) {
		window.open(url, "_blank");
	}

	public static showError(error: unknown) {
		if (typeof error === "string") {
			MessageBox.error(error);
		} else if (error instanceof Error) {
			MessageBox.error(error.toString());
		} else {
			MessageBox.error(JSON.stringify(error));
		}
	}

	public static getErrorMessage(error: unknown): string {
		if (typeof error === "string") {
			return error;
		} else if (error instanceof Error) {
			return error.toString();
		}
		return JSON.stringify(error);
	}

	public static formatXml(xml: string): string {
		let formatted = "";
		let indent = "";
		const tab = "    "; // 4 spaces for indentation
		xml.split(/>\s*</).forEach((node) => {
			if (node.match(/^\/\w/)) {
				// Closing tag
				indent = indent.substring(tab.length);
			}
			formatted += indent + "<" + node + ">\r\n";
			if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("?")) {
				// Opening tag
				indent += tab;
			}
		});
		return formatted.substring(1, formatted.length - 3);
	}

	public static resetInputs(control: Control) {
		if ((control instanceof Input 
			|| control instanceof Switch
			|| control instanceof StepInput
			|| control instanceof DatePicker
			|| control instanceof TimePicker
			|| control instanceof DateTimePicker) && control.getVisible() === true
			) {
				if(control instanceof Switch) {
					control.setState(false);
				} else  {
					control.setValue("" as never);
				}
		}
		if (control instanceof Control) {
			const items = control.getAggregation("items") as Control[];
			if (items) {
				items.forEach((item) => {
					Util.resetInputs(item);
				});
			}
		}
	}

	public static getAllInputValues(control: Control): Record<string, string | number | boolean> {
		let values: Record<string, string | number | boolean> = {};
		if ((control instanceof Input 
			|| control instanceof Switch
			|| control instanceof StepInput
			|| control instanceof DatePicker
			|| control instanceof TimePicker
			|| control instanceof DateTimePicker) && control.getVisible() === true
			) {
				if(control instanceof Switch) {
					values[control.getName()] = control.getEnabled();
				} else  {
					values[control.getName()] = control.getValue();
				}
		}
		if (control instanceof Control) {
			const items = control.getAggregation("items") as Control[];
			if (items) {
				items.forEach((item) => {
					values = { ...values, ...Util.getAllInputValues(item) };
				});
			}
		}
		return values;
	};

	public static download(data: string, filename: string) {
		const blob = new Blob([data], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
	}
}
