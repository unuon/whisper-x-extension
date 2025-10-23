import path from 'path';
import { spawn } from 'child_process';
import { existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import os from 'os';
import type { WhisperModelName } from '../utils/types.js';

export class WhisperX {
  private baseDirectory: string;

  constructor(baseDirectory?: string) {
    this.baseDirectory = baseDirectory || process.cwd();
  }

  getModelsDirectory(): string {
    return path.join(
      this.baseDirectory,
      'node_modules',
      'nodejs-whisper',
      'cpp',
      'whisper.cpp',
      'models'
    );
  }

  getModelPath(modelName: WhisperModelName): string {
    return path.join(this.getModelsDirectory(), `ggml-${modelName}.bin`);
  }

  isModelInstalled(modelName: WhisperModelName): boolean {
    return existsSync(this.getModelPath(modelName));
  }

  async downloadModel(modelName: WhisperModelName, maxRetries: number = 3): Promise<boolean> {
    try {
      // Check if already installed
      if (this.isModelInstalled(modelName)) {
        console.log(`[WhisperX] ✓ Model ${modelName} is already installed`);
        return true;
      }

      const modelsDir = this.getModelsDirectory();
      const isWindows = os.platform() === 'win32';
      
      // Validate environment
      if (!existsSync(modelsDir)) {
        console.error(`[WhisperX] Models directory does not exist: ${modelsDir}`);
        console.error(`[WhisperX] Please ensure nodejs-whisper is properly installed`);
        return false;
      }
      
      const scriptName = isWindows ? 'download-ggml-model.cmd' : 'download-ggml-model.sh';
      const scriptPath = path.join(modelsDir, scriptName);
      
      if (!existsSync(scriptPath)) {
        console.error(`[WhisperX] Download script not found: ${scriptPath}`);
        console.error(`[WhisperX] Please ensure nodejs-whisper is properly installed`);
        return false;
      }
      
      console.log(`[WhisperX] Platform: ${isWindows ? 'Windows' : 'Unix-like'}`);
      console.log(`[WhisperX] Model: ${modelName}`);
      console.log();
      
      // Attempt download with retries
      let attempt = 0;
      while (attempt < maxRetries) {
        attempt++;
        
        if (attempt > 1) {
          console.log(`[WhisperX] Retry attempt ${attempt}/${maxRetries}...`);
        }
        
        const success = await this.executeDownloadScript(isWindows, modelsDir, modelName);
        
        if (success && this.isModelInstalled(modelName)) {
          const size = this.getModelSize(modelName);
          const sizeStr = size ? this.formatSize(size) : 'Unknown';
          console.log(`[WhisperX] ✓ Model installed successfully (${sizeStr})`);
          return true;
        }
        
        // Check if partial download exists (can be resumed)
        const partialPath = this.getModelPath(modelName);
        const hasPartialDownload = existsSync(partialPath);
        
        if (attempt < maxRetries) {
          if (hasPartialDownload) {
            console.log(`[WhisperX] Partial download detected, will resume...`);
          }
          console.log(`[WhisperX] Retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      console.error(`[WhisperX] ✗ Failed to download model after ${maxRetries} attempts`);
      return false;
      
    } catch (error) {
      console.error(`[WhisperX] Error downloading model ${modelName}:`, error);
      return false;
    }
  }

  private executeDownloadScript(
    isWindows: boolean,
    modelsDir: string,
    modelName: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const command = isWindows 
        ? process.env.COMSPEC || 'C:\\Windows\\System32\\cmd.exe'
        : '/bin/bash';
      
      const args = isWindows
        ? ['/c', 'download-ggml-model.cmd', modelName]
        : ['download-ggml-model.sh', modelName];

      const childProcess = spawn(command, args, {
        cwd: modelsDir,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let lastPercent = -1;
      let outputBuffer = '';
      let stderrBuffer = '';
      let hasShownProgress = false;

      // Function to process progress from text
      const processProgress = (text: string) => {
        const lines = text.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          // Extract progress percentage if present
          const percentMatch = trimmed.match(/(\d+)%/);
          
          if (percentMatch && percentMatch[1]) {
            const percent = parseInt(percentMatch[1], 10);
            
            // Only update on significant changes (every 10%) or at 100%
            if (percent !== lastPercent && (percent % 10 === 0 || percent === 100 || !hasShownProgress)) {
              lastPercent = percent;
              hasShownProgress = true;
              
              const message = `[WhisperX] Downloading ${modelName}: ${percent}%`;
              
              // Clear line and write progress (only in TTY)
              if (process.stdout.isTTY) {
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(message);
              } else {
                console.log(message);
              }
            }
          } else if (trimmed.toLowerCase().includes('downloading') && !hasShownProgress) {
            // Initial download message
            console.log(`[WhisperX] Starting download: ${modelName}`);
          } else if (trimmed.toLowerCase().includes('resuming') || trimmed.toLowerCase().includes('continue')) {
            // Download resumption message
            console.log(`[WhisperX] Resuming download: ${modelName}`);
          }
        }
      };

      // Handle output - parse download progress from stdout
      if (childProcess.stdout) {
        childProcess.stdout.on('data', (data: Buffer) => {
          const text = data.toString();
          outputBuffer += text;
          processProgress(outputBuffer);
        });
      }

      // Also check stderr for progress (some tools output progress to stderr)
      if (childProcess.stderr) {
        childProcess.stderr.on('data', (data: Buffer) => {
          const text = data.toString();
          stderrBuffer += text;
          
          // Try to extract progress from stderr too
          processProgress(stderrBuffer);
          
          // Filter and show only actual errors
          const trimmed = text.trim();
          if (trimmed && !trimmed.includes('%') && !trimmed.match(/^[\.\s]+$/)) {
            // Only show actual errors or important messages
            if (trimmed.toLowerCase().includes('error') || 
                trimmed.toLowerCase().includes('failed') ||
                trimmed.toLowerCase().includes('warning')) {
              if (process.stdout.isTTY && hasShownProgress) {
                process.stdout.write('\n');
              }
              console.error(`[WhisperX] ${trimmed}`);
            }
          }
        });
      }

      // Handle completion
      childProcess.on('close', (code: number) => {
        // Move to new line if we were showing progress
        if (process.stdout.isTTY && hasShownProgress) {
          process.stdout.write('\n');
        }
        
        if (code === 0) {
          console.log(`[WhisperX] ✓ Download completed: ${modelName}`);
        } else {
          console.error(`[WhisperX] ✗ Download failed: ${modelName} (exit code: ${code})`);
        }
        
        resolve(code === 0);
      });

      // Handle errors
      childProcess.on('error', (error: Error) => {
        if (process.stdout.isTTY && hasShownProgress) {
          process.stdout.write('\n');
        }
        
        console.error(`[WhisperX] Failed to start download process:`, error);
        
        if (error.message.includes('ENOENT')) {
          if (isWindows) {
            console.error(`[WhisperX] Could not find command: ${command}`);
            console.error(`[WhisperX] Troubleshooting:`);
            console.error(`[WhisperX]   1. Verify nodejs-whisper is properly installed`);
            console.error(`[WhisperX]   2. Check if Windows System32 is in PATH`);
            console.error(`[WhisperX]   3. Try running as administrator`);
          } else {
            console.error(`[WhisperX] Could not find bash or download script`);
            console.error(`[WhisperX] Ensure the script exists and is executable in: ${modelsDir}`);
          }
        }
        
        resolve(false);
      });

      // Timeout after 10 minutes
      const timeout = setTimeout(() => {
        if (process.stdout.isTTY && hasShownProgress) {
          process.stdout.write('\n');
        }
        console.warn(`[WhisperX] Download timeout (10 minutes), terminating...`);
        childProcess.kill('SIGTERM');
        resolve(false);
      }, 10 * 60 * 1000);

      childProcess.on('close', () => clearTimeout(timeout));
    });
  }


  async deleteModel(modelName: WhisperModelName): Promise<boolean> {
    try {
      const modelPath = this.getModelPath(modelName);
      
      if (!existsSync(modelPath)) {
        console.log(`[WhisperX] Model ${modelName} is not installed`);
        return false;
      }

      console.log(`[WhisperX] Deleting model: ${modelName}`);
      unlinkSync(modelPath);
      
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
      return files
        .filter(file => file.startsWith('ggml-') && file.endsWith('.bin'))
        .map(file => file.replace('ggml-', '').replace('.bin', '')) as WhisperModelName[];
    } catch (error) {
      console.error('[WhisperX] Error listing models:', error);
      return [];
    }
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

  getModelSize(modelName: WhisperModelName): number | null {
    try {
      const modelPath = this.getModelPath(modelName);
      if (!existsSync(modelPath)) return null;
      
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
    const value = Math.round((bytes / Math.pow(1024, i)) * 100) / 100;
    
    return `${value} ${sizes[i]}`;
  }
}
