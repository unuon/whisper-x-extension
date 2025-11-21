import type { WhisperModelName } from '../utils/types.js';
import { createWhisperX, handleError } from '../utils/helpers.js';

export async function deleteModel(e: any, args: { modelName: WhisperModelName }) {
    e.stopPropagation();
    
    const { modelName } = args;

    try {
        console.log(`[WhisperX] Delete request: ${modelName}`);
        const whisperX = createWhisperX();
        
        if (!whisperX.isModelInstalled(modelName)) {
            console.log(`[WhisperX] Model ${modelName} is not installed`);
            return {
                ok: false,
                data: {
                    modelName,
                    notFound: true,
                    message: `Model ${modelName} is not installed`,
                },
            };
        }

        const success = await whisperX.deleteModel(modelName);

        if (success) {
            console.log(`[WhisperX] Successfully deleted model: ${modelName}`);
            return {
                ok: true,
                data: {
                    modelName,
                    message: `Model ${modelName} deleted successfully`,
                },
            };
        } else {
            return {
                ok: false,
                data: {
                    modelName,
                    error: 'Failed to delete model',
                },
            };
        }
    } catch (error) {
        console.error(`[WhisperX] Error deleting model:`, error);
        return { ok: false, error: handleError(error) };
    }
}

