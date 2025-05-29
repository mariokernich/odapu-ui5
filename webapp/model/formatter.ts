/**
 * Formatter for the OData Client application
 */
export default {
	/**
	 * Formats a JSON string with proper indentation
	 * @param sValue - The JSON string or object to format
	 * @returns The formatted JSON string
	 */
	formatJSON(sValue: string | object | null | undefined): string {
		if (!sValue) {
			return "";
		}
		try {
			// If the value is already a string, parse it first
			const jsonObj: unknown =
				typeof sValue === "string" ? JSON.parse(sValue) : sValue;
			// Format with 4 spaces indentation
			return JSON.stringify(jsonObj, null, 4);
		} catch {
			// If parsing fails, return the original value
			return typeof sValue === "string" ? sValue : JSON.stringify(sValue);
		}
	},
};
