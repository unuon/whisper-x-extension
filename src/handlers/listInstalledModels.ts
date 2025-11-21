import { createWhisperX, handleError } from '../utils/helpers.js';

export async function listInstalledModels(e: any) {
    e.stopPropagation();

    try {
        console.log(`[WhisperX] Listing installed models`);
        const whisperX = createWhisperX();
        const installed = whisperX.getInstalledModelsInfo();
        
        return { ok: true, data: { models: installed } };
    } catch (error) {
        console.error(`[WhisperX] Error listing installed models:`, error);
        return { ok: false, error: handleError(error) };
    }
}

