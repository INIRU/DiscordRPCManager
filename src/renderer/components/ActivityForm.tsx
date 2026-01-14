import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RPCActivity } from '../types';

interface ActivityFormProps {
  activity: RPCActivity;
  setActivity: (activity: RPCActivity) => void;
  onUpdate: () => void;
  onClear: () => void;
  onSaveProfile: (name: string) => void;
  onSaveAsDefault: () => void;
  disabled: boolean;
}

export function ActivityForm({
  activity,
  setActivity,
  onUpdate,
  onClear,
  onSaveProfile,
  onSaveAsDefault,
  disabled,
}: ActivityFormProps) {
  const { t } = useTranslation();
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const updateField = <K extends keyof RPCActivity>(key: K, value: RPCActivity[K]) => {
    setActivity({ ...activity, [key]: value });
  };

  const handleAddButton = () => {
    const buttons = activity.buttons || [];
    if (buttons.length < 2) {
      updateField('buttons', [...buttons, { label: '', url: '' }]);
    }
  };

  const handleRemoveButton = (index: number) => {
    const buttons = activity.buttons || [];
    updateField('buttons', buttons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (index: number, field: 'label' | 'url', value: string) => {
    const buttons = [...(activity.buttons || [])];
    buttons[index] = { ...buttons[index], [field]: value };
    updateField('buttons', buttons);
  };

  const handleStartTimestamp = () => {
    if (showTimestamp) {
      updateField('startTimestamp', undefined);
      setShowTimestamp(false);
    } else {
      updateField('startTimestamp', Date.now());
      setShowTimestamp(true);
    }
  };

  const handleSaveProfile = () => {
    if (profileName.trim()) {
      onSaveProfile(profileName.trim());
      setProfileName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <div className="activity-form">
      <div className="form-section">
        <h3>{t('activity.statusText')}</h3>
        <div className="form-group">
          <label>{t('activity.details')}</label>
          <input
            type="text"
            className="input"
            placeholder={t('activity.detailsPlaceholder')}
            value={activity.details || ''}
            onChange={(e) => updateField('details', e.target.value)}
            disabled={disabled}
            maxLength={128}
          />
        </div>
        <div className="form-group">
          <label>{t('activity.state')}</label>
          <input
            type="text"
            className="input"
            placeholder={t('activity.statePlaceholder')}
            value={activity.state || ''}
            onChange={(e) => updateField('state', e.target.value)}
            disabled={disabled}
            maxLength={128}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>{t('activity.images')}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{t('activity.largeImageKey')}</label>
            <input
              type="text"
              className="input"
              placeholder={t('activity.largeImageKeyPlaceholder')}
              value={activity.largeImageKey || ''}
              onChange={(e) => updateField('largeImageKey', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="form-group">
            <label>{t('activity.largeImageText')}</label>
            <input
              type="text"
              className="input"
              placeholder={t('activity.hoverText')}
              value={activity.largeImageText || ''}
              onChange={(e) => updateField('largeImageText', e.target.value)}
              disabled={disabled}
              maxLength={128}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>{t('activity.smallImageKey')}</label>
            <input
              type="text"
              className="input"
              placeholder={t('activity.largeImageKeyPlaceholder')}
              value={activity.smallImageKey || ''}
              onChange={(e) => updateField('smallImageKey', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="form-group">
            <label>{t('activity.smallImageText')}</label>
            <input
              type="text"
              className="input"
              placeholder={t('activity.hoverText')}
              value={activity.smallImageText || ''}
              onChange={(e) => updateField('smallImageText', e.target.value)}
              disabled={disabled}
              maxLength={128}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>{t('activity.timestamp')}</h3>
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showTimestamp}
              onChange={handleStartTimestamp}
              disabled={disabled}
            />
            {t('activity.showElapsedTime')}
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>{t('activity.buttons')} ({(activity.buttons || []).length}/2)</h3>
        <p className="form-hint">{t('activity.buttonsHint')}</p>
        {(activity.buttons || []).map((button, index) => (
          <div key={index} className="button-row">
            <input
              type="text"
              className="input"
              placeholder={t('activity.buttonLabel')}
              value={button.label}
              onChange={(e) => handleButtonChange(index, 'label', e.target.value)}
              disabled={disabled}
              maxLength={32}
            />
            <input
              type="text"
              className="input"
              placeholder={t('activity.buttonUrl')}
              value={button.url}
              onChange={(e) => handleButtonChange(index, 'url', e.target.value)}
              disabled={disabled}
            />
            <button
              className="btn btn-icon btn-danger"
              onClick={() => handleRemoveButton(index)}
              disabled={disabled}
            >
              ✕
            </button>
          </div>
        ))}
        {(activity.buttons || []).length < 2 && (
          <button
            className="btn btn-secondary"
            onClick={handleAddButton}
            disabled={disabled}
          >
            {t('activity.addButton')}
          </button>
        )}
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={onUpdate} disabled={disabled}>
          {t('activity.updateActivity')}
        </button>
        <button className="btn btn-secondary" onClick={onClear} disabled={disabled}>
          {t('activity.clearActivity')}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowSaveDialog(true)}
          disabled={disabled}
        >
          {t('activity.saveProfile')}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onSaveAsDefault}
        >
          {t('activity.saveAsDefault')}
        </button>
      </div>

      {showSaveDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>{t('saveDialog.title')}</h3>
            <input
              type="text"
              className="input"
              placeholder={t('saveDialog.namePlaceholder')}
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              autoFocus
            />
            <div className="dialog-actions">
              <button className="btn btn-primary" onClick={handleSaveProfile}>
                {t('saveDialog.save')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowSaveDialog(false)}
              >
                {t('saveDialog.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
