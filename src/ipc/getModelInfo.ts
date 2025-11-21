import type { WhisperModelName } from '../utils/types.js';
import { createWhisperX, getModelInfoData } from '../utils/helpers.js';

export async function ipcGetModelInfo(e: any, modelName: WhisperModelName) {
    try {
        const whisperX = createWhisperX();
        const data = getModelInfoData(whisperX, modelName);
        return { success: true, data };
    } catch (error: any) {
        console.error('[WhisperX] Error getting model info:', error);
        return { success: false, error: error.message };
    }
}

