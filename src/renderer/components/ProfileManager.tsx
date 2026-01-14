import { useTranslation } from 'react-i18next';
import type { Profile } from '../types';

interface ProfileManagerProps {
  profiles: Profile[];
  onLoad: (profile: Profile) => void;
  onDelete: (id: string) => void;
}

export function ProfileManager({ profiles, onLoad, onDelete }: ProfileManagerProps) {
  const { t } = useTranslation();

  if (profiles.length === 0) {
    return (
      <div className="profile-manager empty">
        <p>{t('profiles.noProfiles')}</p>
        <p className="hint">{t('profiles.noProfilesHint')}</p>
      </div>
    );
  }

  return (
    <div className="profile-manager">
      <div className="profile-list">
        {profiles.map((profile) => (
          <div key={profile.id} className="profile-card">
            <div className="profile-info">
              <h4>{profile.name}</h4>
              <p className="profile-details">
                {profile.activity.details || t('profiles.noDetails')}
              </p>
              <p className="profile-client-id">{t('profiles.clientId')}: {profile.clientId}</p>
            </div>
            <div className="profile-actions">
              <button className="btn btn-primary btn-sm" onClick={() => onLoad(profile)}>
                {t('profiles.load')}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onDelete(profile.id)}
              >
                {t('profiles.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
