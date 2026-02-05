"""
ROSOIDEAE Platform Generator
Custom scaffold with purple/red/black aesthetic
"""

import os
import json

VIOLET_SPECTRUM = {
    'deep_night': '#1A0B1F',
    'roso_purple': '#5D2E6B', 
    'crimson_edge': '#9C1B1B',
    'blood_moon': '#6B0F0F'
}

def craft_structure():
    """Build unique directory architecture"""
    paths = {
        'visual': ['visual/displays', 'visual/interactions', 'visual/aesthetics'],
        'logic': ['logic/orchestration', 'logic/calculations', 'logic/transformations'],
        'connectivity': ['connectivity/endpoints', 'connectivity/validation', 'connectivity/streaming'],
        'storage': ['storage/blueprints', 'storage/transitions'],
        'orchestration': ['orchestration/virtualization', 'orchestration/distribution']
    }
    
    for category, subdirs in paths.items():
        for subdir in subdirs:
            os.makedirs(subdir, exist_ok=True)
            print(f"✨ Crafted: {subdir}")

def generate_color_system():
    """Generate ROSOIDEAE color computation system"""
    return f"""
export class RosoColorComputer {{
  private spectrumMap = {{
    deepNight: '{VIOLET_SPECTRUM['deep_night']}',
    rosoPurple: '{VIOLET_SPECTRUM['roso_purple']}',
    crimsonEdge: '{VIOLET_SPECTRUM['crimson_edge']}',
    bloodMoon: '{VIOLET_SPECTRUM['blood_moon']}'
  }};

  computeGradientAt(position: number): string {{
    // Custom gradient interpolation for ROSOIDEAE
    const normalized = Math.max(0, Math.min(1, position));
    const phase = normalized * Math.PI;
    
    const r = Math.floor(26 + (138 * Math.sin(phase)));
    const g = Math.floor(11 + (15 * Math.cos(phase * 0.5)));
    const b = Math.floor(31 + (76 * Math.sin(phase * 1.3)));
    
    return `rgb(${{r}}, ${{g}}, ${{b}})`;
  }}

  applyRosoDynamicShadow(elevation: number): string {{
    const blur = elevation * 3.7;
    const spread = elevation * 0.9;
    return `0 ${{elevation}}px ${{blur}}px -${{spread}}px ${{this.spectrumMap.bloodMoon}}`;
  }}
}}
"""

def generate_discussion_orchestrator():
    """Create custom thread orchestration logic"""
    return """
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
    const wordDensity = content.split(/\\s+/).length;
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
"""

if __name__ == '__main__':
    print("🌹 ROSOIDEAE Platform Scaffold Generator")
    craft_structure()
    
    with open('visual/aesthetics/color-computer.ts', 'w') as f:
        f.write(generate_color_system())
    
    with open('logic/orchestration/discussion-orchestrator.ts', 'w') as f:
        f.write(generate_discussion_orchestrator())
    
    print("✅ ROSOIDEAE platform scaffolded successfully!")
