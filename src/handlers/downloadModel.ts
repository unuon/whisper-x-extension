import type { WhisperModelName, ModelDownloadResult } from '../utils/types.js';
import { createWhisperX, handleError } from '../utils/helpers.js';

async function downloadModelInternal(
    downloadId: string,
    modelName: WhisperModelName,
    invokeEvent: any
): Promise<ModelDownloadResult> {
    let processCompletionHandled = false;

    function sendCompletion(success: boolean, message: string) {
        if (processCompletionHandled) return;
        processCompletionHandled = true;

        console.log(`[WhisperX] ${message}`);
        
        setTimeout(() => {
            invokeEvent.sender.send(downloadId, {
                type: "completion",
                data: {
                    log: message,
                    exitCode: success ? 0 : 1,
                    controllerId: downloadId,
                    modelName,
                },
            });
        }, 100);
    }

    try {
        console.log(`[WhisperX] Starting model download: ${modelName}`);
        
        invokeEvent.sender.send(downloadId, {
            type: "progress",
            data: {
                log: `Downloading model: ${modelName}`,
                progress: 0,
                controllerId: downloadId,
                modelName,
            },
        });

        const whisperX = createWhisperX();
        
        if (whisperX.isModelInstalled(modelName)) {
            sendCompletion(true, `Model ${modelName} is already installed`);
            return { success: true, modelName, alreadyInstalled: true };
        }

        const success = await whisperX.downloadModel(modelName);

        if (success) {
            const size = whisperX.getModelSize(modelName);
            const sizeStr = size ? whisperX.formatSize(size) : 'Unknown size';
            sendCompletion(true, `Model ${modelName} downloaded successfully (${sizeStr})`);
            return { success: true, modelName };
        } else {
            sendCompletion(false, `Failed to download model: ${modelName}`);
            return { success: false, modelName, error: 'Download failed' };
        }
    } catch (error) {
        const errorMsg = handleError(error);
        sendCompletion(false, `Error downloading model: ${errorMsg}`);
        return { success: false, modelName, error: errorMsg };
    }
}

export async function downloadModel(e: any, downloadId: string, args: { modelName: WhisperModelName }) {
    e.stopPropagation();
    
    const { modelName } = args;
    const { invokeEvent } = e;

    console.log(`[WhisperX] Download request: ${downloadId} -> ${modelName}`);
    
    const result = await downloadModelInternal(downloadId, modelName, invokeEvent);

    return { downloadId, controllerId: downloadId, result };
}

