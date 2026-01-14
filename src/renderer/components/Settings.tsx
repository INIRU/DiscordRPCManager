import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function Settings() {
  const { t, i18n } = useTranslation();
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [autoConnect, setAutoConnect] = useState(false);
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    const loadSettings = async () => {
      const [autoLaunchVal, autoConnectVal, minimizeToTrayVal] = await Promise.all([
        window.electronAPI.getAutoLaunch(),
        window.electronAPI.storeGet<boolean>('autoConnect', false),
        window.electronAPI.storeGet<boolean>('minimizeToTray', true),
      ]);
      
      setAutoLaunch(autoLaunchVal);
      setAutoConnect(autoConnectVal);
      setMinimizeToTray(minimizeToTrayVal);
    };

    loadSettings();
  }, []);

  const handleAutoLaunchChange = async (enabled: boolean) => {
    await window.electronAPI.setAutoLaunch(enabled);
    setAutoLaunch(enabled);
  };

  const handleAutoConnectChange = async (enabled: boolean) => {
    await window.electronAPI.storeSet('autoConnect', enabled);
    setAutoConnect(enabled);
  };

  const handleMinimizeToTrayChange = async (enabled: boolean) => {
    await window.electronAPI.storeSet('minimizeToTray', enabled);
    setMinimizeToTray(enabled);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="settings">
      <div className="settings-section">
        <h3>{t('settings.startup')}</h3>
        <div className="setting-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoLaunch}
              onChange={(e) => handleAutoLaunchChange(e.target.checked)}
            />
            {t('settings.startWithWindows')}
          </label>
          <p className="setting-description">
            {t('settings.startWithWindowsDesc')}
          </p>
        </div>
        <div className="setting-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoConnect}
              onChange={(e) => handleAutoConnectChange(e.target.checked)}
            />
            {t('settings.autoConnect')}
          </label>
          <p className="setting-description">
            {t('settings.autoConnectDesc')}
          </p>
        </div>
      </div>

      <div className="settings-section">
        <h3>{t('settings.behavior')}</h3>
        <div className="setting-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={minimizeToTray}
              onChange={(e) => handleMinimizeToTrayChange(e.target.checked)}
            />
            {t('settings.minimizeToTray')}
          </label>
          <p className="setting-description">
            {t('settings.minimizeToTrayDesc')}
          </p>
        </div>
      </div>

      <div className="settings-section">
        <h3>{t('settings.language')}</h3>
        <div className="setting-item">
          <div className="language-select">
            <select
              className="input"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="en">{t('languages.en')}</option>
              <option value="ko">{t('languages.ko')}</option>
            </select>
          </div>
          <p className="setting-description">
            {t('settings.languageDesc')}
          </p>
        </div>
      </div>

      <div className="settings-section">
        <h3>{t('settings.about')}</h3>
        <p className="about-text">
          {t('settings.version')}
        </p>
        <p className="about-description">
          {t('settings.description')}
        </p>
      </div>
    </div>
  );
}
