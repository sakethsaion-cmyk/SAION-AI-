const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openApp: (appName) => ipcRenderer.invoke('open-app', appName),
  platform: process.platform,
  // isElectron: true is what App.tsx checks to detect installed app
  isElectron: true,
})
