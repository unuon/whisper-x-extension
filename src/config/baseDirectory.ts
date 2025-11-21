let globalBaseDirectory: string | undefined;

export function setBaseDirectory(directory: string) {
    globalBaseDirectory = directory;
    console.log(`[WhisperX] Base directory set to: ${directory}`);
}

export function getBaseDirectory(): string | undefined {
    return globalBaseDirectory;
}

