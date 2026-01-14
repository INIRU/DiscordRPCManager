import { contextBridge, ipcRenderer } from 'electron';

export interface RPCActivity {
  details?: string;
  state?: string;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  buttons?: Array<{ label: string; url: string }>;
}

export interface Profile {
  id: string;
  name: string;
  clientId: string;
  activity: RPCActivity;
}

export interface DefaultSettings {
  clientId: string;
  activity: RPCActivity;
}

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  connectRPC: (clientId: string) => ipcRenderer.invoke('rpc:connect', clientId),
  disconnectRPC: () => ipcRenderer.invoke('rpc:disconnect'),
  setActivity: (activity: RPCActivity) => ipcRenderer.invoke('rpc:setActivity', activity),
  clearActivity: () => ipcRenderer.invoke('rpc:clearActivity'),
  getRPCStatus: () => ipcRenderer.invoke('rpc:getStatus'),

  storeGet: (key: string, defaultValue?: unknown) => ipcRenderer.invoke('store:get', key, defaultValue),
  storeSet: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
  getProfiles: () => ipcRenderer.invoke('store:getProfiles'),
  saveProfile: (profile: Profile) => ipcRenderer.invoke('store:saveProfile', profile),
  deleteProfile: (id: string) => ipcRenderer.invoke('store:deleteProfile', id),
  getDefaultSettings: () => ipcRenderer.invoke('store:getDefaultSettings'),
  saveDefaultSettings: (settings: DefaultSettings) => ipcRenderer.invoke('store:saveDefaultSettings', settings),
  clearDefaultSettings: () => ipcRenderer.invoke('store:clearDefaultSettings'),

  getAutoLaunch: () => ipcRenderer.invoke('autoLaunch:get'),
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke('autoLaunch:set', enable),

  getDiscordAppInfo: (clientId: string) => ipcRenderer.invoke('discord:getAppInfo', clientId),
  getDiscordAssets: (clientId: string) => ipcRenderer.invoke('discord:getAssets', clientId),
  getDiscordAssetUrl: (clientId: string, assetId: string) => ipcRenderer.invoke('discord:getAssetUrl', clientId, assetId),
  getDiscordAppIconUrl: (clientId: string, iconHash: string) => ipcRenderer.invoke('discord:getAppIconUrl', clientId, iconHash),
});
