import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { RPCActivity, DiscordAppInfo, DiscordAsset } from '../types';

interface PreviewProps {
  activity: RPCActivity;
  connected: boolean;
  clientId: string;
}

export function Preview({ activity, connected, clientId }: PreviewProps) {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState('00:00');
  const [appInfo, setAppInfo] = useState<DiscordAppInfo | null>(null);
  const [assets, setAssets] = useState<DiscordAsset[]>([]);
  const [largeImageUrl, setLargeImageUrl] = useState<string | null>(null);
  const [smallImageUrl, setSmallImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setAppInfo(null);
      setAssets([]);
      return;
    }

    const fetchAppData = async () => {
      const [info, assetList] = await Promise.all([
        window.electronAPI.getDiscordAppInfo(clientId),
        window.electronAPI.getDiscordAssets(clientId),
      ]);
      setAppInfo(info);
      setAssets(assetList);
    };

    fetchAppData();
  }, [clientId]);

  useEffect(() => {
    const findAssetUrl = async (key: string | undefined): Promise<string | null> => {
      if (!key || !clientId) return null;
      
      const asset = assets.find((a) => a.name === key);
      if (asset) {
        return `https://cdn.discordapp.com/app-assets/${clientId}/${asset.id}.png`;
      }
      
      if (key.startsWith('mp:external/')) {
        const externalUrl = key.replace('mp:external/', 'https://media.discordapp.net/external/');
        return externalUrl;
      }
      
      return null;
    };

    const updateImages = async () => {
      const largeUrl = await findAssetUrl(activity.largeImageKey);
      const smallUrl = await findAssetUrl(activity.smallImageKey);
      setLargeImageUrl(largeUrl);
      setSmallImageUrl(smallUrl);
    };

    updateImages();
  }, [activity.largeImageKey, activity.smallImageKey, assets, clientId]);

  useEffect(() => {
    if (!activity.startTimestamp) {
      setElapsed('00:00');
      return;
    }

    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.floor((now - activity.startTimestamp!) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (hours > 0) {
        setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activity.startTimestamp]);

  const hasContent = activity.details || activity.state || activity.largeImageKey;
  const hasButtons = activity.buttons && activity.buttons.length > 0;
  const appName = appInfo?.name || t('preview.appName');

  return (
    <div className="preview-container">
      <h3 className="preview-title">{t('preview.title')}</h3>
      
      <div className="preview-card">
        <div className="preview-header">
          <div className="preview-avatar">
            <div className="avatar-placeholder" />
            <div className={`status-dot ${connected ? 'online' : 'offline'}`} />
          </div>
          <div className="preview-user-info">
            <span className="preview-username">{t('preview.username')}</span>
            <span className="preview-status">{connected ? t('preview.online') : t('preview.offline')}</span>
          </div>
        </div>

        {(hasContent || hasButtons) ? (
          <div className="preview-activity">
            <div className="preview-activity-header">{t('preview.playingGame')}</div>
            
            <div className="preview-activity-content">
              {activity.largeImageKey && (
                <div className="preview-image-container">
                  <div className="preview-large-image">
                    {largeImageUrl ? (
                      <img src={largeImageUrl} alt={activity.largeImageText || ''} />
                    ) : (
                      <span className="image-placeholder-text">
                        {activity.largeImageKey.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {activity.smallImageKey && (
                    <div className="preview-small-image">
                      {smallImageUrl ? (
                        <img src={smallImageUrl} alt={activity.smallImageText || ''} />
                      ) : (
                        <span className="image-placeholder-text-sm">
                          {activity.smallImageKey.substring(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="preview-text-content">
                <div className="preview-game-name">{appName}</div>
                {activity.details && (
                  <div className="preview-details">{activity.details}</div>
                )}
                {activity.state && (
                  <div className="preview-state">{activity.state}</div>
                )}
                {activity.startTimestamp && (
                  <div className="preview-elapsed">{elapsed} {t('preview.elapsed')}</div>
                )}
              </div>
            </div>

            {hasButtons && (
              <div className="preview-buttons">
                {activity.buttons!.map((button, index) => (
                  <button key={index} className="preview-button" disabled>
                    {button.label || `${t('preview.button')} ${index + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="preview-empty">
            <span>{t('preview.noActivity')}</span>
          </div>
        )}
      </div>

      {assets.length > 0 && (
        <div className="preview-assets">
          <h4 className="preview-assets-title">{t('preview.availableAssets')}</h4>
          <div className="preview-assets-list">
            {assets.map((asset) => (
              <div key={asset.id} className="preview-asset-item" title={asset.name}>
                <img 
                  src={`https://cdn.discordapp.com/app-assets/${clientId}/${asset.id}.png`} 
                  alt={asset.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="preview-asset-name">{asset.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
