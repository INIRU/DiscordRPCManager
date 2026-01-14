import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TitleBar } from './components/TitleBar';
import { ConnectionPanel, ConnectionStatus } from './components/ConnectionPanel';
import { ActivityForm } from './components/ActivityForm';
import { ProfileManager } from './components/ProfileManager';
import { Settings } from './components/Settings';
import { Preview } from './components/Preview';
import { ToastContainer, ToastType } from './components/Toast';
import type { RPCActivity, Profile } from './types';

type Tab = 'activity' | 'profiles' | 'settings';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

function App() {
  const { t } = useTranslation();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [currentTab, setCurrentTab] = useState<Tab>('activity');
  const [activity, setActivity] = useState<RPCActivity>({
    details: '',
    state: '',
    largeImageKey: '',
    largeImageText: '',
    smallImageKey: '',
    smallImageText: '',
    buttons: [],
  });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      const status = await window.electronAPI.getRPCStatus();
      setConnectionStatus(status.connected ? 'connected' : 'disconnected');
      if (status.clientId) {
        setClientId(status.clientId);
      }

      const defaultSettings = await window.electronAPI.getDefaultSettings();
      if (defaultSettings) {
        if (!status.clientId) {
          setClientId(defaultSettings.clientId);
        }
        setActivity(defaultSettings.activity);
      } else {
        const savedClientId = await window.electronAPI.storeGet<string>('lastClientId', '');
        if (savedClientId && !status.clientId) {
          setClientId(savedClientId);
        }
      }

      const savedProfiles = await window.electronAPI.getProfiles();
      setProfiles(savedProfiles);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleConnect = async () => {
    if (!clientId.trim()) {
      setError(t('connection.clientIdRequired'));
      return;
    }

    setError(null);
    setWarningMessage(null);
    const result = await window.electronAPI.connectRPC(clientId);
    
    if (result.success) {
      setConnectionStatus('connected');
      await window.electronAPI.storeSet('lastClientId', clientId);
      showToast(t('connection.connectSuccess'), 'success');
    } else {
      setError(result.error || t('connection.connectFailed'));
      showToast(result.error || t('connection.connectFailed'), 'error');
    }
  };

  const handleDisconnect = async () => {
    const result = await window.electronAPI.disconnectRPC();
    if (result.success) {
      setConnectionStatus('disconnected');
      setWarningMessage(null);
      showToast(t('connection.disconnectSuccess'), 'info');
    }
  };

  const handleUpdateActivity = async () => {
    if (connectionStatus === 'disconnected') {
      setError(t('activity.notConnected'));
      showToast(t('activity.notConnected'), 'error');
      return;
    }

    setError(null);
    const result = await window.electronAPI.setActivity(activity);
    
    if (result.success) {
      setConnectionStatus('connected');
      setWarningMessage(null);
      showToast(t('activity.updateSuccess'), 'success');
    } else {
      setConnectionStatus('warning');
      setWarningMessage(result.error || t('activity.updateFailed'));
      showToast(result.error || t('activity.updateFailed'), 'error');
    }
  };

  const handleClearActivity = async () => {
    if (connectionStatus === 'disconnected') return;

    const result = await window.electronAPI.clearActivity();
    if (result.success) {
      setActivity({
        details: '',
        state: '',
        largeImageKey: '',
        largeImageText: '',
        smallImageKey: '',
        smallImageText: '',
        buttons: [],
      });
      setConnectionStatus('connected');
      setWarningMessage(null);
      showToast(t('activity.clearSuccess'), 'success');
    } else {
      setConnectionStatus('warning');
      setWarningMessage(result.error || t('activity.clearFailed'));
    }
  };

  const handleSaveProfile = async (name: string) => {
    const profile: Profile = {
      id: Date.now().toString(),
      name,
      clientId,
      activity,
    };

    const saved = await window.electronAPI.saveProfile(profile);
    setProfiles((prev) => [...prev, saved]);
    showToast(t('profiles.saveSuccess'), 'success');
  };

  const handleLoadProfile = (profile: Profile) => {
    setClientId(profile.clientId);
    setActivity(profile.activity);
    setCurrentTab('activity');
    showToast(t('profiles.loadSuccess'), 'success');
  };

  const handleDeleteProfile = async (id: string) => {
    await window.electronAPI.deleteProfile(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveAsDefault = async () => {
    await window.electronAPI.saveDefaultSettings({
      clientId,
      activity,
    });
    showToast(t('activity.savedAsDefault'), 'success');
  };

  const isConnected = connectionStatus === 'connected' || connectionStatus === 'warning';

  return (
    <div className="app">
      <TitleBar />
      
      <div className="app-content">
        <ConnectionPanel
          clientId={clientId}
          setClientId={setClientId}
          status={connectionStatus}
          warningMessage={warningMessage}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          error={error}
        />

        <nav className="tabs">
          <button
            className={`tab ${currentTab === 'activity' ? 'active' : ''}`}
            onClick={() => setCurrentTab('activity')}
          >
            {t('tabs.activity')}
          </button>
          <button
            className={`tab ${currentTab === 'profiles' ? 'active' : ''}`}
            onClick={() => setCurrentTab('profiles')}
          >
            {t('tabs.profiles')}
          </button>
          <button
            className={`tab ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentTab('settings')}
          >
            {t('tabs.settings')}
          </button>
        </nav>

        <div className="main-content">
          <div className="tab-content">
            {currentTab === 'activity' && (
              <ActivityForm
                activity={activity}
                setActivity={setActivity}
                onUpdate={handleUpdateActivity}
                onClear={handleClearActivity}
                onSaveProfile={handleSaveProfile}
                onSaveAsDefault={handleSaveAsDefault}
                disabled={!isConnected}
              />
            )}

            {currentTab === 'profiles' && (
              <ProfileManager
                profiles={profiles}
                onLoad={handleLoadProfile}
                onDelete={handleDeleteProfile}
              />
            )}

            {currentTab === 'settings' && <Settings />}
          </div>

          {currentTab === 'activity' && (
            <div className="preview-panel">
              <Preview activity={activity} connected={isConnected} clientId={clientId} />
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
