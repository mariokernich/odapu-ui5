export default class Formatter {
	static formatTime(sValue: string | null | undefined): string {
		if (!sValue) {
			return "";
		}
		try {
			const date = new Date(sValue);
			const hours = date.getHours().toString().padStart(2, '0');
			const minutes = date.getMinutes().toString().padStart(2, '0');
			const seconds = date.getSeconds().toString().padStart(2, '0');
			return `${hours}:${minutes}:${seconds}`;
		} catch {
			return sValue;
		}
	}
}
