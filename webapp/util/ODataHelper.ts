import ManagedObject from "sap/ui/base/ManagedObject";

/**
 * @namespace de.kernich.odpu.util
 */
export default class ODataHelper extends ManagedObject {
	public static async getMetadataText(servicePath: string) {
		let escaped = servicePath;
		while (escaped.endsWith("/")) {
			escaped = escaped.slice(0, -1);
		}
		const metadata = await fetch(escaped + "/$metadata", {
			headers: {
				"Content-Type": "application/json",
			},
		});
		return await metadata.text();
	}

	public static async getMetadataXml(servicePath: string) {
		const metadata = await this.getMetadataText(servicePath);
		const parser = new DOMParser();
		return parser.parseFromString(metadata, "application/xml");
	}

	public static parseMetadataXml(contents: string) {
		const parser = new DOMParser();
		return parser.parseFromString(contents, "application/xml");
	}

	public static getMaxLength(value: string) {
		try {
			const parsed = Number.parseInt(value, 10);
			if (!isNaN(parsed)) {
				return parsed;
			}
		} catch (error) {
			// Handle parsing error
			console.error("Parsing error:", error);
		}
		return 0;
	}
}
