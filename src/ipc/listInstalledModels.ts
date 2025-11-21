import { createWhisperX } from '../utils/helpers.js';

export async function ipcListInstalledModels() {
    try {
        const whisperX = createWhisperX();
        const installed = whisperX.getInstalledModelsInfo();
        return { success: true, models: installed };
    } catch (error: any) {
        console.error('[WhisperX] Error listing installed models:', error);
        return { success: false, error: error.message };
    }
}

