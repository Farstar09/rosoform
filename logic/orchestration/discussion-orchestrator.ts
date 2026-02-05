
interface ConversationNode {
  nodeIdentifier: string;
  speakerReference: string;
  thoughtContent: string;
  whenSpoken: number;
  ancestorNode: string | null;
  descendantNodes: ConversationNode[];
  resonanceScore: number;
}

export class DiscussionOrchestrator {
  private conversationGraph: Map<string, ConversationNode> = new Map();
  private liveResonanceStream: ((node: ConversationNode) => void)[] = [];

  insertThought(
    speakerId: string, 
    thought: string, 
    replyingTo: string | null
  ): ConversationNode {
    const nodeId = this.craftNodeIdentifier();
    const momentInTime = Date.now();
    
    const freshNode: ConversationNode = {
      nodeIdentifier: nodeId,
      speakerReference: speakerId,
      thoughtContent: thought,
      whenSpoken: momentInTime,
      ancestorNode: replyingTo,
      descendantNodes: [],
      resonanceScore: this.calculateResonance(thought)
    };

    this.conversationGraph.set(nodeId, freshNode);

    if (replyingTo && this.conversationGraph.has(replyingTo)) {
      this.conversationGraph.get(replyingTo)!.descendantNodes.push(freshNode);
    }

    this.liveResonanceStream.forEach(listener => listener(freshNode));
    return freshNode;
  }

  private calculateResonance(content: string): number {
    // Custom algorithm for content quality scoring
    const wordDensity = content.split(/\s+/).length;
    const uniqueChars = new Set(content.toLowerCase()).size;
    const sentenceCount = content.split(/[.!?]+/).length;
    
    return (wordDensity * 0.4) + (uniqueChars * 0.3) + (sentenceCount * 10);
  }

  traceConversationPath(fromNodeId: string): ConversationNode[] {
    const path: ConversationNode[] = [];
    let currentNode = this.conversationGraph.get(fromNodeId);

    while (currentNode) {
      path.unshift(currentNode);
      currentNode = currentNode.ancestorNode 
        ? this.conversationGraph.get(currentNode.ancestorNode)
        : undefined;
    }

    return path;
  }

  subscribeToResonance(callback: (node: ConversationNode) => void): void {
    this.liveResonanceStream.push(callback);
  }

  private craftNodeIdentifier(): string {
    const timestamp = Date.now().toString(36);
    const randomSeed = Math.random().toString(36).substring(2, 11);
    return `roso_thought_${timestamp}_${randomSeed}`;
  }

  measureDiscussionVelocity(threadId: string, hoursBack: number): number {
    const cutoffTime = Date.now() - (hoursBack * 3600000);
    let recentThoughts = 0;

    this.conversationGraph.forEach(node => {
      if (node.whenSpoken > cutoffTime) {
        recentThoughts++;
      }
    });

    return recentThoughts / hoursBack;
  }
}
