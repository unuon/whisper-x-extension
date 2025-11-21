export async function ipcListAvailableModels() {
    try {
        const { WHISPER_MODELS } = await import('../utils/whisper_models.js');
        return { success: true, models: WHISPER_MODELS };
    } catch (error: any) {
        console.error('[WhisperX] Error listing available models:', error);
        return { success: false, error: error.message };
    }
}

