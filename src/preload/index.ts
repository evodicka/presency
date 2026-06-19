import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('presenceAPI', {
  loadData: (): Promise<Record<string, unknown>> => ipcRenderer.invoke('load-data'),
  saveData: (data: Record<string, unknown>): Promise<void> => ipcRenderer.invoke('save-data', data),
  getVersion: (): Promise<string> => ipcRenderer.invoke('get-version')
})
