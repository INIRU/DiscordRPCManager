import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, NativeImage, net } from 'electron';
import * as path from 'path';
import { DiscordRPCService, RPCActivity } from './discord-rpc';
import { StoreService, Profile, DefaultSettings } from './store';

interface DiscordAppInfo {
  id: string;
  name: string;
  icon: string | null;
  description: string;
}

interface DiscordAsset {
  id: string;
  name: string;
  type: number;
}

async function fetchDiscordAppInfo(clientId: string): Promise<DiscordAppInfo | null> {
  return new Promise((resolve) => {
    const request = net.request(`https://discord.com/api/v10/applications/${clientId}/rpc`);
    
    let data = '';
    
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            id: json.id,
            name: json.name,
            icon: json.icon,
            description: json.description || '',
          });
        } catch {
          resolve(null);
        }
      });
    });
    
    request.on('error', () => {
      resolve(null);
    });
    
    request.end();
  });
}

async function fetchDiscordAssets(clientId: string): Promise<DiscordAsset[]> {
  return new Promise((resolve) => {
    const request = net.request(`https://discord.com/api/v10/oauth2/applications/${clientId}/assets`);
    
    let data = '';
    
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(Array.isArray(json) ? json : []);
        } catch {
          resolve([]);
        }
      });
    });
    
    request.on('error', () => {
      resolve([]);
    });
    
    request.end();
  });
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let discordRPC: DiscordRPCService;
let store: StoreService;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    minWidth: 700,
    minHeight: 600,
    frame: false,
    transparent: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (event) => {
    if (store.get('minimizeToTray', true)) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray(): void {
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
  let trayIcon: NativeImage;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow?.show();
      },
    },
    {
      label: 'Toggle RPC',
      click: () => {
        if (discordRPC.isConnected()) {
          discordRPC.disconnect();
        } else {
          discordRPC.connect();
        }
        updateTrayMenu();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        discordRPC.disconnect();
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Discord RPC Manager');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow?.show();
  });
}

function updateTrayMenu(): void {
  if (!tray) return;

  const isConnected = discordRPC.isConnected();
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow?.show();
      },
    },
    {
      label: isConnected ? 'Disconnect RPC' : 'Connect RPC',
      click: () => {
        if (isConnected) {
          discordRPC.disconnect();
        } else {
          discordRPC.connect();
        }
        updateTrayMenu();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        discordRPC.disconnect();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function setupIPC(): void {
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('rpc:connect', async (_, clientId: string) => {
    try {
      await discordRPC.connect(clientId);
      updateTrayMenu();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('rpc:disconnect', async () => {
    try {
      discordRPC.disconnect();
      updateTrayMenu();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('rpc:setActivity', async (_, activity: RPCActivity) => {
    try {
      await discordRPC.setActivity(activity);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('rpc:clearActivity', async () => {
    try {
      await discordRPC.clearActivity();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('rpc:getStatus', () => {
    return {
      connected: discordRPC.isConnected(),
      clientId: discordRPC.getClientId(),
    };
  });

  ipcMain.handle('store:get', (_, key: string, defaultValue?: unknown) => {
    return store.get(key as 'lastClientId' | 'autoConnect' | 'minimizeToTray' | 'profiles', defaultValue);
  });

  ipcMain.handle('store:set', (_, key: string, value: unknown) => {
    store.set(key as 'lastClientId' | 'autoConnect' | 'minimizeToTray' | 'profiles', value);
    return true;
  });

  ipcMain.handle('store:getProfiles', () => {
    return store.getProfiles();
  });

  ipcMain.handle('store:saveProfile', (_, profile: Profile) => {
    return store.saveProfile(profile);
  });

  ipcMain.handle('store:deleteProfile', (_, id: string) => {
    return store.deleteProfile(id);
  });

  ipcMain.handle('store:getDefaultSettings', () => {
    return store.getDefaultSettings();
  });

  ipcMain.handle('store:saveDefaultSettings', (_, settings: DefaultSettings) => {
    store.saveDefaultSettings(settings);
    return true;
  });

  ipcMain.handle('store:clearDefaultSettings', () => {
    store.clearDefaultSettings();
    return true;
  });

  ipcMain.handle('autoLaunch:get', () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle('autoLaunch:set', (_, enable: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: true,
    });
    return true;
  });

  ipcMain.handle('discord:getAppInfo', async (_, clientId: string) => {
    return await fetchDiscordAppInfo(clientId);
  });

  ipcMain.handle('discord:getAssets', async (_, clientId: string) => {
    return await fetchDiscordAssets(clientId);
  });

  ipcMain.handle('discord:getAssetUrl', (_, clientId: string, assetId: string) => {
    return `https://cdn.discordapp.com/app-assets/${clientId}/${assetId}.png`;
  });

  ipcMain.handle('discord:getAppIconUrl', (_, clientId: string, iconHash: string) => {
    return `https://cdn.discordapp.com/app-icons/${clientId}/${iconHash}.png`;
  });
}

app.whenReady().then(() => {
  store = new StoreService();
  discordRPC = new DiscordRPCService();

  createWindow();
  createTray();
  setupIPC();

  const savedClientId = store.get('lastClientId') as string | undefined;
  const autoConnect = store.get('autoConnect', false) as boolean;
  
  if (savedClientId && autoConnect) {
    discordRPC.connect(savedClientId).catch(console.error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    return;
  }
});

app.on('before-quit', () => {
  discordRPC?.disconnect();
});
