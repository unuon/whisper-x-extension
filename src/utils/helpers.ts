import { WhisperX } from '../core/WhisperX.js';
import type { WhisperModelName } from './types.js';
import { getBaseDirectory } from '../config/baseDirectory.js';

export function createWhisperX(): WhisperX {
    return new WhisperX(getBaseDirectory());
}

export function handleError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export function getModelInfoData(whisperX: WhisperX, modelName: WhisperModelName) {
    const isInstalled = whisperX.isModelInstalled(modelName);
    const modelPath = whisperX.getModelPath(modelName);
    
    let sizeInfo = null;
    if (isInstalled) {
        const size = whisperX.getModelSize(modelName);
        sizeInfo = size ? whisperX.formatSize(size) : null;
    }

    return {
        modelName,
        isInstalled,
        path: modelPath,
        size: sizeInfo,
    };
}

