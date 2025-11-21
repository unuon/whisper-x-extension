import type { WhisperModelName } from '../utils/types.js';
import { createWhisperX } from '../utils/helpers.js';

export async function ipcDeleteModel(e: any, modelName: WhisperModelName) {
    try {
        console.log(`[WhisperX] IPC delete request: ${modelName}`);
        const whisperX = createWhisperX();
        
        if (!whisperX.isModelInstalled(modelName)) {
            return {
                success: false,
                notFound: true,
                message: `Model ${modelName} is not installed`,
            };
        }

        const success = await whisperX.deleteModel(modelName);
        
        if (success) {
            return {
                success: true,
                message: `Model ${modelName} deleted successfully`,
            };
        } else {
            return { success: false, error: 'Failed to delete model' };
        }
    } catch (error: any) {
        console.error('[WhisperX] Error deleting model:', error);
        return { success: false, error: error.message };
    }
}

