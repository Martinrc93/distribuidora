const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('updates', {
    getVersion: () => ipcRenderer.invoke('update:get-version'),
    getStatus: () => ipcRenderer.invoke('update:get-status'),
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    onStatus: (callback) => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on('update:status', listener);
        return () => {
            ipcRenderer.removeListener('update:status', listener);
        };
    }
});

contextBridge.exposeInMainWorld('database', {
    export: () => ipcRenderer.invoke('database:export'),
    import: () => ipcRenderer.invoke('database:import')
});

