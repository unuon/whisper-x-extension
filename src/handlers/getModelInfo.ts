import type { WhisperModelName } from '../utils/types.js';
import { createWhisperX, handleError, getModelInfoData } from '../utils/helpers.js';

export async function getModelInfo(e: any, modelName: WhisperModelName) {
    e.stopPropagation();

    try {
        console.log(`[WhisperX] Getting info for model: ${modelName}`);
        const whisperX = createWhisperX();
        const data = getModelInfoData(whisperX, modelName);

        return { ok: true, data };
    } catch (error) {
        console.error(`[WhisperX] Error getting model info:`, error);
        return { ok: false, error: handleError(error) };
    }
}

