/**
 * ROSOIDEAE User Profile Component
 * Public/private profile with editable sections
 */

import { useState, useEffect } from 'react';

interface ProfileData {
  vaultId: string;
  identityMarker: string;
  displayMoniker: string;
  biographyText: string;
  visualAvatar: string;
  privilegeArray: string[];
  registeredMoment: number;
  statistics: {
    totalThreads: number;
    totalThoughts: number;
    averageResonance: number;
    joinedDiscussions: number;
  };
}

interface UserProfileProps {
  vaultId: string;
  isOwnProfile: boolean;
}

export const UserProfile = ({ vaultId, isOwnProfile }: UserProfileProps) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [editedMoniker, setEditedMoniker] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, [vaultId]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`/api/profiles/${vaultId}`);
      const data = await response.json();
      setProfileData(data);
      setEditedBio(data.biographyText || '');
      setEditedMoniker(data.displayMoniker || '');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const saveProfileEdits = async () => {
    try {
      await fetch(`/api/profiles/${vaultId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('rosoToken')}`
        },
        body: JSON.stringify({
          displayMoniker: editedMoniker,
          biographyText: editedBio
        })
      });
      setIsEditing(false);
      fetchProfileData();
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  if (!profileData) {
    return (
      <div style={{ color: '#FFF', padding: '32px' }}>
        Loading profile...
      </div>
    );
  }

  const memberSince = new Date(profileData.registeredMoment).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A0B1F 50%, #5D2E6B 100%)',
      minHeight: '100vh',
      padding: '32px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, #1A0B1F 0%, #5D2E6B33 100%)',
        borderRadius: '16px',
        padding: '32px',
        border: '2px solid #9C1B1B'
      }}>
        {/* Avatar and Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, #9C1B1B 0%, #6B0F0F 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            marginRight: '24px',
            border: '4px solid #5D2E6B'
          }}>
            {profileData.visualAvatar || '👤'}
          </div>

          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input
                type="text"
                value={editedMoniker}
                onChange={(e) => setEditedMoniker(e.target.value)}
                style={{
                  background: '#0A0A0A',
                  color: '#FFF',
                  border: '2px solid #9C1B1B',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  width: '100%',
                  marginBottom: '8px'
                }}
              />
            ) : (
              <h1 style={{
                color: '#FFF',
                fontSize: '36px',
                marginBottom: '8px'
              }}>
                {profileData.displayMoniker}
              </h1>
            )}

            <div style={{ color: '#9C1B1B', fontSize: '16px', marginBottom: '8px' }}>
              @{profileData.identityMarker}
            </div>

            <div style={{ color: '#888', fontSize: '14px' }}>
              Member since {memberSince}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profileData.privilegeArray.map(privilege => (
                <span
                  key={privilege}
                  style={{
                    background: '#5D2E6B',
                    color: '#FFF',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {privilege}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Biography */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#FFF', fontSize: '24px', marginBottom: '16px' }}>
            About
          </h2>
          {isEditing ? (
            <textarea
              value={editedBio}
              onChange={(e) => setEditedBio(e.target.value)}
              style={{
                background: '#0A0A0A',
                color: '#FFF',
                border: '2px solid #9C1B1B',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '16px',
                width: '100%',
                minHeight: '120px',
                fontFamily: 'Inter, sans-serif',
                resize: 'vertical'
              }}
            />
          ) : (
            <p style={{
              color: '#DDD',
              lineHeight: '1.6',
              fontSize: '16px'
            }}>
              {profileData.biographyText || 'No biography provided.'}
            </p>
          )}
        </div>

        {/* Statistics */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#FFF', fontSize: '24px', marginBottom: '16px' }}>
            Statistics
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              background: '#0A0A0A',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #5D2E6B'
            }}>
              <div style={{ color: '#888', fontSize: '12px' }}>Threads Created</div>
              <div style={{ color: '#FFF', fontSize: '24px', fontWeight: 'bold' }}>
                {profileData.statistics.totalThreads}
              </div>
            </div>
            <div style={{
              background: '#0A0A0A',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #5D2E6B'
            }}>
              <div style={{ color: '#888', fontSize: '12px' }}>Thoughts Shared</div>
              <div style={{ color: '#FFF', fontSize: '24px', fontWeight: 'bold' }}>
                {profileData.statistics.totalThoughts}
              </div>
            </div>
            <div style={{
              background: '#0A0A0A',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #5D2E6B'
            }}>
              <div style={{ color: '#888', fontSize: '12px' }}>Avg Resonance</div>
              <div style={{ color: '#FFF', fontSize: '24px', fontWeight: 'bold' }}>
                {profileData.statistics.averageResonance.toFixed(1)}
              </div>
            </div>
            <div style={{
              background: '#0A0A0A',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #5D2E6B'
            }}>
              <div style={{ color: '#888', fontSize: '12px' }}>Discussions</div>
              <div style={{ color: '#FFF', fontSize: '24px', fontWeight: 'bold' }}>
                {profileData.statistics.joinedDiscussions}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Controls */}
        {isOwnProfile && (
          <div style={{ display: 'flex', gap: '12px' }}>
            {isEditing ? (
              <>
                <button
                  onClick={saveProfileEdits}
                  style={{
                    background: 'linear-gradient(135deg, #28A745 0%, #1E7E34 100%)',
                    border: 'none',
                    color: '#FFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedBio(profileData.biographyText || '');
                    setEditedMoniker(profileData.displayMoniker || '');
                  }}
                  style={{
                    background: 'transparent',
                    border: '2px solid #9C1B1B',
                    color: '#FFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  background: 'linear-gradient(135deg, #9C1B1B 0%, #6B0F0F 100%)',
                  border: 'none',
                  color: '#FFF',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
