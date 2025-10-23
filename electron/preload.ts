import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateReady: (callback: () => void) => ipcRenderer.on('updateReady', callback)
})
