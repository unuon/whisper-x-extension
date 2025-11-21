import { handleError } from '../utils/helpers.js';

export async function listAvailableModels(e: any) {
    e.stopPropagation();

    try {
        console.log(`[WhisperX] Listing available models`);
        const { WHISPER_MODELS } = await import('../utils/whisper_models.js');
        
        return { ok: true, data: { models: WHISPER_MODELS } };
    } catch (error) {
        console.error(`[WhisperX] Error listing available models:`, error);
        return { ok: false, error: handleError(error) };
    }
}

