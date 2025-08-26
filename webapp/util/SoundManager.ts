/**
 * @namespace de.kernich.odpu.util
 */
export default class SoundManager {
	private static errorAudio: HTMLAudioElement | null = null;
	private static successAudio: HTMLAudioElement | null = null;
	private static isInitialized: boolean = false;

	/**
	 * Initialize and preload audio files
	 */
	public static initialize(): void {
		if (this.isInitialized) {
			return;
		}

		try {
			// Preload error audio
			this.errorAudio = new Audio(sap.ui.require.toUrl("de/kernich/odpu/sounds/error.mp3"));
			this.errorAudio.preload = "auto";
			this.errorAudio.load();

			// Preload success audio
			this.successAudio = new Audio(sap.ui.require.toUrl("de/kernich/odpu/sounds/success.mp3"));
			this.successAudio.preload = "auto";
			this.successAudio.load();

			this.isInitialized = true;
			console.log("SoundManager: Audio files preloaded successfully");
		} catch (error) {
			console.warn("SoundManager: Could not preload audio files:", error);
		}
	}

	/**
	 * Play error sound
	 */
	public static async FireError(): Promise<void> {
		try {
			if (!this.isInitialized) {
				this.initialize();
			}
			
			if (this.errorAudio) {
				// Reset to beginning in case it was already played
				this.errorAudio.currentTime = 0;
				await this.errorAudio.play();
			}
		} catch (error) {
			console.warn("Could not play error sound:", error);
		}
	}

	/**
	 * Play success sound
	 */
	public static async FireSuccess(): Promise<void> {
		try {
			if (!this.isInitialized) {
				this.initialize();
			}
			
			if (this.successAudio) {
				// Reset to beginning in case it was already played
				this.successAudio.currentTime = 0;
				await this.successAudio.play();
			}
		} catch (error) {
			console.warn("Could not play success sound:", error);
		}
	}

	/**
	 * Check if audio is supported and initialized
	 */
	public static isAudioSupported(): boolean {
		return typeof Audio !== 'undefined' && this.isInitialized;
	}
} 