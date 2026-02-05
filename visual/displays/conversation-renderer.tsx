/**
 * ROSOIDEAE Visual Renderer
 * Custom React component with unique aesthetic logic
 */

import { useEffect, useState, useCallback } from 'react';

interface ConversationVisualProps {
  threadKey: string;
  viewerVaultId: string | null;
  managerMode: boolean;
}

interface ThoughtVisual {
  nodeId: string;
  speakerName: string;
  thoughtText: string;
  expressedMoment: number;
  ancestorId: string | null;
  descendants: ThoughtVisual[];
  resonanceValue: number;
}

export const ConversationRenderer = ({ 
  threadKey, 
  viewerVaultId, 
  managerMode 
}: ConversationVisualProps) => {
  const [thoughtCollection, setThoughtCollection] = useState<ThoughtVisual[]>([]);
  const [streamChannel, setStreamChannel] = useState<WebSocket | null>(null);
  const [colorPhase, setColorPhase] = useState(0);

  useEffect(() => {
    const animationLoop = setInterval(() => {
      setColorPhase(prev => (prev + 0.01) % 1);
    }, 50);

    return () => clearInterval(animationLoop);
  }, []);

  const computeDynamicColor = useCallback((position: number): string => {
    const phase = (position + colorPhase) * Math.PI;
    const r = Math.floor(26 + (138 * Math.sin(phase)));
    const g = Math.floor(11 + (15 * Math.cos(phase * 0.5)));
    const b = Math.floor(31 + (76 * Math.sin(phase * 1.3)));
    return `rgb(${r}, ${g}, ${b})`;
  }, [colorPhase]);

  useEffect(() => {
    const streamEndpoint = `wss://rosoideae-stream/threads/${threadKey}`;
    const channel = new WebSocket(streamEndpoint);

    channel.onopen = () => {
      channel.send(JSON.stringify({
        action: 'SUBSCRIBE_THREAD',
        threadId: threadKey,
        vaultId: viewerVaultId
      }));
    };

    channel.onmessage = (incoming) => {
      const packet = JSON.parse(incoming.data);
      
      if (packet.messageType === 'NEW_POST') {
        setThoughtCollection(prev => [...prev, packet.payload]);
      } else if (packet.messageType === 'EDIT_POST') {
        setThoughtCollection(prev => 
          prev.map(thought => 
            thought.nodeId === packet.payload.postId
              ? { ...thought, thoughtText: packet.payload.newContent }
              : thought
          )
        );
      }
    };

    setStreamChannel(channel);

    return () => channel.close();
  }, [threadKey, viewerVaultId]);

  const assembleThoughtTree = (
    thoughts: ThoughtVisual[], 
    ancestorId: string | null = null,
    depth: number = 0
  ): ThoughtVisual[] => {
    if (depth > 20) return []; // Prevent infinite recursion

    return thoughts
      .filter(t => t.ancestorId === ancestorId)
      .map(t => ({
        ...t,
        descendants: assembleThoughtTree(thoughts, t.nodeId, depth + 1)
      }))
      .sort((a, b) => b.resonanceValue - a.resonanceValue);
  };

  const renderThoughtNode = (thought: ThoughtVisual, depthLevel: number = 0): JSX.Element => {
    const indentPixels = depthLevel * 28;
    const dynamicBg = computeDynamicColor(depthLevel * 0.15);
    const pulseIntensity = 0.5 + (thought.resonanceValue / 200);

    return (
      <div
        key={thought.nodeId}
        style={{
          marginLeft: `${indentPixels}px`,
          background: `linear-gradient(135deg, ${dynamicBg} 0%, #1A0B1F 100%)`,
          padding: '16px',
          marginBottom: '12px',
          borderLeft: `4px solid #9C1B1B`,
          borderRadius: '8px',
          boxShadow: `0 ${pulseIntensity * 8}px ${pulseIntensity * 20}px rgba(156, 27, 27, ${pulseIntensity * 0.4})`,
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          fontSize: '11px',
          color: '#9C1B1B',
          fontFamily: 'monospace'
        }}>
          Resonance: {thought.resonanceValue.toFixed(1)}
        </div>

        <div style={{
          color: '#9C1B1B',
          fontWeight: 700,
          fontSize: '14px',
          marginBottom: '8px'
        }}>
          {thought.speakerName}
        </div>

        <div style={{
          color: '#E8E8E8',
          lineHeight: '1.6',
          fontFamily: 'Inter, sans-serif',
          fontSize: '15px'
        }}>
          {thought.thoughtText}
        </div>

        <div style={{
          color: '#6B6B6B',
          fontSize: '12px',
          marginTop: '10px',
          fontFamily: 'monospace'
        }}>
          {new Date(thought.expressedMoment).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        {thought.descendants.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            {thought.descendants.map(desc => renderThoughtNode(desc, depthLevel + 1))}
          </div>
        )}
      </div>
    );
  };

  const structuredThoughts = assembleThoughtTree(thoughtCollection);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A0B1F 30%, #5D2E6B 70%, #9C1B1B 100%)',
      minHeight: '100vh',
      padding: '32px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <h1 style={{
        color: '#FFFFFF',
        fontSize: '36px',
        marginBottom: '32px',
        textShadow: '0 4px 12px rgba(156, 27, 27, 0.6)',
        fontWeight: 800
      }}>
        ROSOIDEAE Forum
      </h1>

      {structuredThoughts.map(thought => renderThoughtNode(thought))}

      {managerMode && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #9C1B1B 0%, #6B0F0F 100%)',
          padding: '16px 24px',
          borderRadius: '12px',
          color: '#FFFFFF',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(156, 27, 27, 0.8)',
          cursor: 'pointer'
        }}>
          🔐 Manager Controls
        </div>
      )}
    </div>
  );
};
