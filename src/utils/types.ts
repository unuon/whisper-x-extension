
export type WhisperModelName = 
  | 'tiny' 
  | 'tiny.en' 
  | 'base' 
  | 'base.en' 
  | 'small' 
  | 'small.en' 
  | 'medium' 
  | 'medium.en' 
  | 'large-v1' 
  | 'large' 
  | 'large-v3-turbo';

export interface WhisperModelInfo {
  name: WhisperModelName;
  size: string;
  description: string;
  englishOnly: boolean;
  recommended: boolean;
}

export interface ModelDownloadResult {
  success: boolean;
  modelName: WhisperModelName;
  alreadyInstalled?: boolean;
  error?: string;
}

export interface ModelDeletionResult {
  success: boolean;
  modelName: WhisperModelName;
  notFound?: boolean;
  error?: string;
}

export interface ExtensionEventData {
  type: 'progress' | 'completion' | 'error' | 'log';
  data: {
    log?: string;
    progress?: number;
    exitCode?: number;
    signal?: string;
    controllerId?: string;
    error?: string;
    modelName?: WhisperModelName;
  };
}
