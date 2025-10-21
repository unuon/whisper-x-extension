import path from 'path';
import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import type { WhisperModelName } from '../utils/types.js';

export class WhisperX {
  isModelInstalled(modelName: WhisperModelName): boolean {
    const modelPath = this.getModelPath(modelName);
    return existsSync(modelPath);
  }

  getModelPath(modelName: WhisperModelName): string {
    const modelsDir = path.join(
      process.cwd(),
      'node_modules',
      'nodejs-whisper',
      'cpp',
      'whisper.cpp',
      'models'
    );
    return path.join(modelsDir, `ggml-${modelName}.bin`);
  }

  getModelsDirectory(): string {
    return path.join(
      process.cwd(),
      'node_modules',
      'nodejs-whisper',
      'cpp',
      'whisper.cpp',
      'models'
    );
  }

  async downloadModel(modelName: WhisperModelName): Promise<boolean> {
    try {
      console.log(`[WhisperX] Downloading model: ${modelName}`);
      
      // Check if already installed
      if (this.isModelInstalled(modelName)) {
        console.log(`[WhisperX] Model ${modelName} is already installed`);
        return true;
      }

      // Download directly using the download script with model name as argument
      const modelsDir = this.getModelsDirectory();
      const command = `bash download-ggml-model.sh ${modelName}`;
      
      console.log(`[WhisperX] Starting download of ${modelName}...`);
      console.log(`[WhisperX] This may take several minutes depending on model size`);
      console.log(`[WhisperX] Progress will be shown below:`);
      console.log();
      
      execSync(command, { 
        stdio: 'inherit',
        cwd: modelsDir,
        shell: '/bin/bash'
      });

      // Verify the download was successful
      if (this.isModelInstalled(modelName)) {
        const size = this.getModelSize(modelName);
        const sizeStr = size ? this.formatSize(size) : 'Unknown';
        console.log(`[WhisperX] Successfully downloaded model: ${modelName} (${sizeStr})`);
        return true;
      } else {
        console.error(`[WhisperX] Model file not found after download`);
        return false;
      }
    } catch (error) {
      console.error(`[WhisperX] Error downloading model ${modelName}:`, error);
      return false;
    }
  }

  async deleteModel(modelName: WhisperModelName): Promise<boolean> {
    try {
      const modelPath = this.getModelPath(modelName);
      
      if (!existsSync(modelPath)) {
        console.log(`[WhisperX] Model ${modelName} is not installed`);
        return false;
      }

      console.log(`[WhisperX] Deleting model: ${modelName}`);
      execSync(`rm -f "${modelPath}"`, { stdio: 'inherit' });
      
      console.log(`[WhisperX] Successfully deleted model: ${modelName}`);
      return true;
    } catch (error) {
      console.error(`[WhisperX] Error deleting model ${modelName}:`, error);
      return false;
    }
  }

  listInstalledModels(): WhisperModelName[] {
    try {
      const modelsDir = this.getModelsDirectory();

      if (!existsSync(modelsDir)) {
        return [];
      }

      const files = readdirSync(modelsDir);
      const models = files
        .filter(file => file.startsWith('ggml-') && file.endsWith('.bin'))
        .map(file => {
          return file.replace('ggml-', '').replace('.bin', '');
        }) as WhisperModelName[];

      return models;
    } catch (error) {
      console.error('[WhisperX] Error listing models:', error);
      return [];
    }
  }

  getModelSize(modelName: WhisperModelName): number | null {
    try {
      const modelPath = this.getModelPath(modelName);
      if (!existsSync(modelPath)) {
        return null;
      }
      const stats = statSync(modelPath);
      return stats.size;
    } catch (error) {
      console.error(`[WhisperX] Error getting model size:`, error);
      return null;
    }
  }

  formatSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getInstalledModelsInfo(): Array<{ name: WhisperModelName; size: string; path: string }> {
    const installedModels = this.listInstalledModels();
    return installedModels.map(modelName => {
      const size = this.getModelSize(modelName);
      return {
        name: modelName,
        size: size ? this.formatSize(size) : 'Unknown',
        path: this.getModelPath(modelName),
      };
    });
  }
}
