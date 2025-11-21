import type { WhisperModelName } from '../utils/types.js';
import { createWhisperX } from '../utils/helpers.js';

export async function ipcDownloadModel(e: any, modelName: WhisperModelName) {
    try {
        console.log(`[WhisperX] IPC download request: ${modelName}`);
        const whisperX = createWhisperX();
        
        if (whisperX.isModelInstalled(modelName)) {
            const size = whisperX.getModelSize(modelName);
            return {
                success: true,
                alreadyInstalled: true,
                message: `Model ${modelName} is already installed`,
                size: size ? whisperX.formatSize(size) : null,
            };
        }

        const success = await whisperX.downloadModel(modelName);
        
        if (success) {
            const size = whisperX.getModelSize(modelName);
            return {
                success: true,
                message: `Model ${modelName} downloaded successfully`,
                size: size ? whisperX.formatSize(size) : null,
            };
        } else {
            return { success: false, error: 'Download failed' };
        }
    } catch (error: any) {
        console.error('[WhisperX] Error downloading model:', error);
        return { success: false, error: error.message };
    }
}

