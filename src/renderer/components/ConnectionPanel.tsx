import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type ConnectionStatus = 'connected' | 'disconnected' | 'warning';

interface ConnectionPanelProps {
  clientId: string;
  setClientId: (id: string) => void;
  status: ConnectionStatus;
  warningMessage: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  error: string | null;
}

export function ConnectionPanel({
  clientId,
  setClientId,
  status,
  warningMessage,
  onConnect,
  onDisconnect,
  error,
}: ConnectionPanelProps) {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return t('connection.connected');
      case 'warning':
        return t('connection.warning');
      case 'disconnected':
      default:
        return t('connection.disconnected');
    }
  };

  return (
    <div className="connection-panel">
      <div className="connection-status">
        <div 
          className="status-indicator-wrapper"
          onMouseEnter={() => status === 'warning' && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span className={`status-indicator ${status}`} />
          {showTooltip && warningMessage && (
            <div className="status-tooltip">
              {warningMessage}
            </div>
          )}
        </div>
        <span className={`status-text ${status}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="connection-form">
        <input
          type="text"
          className="input"
          placeholder={t('connection.clientIdPlaceholder')}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          disabled={status === 'connected' || status === 'warning'}
        />
        
        {status === 'connected' || status === 'warning' ? (
          <button className="btn btn-danger" onClick={onDisconnect}>
            {t('connection.disconnect')}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onConnect}>
            {t('connection.connect')}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
