import { WhisperX } from './core/WhisperX.js';
import { setBaseDirectory, getBaseDirectory } from './config/baseDirectory.js';
import { getModelInfo } from './handlers/getModelInfo.js';
import { listAvailableModels } from './handlers/listAvailableModels.js';
import { listInstalledModels } from './handlers/listInstalledModels.js';
import { downloadModel } from './handlers/downloadModel.js';
import { deleteModel } from './handlers/deleteModel.js';
import { ipcGetModelInfo } from './ipc/getModelInfo.js';
import { ipcListAvailableModels } from './ipc/listAvailableModels.js';
import { ipcListInstalledModels } from './ipc/listInstalledModels.js';
import { ipcDownloadModel } from './ipc/downloadModel.js';
import { ipcDeleteModel } from './ipc/deleteModel.js';

export { WhisperX } from './core/WhisperX.js';
export * from './utils/types.js';
export * from './utils/whisper_models.js';
export default WhisperX;

export {
    setBaseDirectory,
    getBaseDirectory,
    getModelInfo,
    listAvailableModels,
    listInstalledModels,
    downloadModel,
    deleteModel
};

export function main({ events, channels, electron: { ipcMain } }: any) {
    const extensionPath = __dirname;
    const extensionRoot = extensionPath.replace(/[\\/]dist$/, '');
    
    console.log(`[Extendr] Extension path: ${extensionPath}`);
    console.log(`[Extendr] Extension root: ${extensionRoot}`);
    
    setBaseDirectory(extensionRoot);

    const getModelInfoId = channels.register("extendr:getModelInfo");
    const listAvailableId = channels.register("extendr:listAvailable");
    const listInstalledId = channels.register("extendr:listInstalled");
    const downloadModelId = channels.register("extendr:downloadModel");
    const deleteModelId = channels.register("extendr:deleteModel");

    events.on(getModelInfoId, getModelInfo, -10);
    events.on(listAvailableId, listAvailableModels, -10);
    events.on(listInstalledId, listInstalledModels, -10);
    events.on(downloadModelId, downloadModel, -10);
    events.on(deleteModelId, deleteModel, -10);

    ipcMain.handle(getModelInfoId, ipcGetModelInfo);
    ipcMain.handle(listAvailableId, ipcListAvailableModels);
    ipcMain.handle(listInstalledId, ipcListInstalledModels);
    ipcMain.handle(downloadModelId, ipcDownloadModel);
    ipcMain.handle(deleteModelId, ipcDeleteModel);

    console.log('[Extendr] Extension initialized successfully');
}
