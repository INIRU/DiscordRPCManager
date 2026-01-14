import Store from 'electron-store';

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

interface StoreSchema {
  lastClientId?: string;
  autoConnect: boolean;
  minimizeToTray: boolean;
  profiles: Profile[];
  defaultSettings?: DefaultSettings;
}

export class StoreService {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'discord-rpc-manager',
      defaults: {
        autoConnect: false,
        minimizeToTray: true,
        profiles: [],
      },
    });
  }

  get(key: keyof StoreSchema, defaultValue?: unknown): unknown {
    return this.store.get(key) ?? defaultValue;
  }

  set(key: keyof StoreSchema, value: unknown): void {
    this.store.set(key, value as StoreSchema[keyof StoreSchema]);
  }

  getProfiles(): Profile[] {
    return this.store.get('profiles') ?? [];
  }

  saveProfile(profile: Profile): Profile {
    const profiles = this.getProfiles();
    const existingIndex = profiles.findIndex((p) => p.id === profile.id);

    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }

    this.store.set('profiles', profiles);
    return profile;
  }

  deleteProfile(id: string): boolean {
    const profiles = this.getProfiles();
    const filteredProfiles = profiles.filter((p) => p.id !== id);

    if (filteredProfiles.length !== profiles.length) {
      this.store.set('profiles', filteredProfiles);
      return true;
    }

    return false;
  }

  getDefaultSettings(): DefaultSettings | null {
    return this.store.get('defaultSettings') ?? null;
  }

  saveDefaultSettings(settings: DefaultSettings): void {
    this.store.set('defaultSettings', settings);
  }

  clearDefaultSettings(): void {
    this.store.delete('defaultSettings');
  }
}
