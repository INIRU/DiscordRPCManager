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

export interface DiscordAppInfo {
  id: string;
  name: string;
  icon: string | null;
  description: string;
}

export interface DiscordAsset {
  id: string;
  name: string;
  type: number;
}

export interface DefaultSettings {
  clientId: string;
  activity: RPCActivity;
}

export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;

  connectRPC: (clientId: string) => Promise<{ success: boolean; error?: string }>;
  disconnectRPC: () => Promise<{ success: boolean; error?: string }>;
  setActivity: (activity: RPCActivity) => Promise<{ success: boolean; error?: string }>;
  clearActivity: () => Promise<{ success: boolean; error?: string }>;
  getRPCStatus: () => Promise<{ connected: boolean; clientId: string | null }>;

  storeGet: <T>(key: string, defaultValue?: T) => Promise<T>;
  storeSet: (key: string, value: unknown) => Promise<boolean>;
  getProfiles: () => Promise<Profile[]>;
  saveProfile: (profile: Profile) => Promise<Profile>;
  deleteProfile: (id: string) => Promise<boolean>;

  getAutoLaunch: () => Promise<boolean>;
  setAutoLaunch: (enable: boolean) => Promise<boolean>;

  getDiscordAppInfo: (clientId: string) => Promise<DiscordAppInfo | null>;
  getDiscordAssets: (clientId: string) => Promise<DiscordAsset[]>;
  getDiscordAssetUrl: (clientId: string, assetId: string) => Promise<string>;
  getDiscordAppIconUrl: (clientId: string, iconHash: string) => Promise<string>;

  getDefaultSettings: () => Promise<DefaultSettings | null>;
  saveDefaultSettings: (settings: DefaultSettings) => Promise<boolean>;
  clearDefaultSettings: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
