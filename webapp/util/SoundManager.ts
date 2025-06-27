/**
 * @namespace de.kernich.odpu.util
 */
export default class SoundManager {
	private static errorAudio: HTMLAudioElement | null = null;
	private static successAudio: HTMLAudioElement | null = null;

	/**
	 * Play error sound
	 */
	public static async FireError(): Promise<void> {
		try {
			if (!this.errorAudio) {
				this.errorAudio = new Audio(sap.ui.require.toUrl("de/kernich/odpu/sounds/error.mp3"));
			}
			await this.errorAudio.play();
		} catch (error) {
			console.warn("Could not play error sound:", error);
		}
	}

	/**
	 * Play success sound
	 */
	public static async FireSuccess(): Promise<void> {
		try {
			if (!this.successAudio) {
				this.successAudio = new Audio(sap.ui.require.toUrl("de/kernich/odpu/sounds/success.mp3"));
			}
			await this.successAudio.play();
		} catch (error) {
			console.warn("Could not play success sound:", error);
		}
	}
} 