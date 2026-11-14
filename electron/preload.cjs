const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('serms', {
  appInfo: () => ipcRenderer.invoke('app:info'),
  testDatabase: (credentials) => ipcRenderer.invoke('db:test', credentials),
  live: {
    connect: (credentials) => ipcRenderer.invoke('live:connect', credentials),
    refresh: () => ipcRenderer.invoke('live:refresh'),
    facultyRoster: (payload) => ipcRenderer.invoke('live:facultyRoster', payload),
    facultyGrade: (payload) => ipcRenderer.invoke('live:facultyGrade', payload),
    assessment: (studid) => ipcRenderer.invoke('live:assessment', studid),
    saveGrades: (payload) => ipcRenderer.invoke('live:saveGrades', payload),
    disconnect: () => ipcRenderer.invoke('live:disconnect'),
  },
})
