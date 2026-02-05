/**
 * ROSOIDEAE Streaming Nexus
 * Custom WebSocket hub with intelligent routing
 */

interface StreamingChannel {
  channelKey: string;
  subscriberSet: Set<string>;
  messageHistory: StreamMessage[];
  activityPulse: number;
}

interface StreamMessage {
  messageId: string;
  channelKey: string;
  originatorId: string;
  contentPacket: any;
  transmittedAt: number;
  messageCategory: string;
}

interface SubscriberConnection {
  connectionKey: string;
  activeChannels: Set<string>;
  lastHeartbeat: number;
  privileges: Set<string>;
}

export class StreamingNexus {
  private activeChannels: Map<string, StreamingChannel>;
  private liveConnections: Map<string, SubscriberConnection>;
  private messageBuffer: StreamMessage[];
  private bufferCapacity: number;

  constructor(bufferSize: number = 1000) {
    this.activeChannels = new Map();
    this.liveConnections = new Map();
    this.messageBuffer = [];
    this.bufferCapacity = bufferSize;
  }

  establishConnection(connectionKey: string, privileges: string[]): void {
    this.liveConnections.set(connectionKey, {
      connectionKey,
      activeChannels: new Set(),
      lastHeartbeat: Date.now(),
      privileges: new Set(privileges)
    });
  }

  terminateConnection(connectionKey: string): void {
    const conn = this.liveConnections.get(connectionKey);
    if (!conn) return;

    conn.activeChannels.forEach(channelKey => {
      const channel = this.activeChannels.get(channelKey);
      if (channel) {
        channel.subscriberSet.delete(connectionKey);
      }
    });

    this.liveConnections.delete(connectionKey);
  }

  joinChannel(connectionKey: string, channelKey: string): boolean {
    const conn = this.liveConnections.get(connectionKey);
    if (!conn) return false;

    let channel = this.activeChannels.get(channelKey);
    if (!channel) {
      channel = {
        channelKey,
        subscriberSet: new Set(),
        messageHistory: [],
        activityPulse: 0
      };
      this.activeChannels.set(channelKey, channel);
    }

    channel.subscriberSet.add(connectionKey);
    conn.activeChannels.add(channelKey);
    conn.lastHeartbeat = Date.now();

    return true;
  }

  leaveChannel(connectionKey: string, channelKey: string): boolean {
    const conn = this.liveConnections.get(connectionKey);
    const channel = this.activeChannels.get(channelKey);

    if (!conn || !channel) return false;

    channel.subscriberSet.delete(connectionKey);
    conn.activeChannels.delete(channelKey);

    if (channel.subscriberSet.size === 0) {
      this.activeChannels.delete(channelKey);
    }

    return true;
  }

  broadcastToChannel(
    channelKey: string,
    originatorId: string,
    contentPacket: any,
    category: string = 'standard'
  ): StreamMessage | null {
    const channel = this.activeChannels.get(channelKey);
    if (!channel) return null;

    const message: StreamMessage = {
      messageId: this.generateMessageId(),
      channelKey,
      originatorId,
      contentPacket,
      transmittedAt: Date.now(),
      messageCategory: category
    };

    channel.messageHistory.push(message);
    if (channel.messageHistory.length > 100) {
      channel.messageHistory.shift();
    }

    this.messageBuffer.push(message);
    if (this.messageBuffer.length > this.bufferCapacity) {
      this.messageBuffer.shift();
    }

    channel.activityPulse = Date.now();

    return message;
  }

  getChannelSubscribers(channelKey: string): string[] {
    const channel = this.activeChannels.get(channelKey);
    return channel ? Array.from(channel.subscriberSet) : [];
  }

  getConnectionChannels(connectionKey: string): string[] {
    const conn = this.liveConnections.get(connectionKey);
    return conn ? Array.from(conn.activeChannels) : [];
  }

  computeChannelMetrics(channelKey: string) {
    const channel = this.activeChannels.get(channelKey);
    if (!channel) return null;

    const recentMessages = channel.messageHistory.filter(
      msg => Date.now() - msg.transmittedAt < 3600000
    );

    const uniqueSpeakers = new Set(channel.messageHistory.map(m => m.originatorId));

    return {
      subscriberCount: channel.subscriberSet.size,
      totalMessages: channel.messageHistory.length,
      messagesLastHour: recentMessages.length,
      uniqueSpeakers: uniqueSpeakers.size,
      lastActivity: channel.activityPulse,
      averageMessageRate: recentMessages.length / 60
    };
  }

  detectStaleConnections(thresholdMinutes: number = 30): string[] {
    const threshold = Date.now() - (thresholdMinutes * 60000);
    const staleKeys: string[] = [];

    this.liveConnections.forEach((conn, key) => {
      if (conn.lastHeartbeat < threshold) {
        staleKeys.push(key);
      }
    });

    return staleKeys;
  }

  purgeStaleCon nections(thresholdMinutes: number = 30): number {
    const staleKeys = this.detectStaleConnections(thresholdMinutes);
    staleKeys.forEach(key => this.terminateConnection(key));
    return staleKeys.length;
  }

  private generateMessageId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `roso_msg_${timestamp}_${random}`;
  }

  getNexusSnapshot() {
    return {
      activeChannels: this.activeChannels.size,
      liveConnections: this.liveConnections.size,
      bufferedMessages: this.messageBuffer.length,
      channelDetails: Array.from(this.activeChannels.entries()).map(([key, channel]) => ({
        channelKey: key,
        subscribers: channel.subscriberSet.size,
        messages: channel.messageHistory.length
      }))
    };
  }
}
