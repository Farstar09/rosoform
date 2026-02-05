/**
 * ROSOIDEAE Manager Dashboard
 * Administrative control panel with analytics
 */

import { useState, useEffect } from 'react';

interface DashboardMetrics {
  totalThreads: number;
  activeThreads: number;
  totalThoughts: number;
  registeredIdentities: number;
  averageResonance: number;
  discussionVelocity: number;
}

interface PendingApproval {
  itemId: string;
  itemType: 'thread' | 'thought';
  content: string;
  authorName: string;
  submittedAt: number;
}

export const ManagerDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingApproval[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'approvals' | 'analytics'>('overview');

  useEffect(() => {
    fetchDashboardMetrics();
    fetchPendingApprovals();
    
    const refreshInterval = setInterval(() => {
      fetchDashboardMetrics();
      fetchPendingApprovals();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch('/api/manager/metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('rosoToken')}`
        }
      });
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/manager/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('rosoToken')}`
        }
      });
      const data = await response.json();
      setPendingItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch pending items:', error);
    }
  };

  const approveItem = async (itemId: string) => {
    try {
      await fetch(`/api/manager/approve/${itemId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('rosoToken')}`
        }
      });
      setPendingItems(prev => prev.filter(item => item.itemId !== itemId));
    } catch (error) {
      console.error('Failed to approve item:', error);
    }
  };

  const rejectItem = async (itemId: string) => {
    try {
      await fetch(`/api/manager/reject/${itemId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('rosoToken')}`
        }
      });
      setPendingItems(prev => prev.filter(item => item.itemId !== itemId));
    } catch (error) {
      console.error('Failed to reject item:', error);
    }
  };

  const renderMetricCard = (label: string, value: number | string, color: string) => (
    <div style={{
      background: `linear-gradient(135deg, ${color}33 0%, #1A0B1F 100%)`,
      padding: '24px',
      borderRadius: '12px',
      border: `2px solid ${color}`,
      minWidth: '200px'
    }}>
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ color: '#FFF', fontSize: '32px', fontWeight: 'bold' }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A0B1F 50%, #5D2E6B 100%)',
      minHeight: '100vh',
      padding: '32px'
    }}>
      <h1 style={{
        color: '#FFF',
        fontSize: '42px',
        marginBottom: '32px',
        textShadow: '0 4px 12px rgba(156, 27, 27, 0.6)'
      }}>
        🔐 ROSOIDEAE Manager Dashboard
      </h1>

      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {['overview', 'approvals', 'analytics'].map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as any)}
            style={{
              background: selectedTab === tab 
                ? 'linear-gradient(135deg, #9C1B1B 0%, #6B0F0F 100%)'
                : 'transparent',
              border: '2px solid #9C1B1B',
              color: '#FFF',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {selectedTab === 'overview' && metrics && (
        <div>
          <h2 style={{ color: '#FFF', marginBottom: '24px' }}>Platform Metrics</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {renderMetricCard('Total Threads', metrics.totalThreads, '#5D2E6B')}
            {renderMetricCard('Active Threads', metrics.activeThreads, '#9C1B1B')}
            {renderMetricCard('Total Thoughts', metrics.totalThoughts, '#6B0F0F')}
            {renderMetricCard('Identities', metrics.registeredIdentities, '#5D2E6B')}
            {renderMetricCard('Avg Resonance', metrics.averageResonance.toFixed(1), '#9C1B1B')}
            {renderMetricCard('Velocity (msg/hr)', metrics.discussionVelocity.toFixed(2), '#6B0F0F')}
          </div>
        </div>
      )}

      {selectedTab === 'approvals' && (
        <div>
          <h2 style={{ color: '#FFF', marginBottom: '24px' }}>
            Pending Approvals ({pendingItems.length})
          </h2>
          {pendingItems.length === 0 ? (
            <p style={{ color: '#888', fontSize: '18px' }}>No items pending approval</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingItems.map(item => (
                <div
                  key={item.itemId}
                  style={{
                    background: 'linear-gradient(135deg, #1A0B1F 0%, #5D2E6B33 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '2px solid #9C1B1B'
                  }}
                >
                  <div style={{ color: '#9C1B1B', fontSize: '12px', marginBottom: '8px' }}>
                    {item.itemType.toUpperCase()} by {item.authorName}
                  </div>
                  <div style={{ color: '#FFF', marginBottom: '12px', lineHeight: '1.6' }}>
                    {item.content}
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '16px' }}>
                    Submitted: {new Date(item.submittedAt).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => approveItem(item.itemId)}
                      style={{
                        background: 'linear-gradient(135deg, #28A745 0%, #1E7E34 100%)',
                        border: 'none',
                        color: '#FFF',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => rejectItem(item.itemId)}
                      style={{
                        background: 'linear-gradient(135deg, #DC3545 0%, #C82333 100%)',
                        border: 'none',
                        color: '#FFF',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'analytics' && (
        <div>
          <h2 style={{ color: '#FFF', marginBottom: '24px' }}>Analytics</h2>
          <p style={{ color: '#888', fontSize: '16px' }}>
            Advanced analytics visualizations would go here.
            This could include charts for discussion velocity, resonance trends,
            user engagement, and category popularity.
          </p>
        </div>
      )}
    </div>
  );
};
