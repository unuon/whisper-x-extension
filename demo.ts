/**
 * Interactive Demo - Primary Extension Workflow
 * 
 * This demonstrates the main use case:
 * 1. List all available models
 * 2. Show which are installed
 * 3. Let user select a model
 * 4. Download the selected model with progress
 */

import * as readline from 'readline';
import { WhisperX, WHISPER_MODELS, type WhisperModelName } from './src/index.ts';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        WhisperX Extension - Interactive Demo              ║');
  console.log('║        Primary Workflow: List → Select → Download         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  const whisperX = new WhisperX();

  // ============================================
  // STEP 1: List Available Models
  // ============================================
  console.log('📋 STEP 1: Available Whisper Models\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const installedModels = whisperX.listInstalledModels();
  
  WHISPER_MODELS.forEach((model, index) => {
    const isInstalled = installedModels.includes(model.name);
    const status = isInstalled ? '✅ Installed' : '⬜ Not installed';
    const recommended = model.recommended ? '⭐' : '  ';
    
    console.log(`${recommended} ${index + 1}. ${model.name.padEnd(18)} ${model.size.padEnd(10)} ${status}`);
    console.log(`      ${model.description}`);
    if (isInstalled) {
      const info = whisperX.getInstalledModelsInfo().find(m => m.name === model.name);
      if (info) {
        console.log(`      📁 ${info.path}`);
      }
    }
    console.log();
  });

  // ============================================
  // STEP 2: Show Currently Installed
  // ============================================
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('💾 STEP 2: Currently Installed Models\n');
  
  if (installedModels.length === 0) {
    console.log('   No models installed yet\n');
  } else {
    const installedInfo = whisperX.getInstalledModelsInfo();
    installedInfo.forEach(model => {
      console.log(`   ✅ ${model.name}: ${model.size}`);
    });
    console.log();
  }

  // ============================================
  // STEP 3: User Selection
  // ============================================
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🎯 STEP 3: Select a Model to Download\n');
  console.log('Enter the model name (e.g., tiny.en, base, large-v3-turbo)');
  console.log('or type "list" to see options again, "cancel" to exit\n');

  const modelName = await question('Model name: ');
  console.log();

  if (modelName.toLowerCase() === 'cancel' || modelName.toLowerCase() === 'exit') {
    console.log('👋 Cancelled. Goodbye!\n');
    rl.close();
    return;
  }

  if (modelName.toLowerCase() === 'list') {
    console.log('Available models:');
    WHISPER_MODELS.forEach(m => console.log(`  - ${m.name}`));
    console.log();
    rl.close();
    return;
  }

  // Validate model name
  const validModel = WHISPER_MODELS.find(m => m.name === modelName);
  if (!validModel) {
    console.log(`❌ Invalid model name: "${modelName}"`);
    console.log('\nValid models are:');
    WHISPER_MODELS.forEach(m => console.log(`  - ${m.name}`));
    console.log();
    rl.close();
    return;
  }

  // Check if already installed
  if (whisperX.isModelInstalled(modelName as WhisperModelName)) {
    console.log(`ℹ️  Model "${modelName}" is already installed!`);
    const size = whisperX.getModelSize(modelName as WhisperModelName);
    if (size) {
      console.log(`   Size: ${whisperX.formatSize(size)}`);
    }
    console.log(`   Path: ${whisperX.getModelPath(modelName as WhisperModelName)}`);
    console.log();
    
    const redownload = await question('Download anyway? (y/n): ');
    if (redownload.toLowerCase() !== 'y') {
      console.log('👋 Cancelled. Goodbye!\n');
      rl.close();
      return;
    }
    console.log();
  }

  // ============================================
  // STEP 4: Download with Progress
  // ============================================
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📦 STEP 4: Downloading Model\n');
  console.log(`Model: ${validModel.name}`);
  console.log(`Size: ${validModel.size}`);
  console.log(`Description: ${validModel.description}`);
  console.log();

  const confirm = await question('Start download? (y/n): ');
  console.log();

  if (confirm.toLowerCase() !== 'y') {
    console.log('👋 Cancelled. Goodbye!\n');
    rl.close();
    return;
  }

  rl.close();

  console.log('🚀 Starting download...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    const success = await whisperX.downloadModel(modelName as WhisperModelName);
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
    if (success) {
      console.log('✅ Download Complete!\n');
      
      const info = whisperX.getInstalledModelsInfo().find(m => m.name === modelName);
      if (info) {
        console.log(`Model: ${info.name}`);
        console.log(`Size: ${info.size}`);
        console.log(`Path: ${info.path}`);
      }
      
      console.log();
      console.log('💾 All Installed Models:');
      whisperX.getInstalledModelsInfo().forEach(m => {
        console.log(`   ✅ ${m.name}: ${m.size}`);
      });
      console.log();
      
    } else {
      console.log('❌ Download Failed\n');
      console.log('Please check the error messages above.\n');
    }
    
  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.error('❌ Error during download:', error);
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✨ Demo Complete!\n');
}

main().catch(console.error);

