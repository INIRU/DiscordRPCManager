// eslint-disable-next-line @typescript-eslint/no-require-imports
const DiscordRPC = require('discord-rpc');

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

interface DiscordPresence {
  details?: string;
  state?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  buttons?: Array<{ label: string; url: string }>;
}

interface DiscordClient {
  on(event: string, callback: (...args: unknown[]) => void): void;
  login(options: { clientId: string }): Promise<void>;
  destroy(): void;
  setActivity(presence: DiscordPresence): Promise<void>;
  clearActivity(): Promise<void>;
}

export class DiscordRPCService {
  private client: DiscordClient | null = null;
  private clientId: string | null = null;
  private connected: boolean = false;
  private currentActivity: RPCActivity | null = null;
  private connectPromiseResolve: (() => void) | null = null;
  private connectPromiseReject: ((error: Error) => void) | null = null;

  async connect(clientId?: string): Promise<void> {
    if (clientId) {
      this.clientId = clientId;
    }

    if (!this.clientId) {
      throw new Error('Client ID is required');
    }

    if (this.client) {
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      this.connectPromiseResolve = resolve;
      this.connectPromiseReject = reject;

      try {
        this.client = new DiscordRPC.Client({ transport: 'ipc' }) as DiscordClient;

        this.client.on('ready', () => {
          console.log('Discord RPC connected!');
          this.connected = true;

          if (this.currentActivity) {
            this.setActivity(this.currentActivity).catch(console.error);
          }

          if (this.connectPromiseResolve) {
            this.connectPromiseResolve();
            this.connectPromiseResolve = null;
            this.connectPromiseReject = null;
          }
        });

        this.client.on('disconnected', () => {
          console.log('Discord RPC disconnected');
          this.connected = false;
        });

        this.client.login({ clientId: this.clientId! }).catch((error: Error) => {
          this.connected = false;
          this.client = null;
          if (this.connectPromiseReject) {
            this.connectPromiseReject(error);
            this.connectPromiseResolve = null;
            this.connectPromiseReject = null;
          }
        });

        setTimeout(() => {
          if (this.connectPromiseReject && !this.connected) {
            this.connectPromiseReject(new Error('Connection timeout - Discord가 실행 중인지 확인하세요'));
            this.connectPromiseResolve = null;
            this.connectPromiseReject = null;
            this.disconnect();
          }
        }, 10000);

      } catch (error) {
        this.connected = false;
        this.client = null;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.client) {
      try {
        this.client.destroy();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      this.client = null;
      this.connected = false;
    }
  }

  async setActivity(activity: RPCActivity): Promise<void> {
    if (!this.client || !this.connected) {
      throw new Error('Not connected to Discord');
    }

    this.currentActivity = activity;

    const discordActivity: DiscordPresence = {};

    if (activity.details) {
      discordActivity.details = activity.details;
    }

    if (activity.state) {
      discordActivity.state = activity.state;
    }

    if (activity.largeImageKey) {
      discordActivity.largeImageKey = activity.largeImageKey;
      if (activity.largeImageText) {
        discordActivity.largeImageText = activity.largeImageText;
      }
    }

    if (activity.smallImageKey) {
      discordActivity.smallImageKey = activity.smallImageKey;
      if (activity.smallImageText) {
        discordActivity.smallImageText = activity.smallImageText;
      }
    }

    if (activity.startTimestamp) {
      discordActivity.startTimestamp = activity.startTimestamp;
    }

    if (activity.endTimestamp) {
      discordActivity.endTimestamp = activity.endTimestamp;
    }

    if (activity.buttons && activity.buttons.length > 0) {
      discordActivity.buttons = activity.buttons.slice(0, 2).map((btn) => ({
        label: btn.label,
        url: btn.url,
      }));
    }

    await this.client.setActivity(discordActivity);
  }

  async clearActivity(): Promise<void> {
    if (!this.client || !this.connected) {
      throw new Error('Not connected to Discord');
    }

    this.currentActivity = null;
    await this.client.clearActivity();
  }

  isConnected(): boolean {
    return this.connected;
  }

  getClientId(): string | null {
    return this.clientId;
  }
}
