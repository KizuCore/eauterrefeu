import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';

type IpcCallback = (...args: any[]) => void;

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel: string, data?: any) => {
    ipcRenderer.send(channel, data);
  },

  on: (channel: string, callback: IpcCallback) => {
    ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: any[]) => {
      callback(...args);
    });
  },

  // Convenience function for your update notification
  onUpdateReady: (callback: () => void) => {
    ipcRenderer.on('update-ready', () => {
      callback();
    });
  }
});
