import type { WhisperModelInfo, WhisperModelName } from './types.js';

export const WHISPER_MODELS: WhisperModelInfo[] = [
  {
    name: 'tiny',
    size: '~75 MB',
    description: 'Fastest, least accurate. Good for quick testing.',
    englishOnly: false,
    recommended: false,
  },
  {
    name: 'tiny.en',
    size: '~75 MB',
    description: 'Fastest, English-only. Good for quick English transcription.',
    englishOnly: true,
    recommended: false,
  },
  {
    name: 'base',
    size: '~142 MB',
    description: 'Fast and decent accuracy. Good balance for multilingual.',
    englishOnly: false,
    recommended: true,
  },
  {
    name: 'base.en',
    size: '~142 MB',
    description: 'Fast and decent accuracy. Good balance for English.',
    englishOnly: true,
    recommended: true,
  },
  {
    name: 'small',
    size: '~466 MB',
    description: 'Better accuracy, slower processing. Good for quality multilingual transcription.',
    englishOnly: false,
    recommended: false,
  },
  {
    name: 'small.en',
    size: '~466 MB',
    description: 'Better accuracy, slower processing. Good for quality English transcription.',
    englishOnly: true,
    recommended: false,
  },
  {
    name: 'medium',
    size: '~1.5 GB',
    description: 'High accuracy, requires more resources. Professional multilingual transcription.',
    englishOnly: false,
    recommended: false,
  },
  {
    name: 'medium.en',
    size: '~1.5 GB',
    description: 'High accuracy, requires more resources. Professional English transcription.',
    englishOnly: true,
    recommended: false,
  },
  {
    name: 'large-v1',
    size: '~3 GB',
    description: 'Highest accuracy, very slow. For best quality multilingual transcription.',
    englishOnly: false,
    recommended: false,
  },
  {
    name: 'large',
    size: '~3 GB',
    description: 'Highest accuracy, very slow. Latest large model.',
    englishOnly: false,
    recommended: false,
  },
  {
    name: 'large-v3-turbo',
    size: '~1.6 GB',
    description: 'Fast large model with good accuracy. Best overall for production use.',
    englishOnly: false,
    recommended: true,
  },
];

export function getModelInfo(modelName: WhisperModelName): WhisperModelInfo | undefined {
  return WHISPER_MODELS.find(m => m.name === modelName);
}

export function getAvailableModels(): WhisperModelName[] {
  return WHISPER_MODELS.map(m => m.name);
}

export function getRecommendedModels(): WhisperModelInfo[] {
  return WHISPER_MODELS.filter(m => m.recommended);
}

export function getEnglishOnlyModels(): WhisperModelInfo[] {
  return WHISPER_MODELS.filter(m => m.englishOnly);
}

export function getMultilingualModels(): WhisperModelInfo[] {
  return WHISPER_MODELS.filter(m => !m.englishOnly);
}

