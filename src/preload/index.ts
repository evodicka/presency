import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('presenceAPI', {
  loadData: (): Promise<Record<string, string>> => ipcRenderer.invoke('load-data'),
  saveData: (data: Record<string, string>): Promise<void> => ipcRenderer.invoke('save-data', data)
})
