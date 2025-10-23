import { WhisperX } from './core/WhisperX.js';
import type { WhisperModelName, ModelDownloadResult } from './utils/types.js';

// Main exports - Primary classes users will interact with
export { WhisperX } from './core/WhisperX.js';

// Export utility functions and types
export * from './utils/types.js';
export * from './utils/whisper_models.js';

// Default export for convenience
export default WhisperX;

/**
 * Get information about a model (for extension use)
 */
async function getModelInfo(e: any, modelName: WhisperModelName) {
    e.stopPropagation();

    try {
        console.log(`[WhisperX] Getting info for model: ${modelName}`);
        
        const whisperX = new WhisperX();
        const isInstalled = whisperX.isModelInstalled(modelName);
        const modelPath = whisperX.getModelPath(modelName);
        
        let sizeInfo = null;
        if (isInstalled) {
            const size = whisperX.getModelSize(modelName);
            sizeInfo = size ? whisperX.formatSize(size) : null;
        }

        return {
            ok: true,
            data: {
                modelName,
                isInstalled,
                path: modelPath,
                size: sizeInfo,
            },
        };
    } catch (error) {
        console.error(`[WhisperX] Error getting model info:`, error);
        return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

async function listAvailableModels(e: any) {
    e.stopPropagation();

    try {
        console.log(`[WhisperX] Listing available models`);
        
        const { WHISPER_MODELS } = await import('./utils/whisper_models.js');
        
        return {
            ok: true,
            data: {
                models: WHISPER_MODELS,
            },
        };
    } catch (error) {
        console.error(`[WhisperX] Error listing available models:`, error);
        return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * List all installed models (for extension use)
 */
async function listInstalledModels(e: any) {
    e.stopPropagation();

    try {
        console.log(`[WhisperX] Listing installed models`);
        
        const whisperX = new WhisperX();
        const installed = whisperX.getInstalledModelsInfo();
        
        return {
            ok: true,
            data: {
                models: installed,
            },
        };
    } catch (error) {
        console.error(`[WhisperX] Error listing installed models:`, error);
        return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

async function downloadModelInternal(
    downloadId: string,
    modelName: WhisperModelName,
    invokeEvent: any
): Promise<ModelDownloadResult> {
    let processCompletionHandled = false;

    function handleProcessCompletion(
        success: boolean,
        message: string,
        alreadyInstalled = false
    ) {
        if (processCompletionHandled) return;
        processCompletionHandled = true;

        console.log(`[WhisperX] ${message}`);

        // Send completion event
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
        
        // Send progress update
        invokeEvent.sender.send(downloadId, {
            type: "progress",
            data: {
                log: `Downloading model: ${modelName}`,
                progress: 0,
                controllerId: downloadId,
                modelName,
            },
        });

        const whisperX = new WhisperX();
        
        // Check if already installed
        if (whisperX.isModelInstalled(modelName)) {
            handleProcessCompletion(true, `Model ${modelName} is already installed`, true);
            return {
                success: true,
                modelName,
                alreadyInstalled: true,
            };
        }

        // Download the model
        const success = await whisperX.downloadModel(modelName);

        if (success) {
            const size = whisperX.getModelSize(modelName);
            const sizeStr = size ? whisperX.formatSize(size) : 'Unknown size';
            handleProcessCompletion(true, `Model ${modelName} downloaded successfully (${sizeStr})`);
            return {
                success: true,
                modelName,
            };
        } else {
            handleProcessCompletion(false, `Failed to download model: ${modelName}`);
            return {
                success: false,
                modelName,
                error: 'Download failed',
            };
        }

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        handleProcessCompletion(false, `Error downloading model: ${errorMsg}`);
        return {
            success: false,
            modelName,
            error: errorMsg,
        };
    }
}

async function downloadModel(e: any, downloadId: string, args: { modelName: WhisperModelName }) {
    const { modelName } = args;
    
    e.stopPropagation();

    const { invokeEvent } = e;

    console.log(`[WhisperX] Download request: ${downloadId} -> ${modelName}`);
    
    const result = await downloadModelInternal(downloadId, modelName, invokeEvent);

    return { 
        downloadId, 
        controllerId: downloadId,
        result,
    };
}

async function deleteModel(e: any, args: { modelName: WhisperModelName }) {
    const { modelName } = args;
    
    e.stopPropagation();

    try {
        console.log(`[WhisperX] Delete request: ${modelName}`);
        
        const whisperX = new WhisperX();
        
        // Check if installed
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

        // Delete the model
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
        return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export function main({ events, channels, electron: { ipcMain } }: any) {
    events.on("whisperx:getModelInfo", getModelInfo, -10);
    events.on("whisperx:listAvailable", listAvailableModels, -10);
    events.on("whisperx:listInstalled", listInstalledModels, -10);
    events.on("whisperx:downloadModel", downloadModel, -10);
    events.on("whisperx:deleteModel", deleteModel, -10);

    ipcMain.handle(channels.register("whisperx:getModelInfo"), async (e: any, modelName: WhisperModelName) => {
        try {
            const whisperX = new WhisperX();
            const isInstalled = whisperX.isModelInstalled(modelName);
            const modelPath = whisperX.getModelPath(modelName);
            
            let sizeInfo = null;
            if (isInstalled) {
                const size = whisperX.getModelSize(modelName);
                sizeInfo = size ? whisperX.formatSize(size) : null;
            }

            return {
                success: true,
                data: {
                    modelName,
                    isInstalled,
                    path: modelPath,
                    size: sizeInfo,
                },
            };
        } catch (error: any) {
            console.error('[WhisperX] Error getting model info:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    // List all available models
    ipcMain.handle(channels.register("whisperx:listAvailable"), async () => {
        try {
            const { WHISPER_MODELS } = await import('./utils/whisper_models.js');
            return {
                success: true,
                models: WHISPER_MODELS,
            };
        } catch (error: any) {
            console.error('[WhisperX] Error listing available models:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    ipcMain.handle(channels.register("whisperx:listInstalled"), async () => {
        try {
            const whisperX = new WhisperX();
            const installed = whisperX.getInstalledModelsInfo();
            return {
                success: true,
                models: installed,
            };
        } catch (error: any) {
            console.error('[WhisperX] Error listing installed models:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    ipcMain.handle(channels.register("whisperx:downloadModel"), async (e: any, modelName: WhisperModelName) => {
        try {
            console.log(`[WhisperX] IPC download request: ${modelName}`);
            const whisperX = new WhisperX();
            
            // Check if already installed
            if (whisperX.isModelInstalled(modelName)) {
                const size = whisperX.getModelSize(modelName);
                return {
                    success: true,
                    alreadyInstalled: true,
                    message: `Model ${modelName} is already installed`,
                    size: size ? whisperX.formatSize(size) : null,
                };
            }

            // Download the model
            const success = await whisperX.downloadModel(modelName);
            
            if (success) {
                const size = whisperX.getModelSize(modelName);
                return {
                    success: true,
                    message: `Model ${modelName} downloaded successfully`,
                    size: size ? whisperX.formatSize(size) : null,
                };
            } else {
                return {
                    success: false,
                    error: 'Download failed',
                };
            }
        } catch (error: any) {
            console.error('[WhisperX] Error downloading model:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    ipcMain.handle(channels.register("whisperx:deleteModel"), async (e: any, modelName: WhisperModelName) => {
        try {
            console.log(`[WhisperX] IPC delete request: ${modelName}`);
            const whisperX = new WhisperX();
            
            // Check if installed
            if (!whisperX.isModelInstalled(modelName)) {
                return {
                    success: false,
                    notFound: true,
                    message: `Model ${modelName} is not installed`,
                };
            }

            // Delete the model
            const success = await whisperX.deleteModel(modelName);
            
            if (success) {
                return {
                    success: true,
                    message: `Model ${modelName} deleted successfully`,
                };
            } else {
                return {
                    success: false,
                    error: 'Failed to delete model',
                };
            }
        } catch (error: any) {
            console.error('[WhisperX] Error deleting model:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    console.log('[WhisperX] Extension initialized with event handlers and IPC handlers');
}

export { 
    getModelInfo, 
    listAvailableModels,
    listInstalledModels,
    downloadModel, 
    deleteModel,
    downloadModelInternal 
};

