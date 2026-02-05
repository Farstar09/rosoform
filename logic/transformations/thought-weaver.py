"""
ROSOIDEAE Thought Weaver
Advanced neural-inspired thread connection engine
"""

from collections import defaultdict
from datetime import datetime
import math

class ThoughtWeaver:
    """
    Connects related discussions using semantic proximity algorithms
    """
    
    def __init__(self):
        self.thought_embeddings = {}
        self.connection_graph = defaultdict(list)
        self.resonance_decay_factor = 0.87
        
    def weave_thought(self, thought_id, content_text, author_id, category):
        """
        Process and weave a new thought into the conversation fabric
        """
        # Custom embedding using character frequency analysis
        embedding = self._generate_embedding(content_text)
        
        # Calculate temporal weight (newer = higher weight)
        time_weight = self._compute_temporal_weight(datetime.now())
        
        # Store with metadata
        self.thought_embeddings[thought_id] = {
            'vector': embedding,
            'author': author_id,
            'category': category,
            'temporal_weight': time_weight,
            'connection_strength': {}
        }
        
        # Find related thoughts
        self._discover_connections(thought_id)
        
        return embedding
    
    def _generate_embedding(self, text):
        """
        Custom text embedding using trigram frequency + vowel-consonant patterns
        """
        text_lower = text.lower()
        
        # Trigram frequency vector (26^3 dimensional, sampled)
        trigrams = {}
        for i in range(len(text_lower) - 2):
            trigram = text_lower[i:i+3]
            if trigram.isalpha():
                trigrams[trigram] = trigrams.get(trigram, 0) + 1
        
        # Vowel-consonant rhythm pattern
        vowels = 'aeiou'
        vc_pattern = []
        for char in text_lower:
            if char.isalpha():
                vc_pattern.append(1 if char in vowels else 0)
        
        # Compute pattern score using Fourier-like transform
        pattern_scores = []
        for freq in [1, 2, 3, 5, 8]:
            score = sum(
                vc_pattern[i] * math.sin(2 * math.pi * freq * i / len(vc_pattern))
                for i in range(len(vc_pattern))
            ) if vc_pattern else 0
            pattern_scores.append(score)
        
        # Semantic density (unique words / total words)
        words = text_lower.split()
        semantic_density = len(set(words)) / len(words) if words else 0
        
        # Punctuation rhythm (exclamation/question distribution)
        punct_rhythm = (text.count('!') * 2.3 + text.count('?') * 1.7) / (len(text) + 1)
        
        return {
            'trigram_top': sorted(trigrams.items(), key=lambda x: x[1], reverse=True)[:10],
            'vc_patterns': pattern_scores,
            'semantic_density': semantic_density,
            'punct_rhythm': punct_rhythm,
            'length_log': math.log(len(text) + 1)
        }
    
    def _compute_temporal_weight(self, timestamp):
        """
        Exponential decay function for temporal relevance
        """
        hours_elapsed = (datetime.now() - timestamp).total_seconds() / 3600
        return math.exp(-hours_elapsed / 24) * self.resonance_decay_factor
    
    def _discover_connections(self, new_thought_id):
        """
        Find semantic connections using custom similarity metric
        """
        new_embedding = self.thought_embeddings[new_thought_id]
        
        for existing_id, existing_data in self.thought_embeddings.items():
            if existing_id == new_thought_id:
                continue
            
            # Custom similarity combining multiple factors
            similarity = self._calculate_similarity(
                new_embedding['vector'],
                existing_data['vector']
            )
            
            # Apply temporal and author bonuses
            if new_embedding['author'] == existing_data['author']:
                similarity *= 1.4  # Same author boost
            
            if new_embedding['category'] == existing_data['category']:
                similarity *= 1.3  # Same category boost
            
            # Temporal relevance
            similarity *= existing_data['temporal_weight']
            
            if similarity > 0.3:  # Threshold for connection
                self.connection_graph[new_thought_id].append({
                    'target': existing_id,
                    'strength': similarity
                })
                new_embedding['vector']['connection_strength'][existing_id] = similarity
    
    def _calculate_similarity(self, embed1, embed2):
        """
        Multi-dimensional similarity metric
        """
        # Trigram overlap score
        trigrams1 = {t[0] for t in embed1['trigram_top']}
        trigrams2 = {t[0] for t in embed2['trigram_top']}
        trigram_overlap = len(trigrams1 & trigrams2) / (len(trigrams1 | trigrams2) + 0.1)
        
        # Pattern correlation
        patterns1 = embed1['vc_patterns']
        patterns2 = embed2['vc_patterns']
        pattern_correlation = sum(
            p1 * p2 for p1, p2 in zip(patterns1, patterns2)
        ) / (math.sqrt(sum(p**2 for p in patterns1) + 0.1) * 
             math.sqrt(sum(p**2 for p in patterns2) + 0.1) + 0.1)
        
        # Semantic density proximity
        density_diff = abs(embed1['semantic_density'] - embed2['semantic_density'])
        density_score = 1 / (1 + density_diff * 3)
        
        # Length similarity
        length_diff = abs(embed1['length_log'] - embed2['length_log'])
        length_score = 1 / (1 + length_diff)
        
        # Weighted combination
        return (
            trigram_overlap * 0.35 +
            pattern_correlation * 0.25 +
            density_score * 0.20 +
            length_score * 0.20
        )
    
    def get_thought_constellation(self, thought_id, depth=3):
        """
        Retrieve connected thoughts in a constellation pattern
        """
        constellation = {thought_id: {'depth': 0, 'connections': []}}
        visited = {thought_id}
        queue = [(thought_id, 0)]
        
        while queue:
            current_id, current_depth = queue.pop(0)
            
            if current_depth >= depth:
                continue
            
            for connection in self.connection_graph.get(current_id, []):
                target_id = connection['target']
                strength = connection['strength']
                
                if target_id not in visited:
                    visited.add(target_id)
                    constellation[target_id] = {
                        'depth': current_depth + 1,
                        'connections': [],
                        'strength_from_origin': strength
                    }
                    queue.append((target_id, current_depth + 1))
                
                constellation[current_id]['connections'].append({
                    'to': target_id,
                    'strength': strength
                })
        
        return constellation
    
    def compute_influence_radius(self, author_id):
        """
        Calculate how far an author's thoughts spread across the network
        """
        author_thoughts = [
            tid for tid, data in self.thought_embeddings.items()
            if data['author'] == author_id
        ]
        
        if not author_thoughts:
            return 0
        
        total_reach = 0
        for thought_id in author_thoughts:
            constellation = self.get_thought_constellation(thought_id, depth=2)
            total_reach += len(constellation) - 1  # Exclude the thought itself
        
        return total_reach / len(author_thoughts)
    
    def detect_thought_clusters(self, min_cluster_size=3):
        """
        Identify clusters of highly connected thoughts
        """
        clusters = []
        unvisited = set(self.thought_embeddings.keys())
        
        while unvisited:
            seed = next(iter(unvisited))
            cluster = self._grow_cluster(seed, unvisited)
            
            if len(cluster) >= min_cluster_size:
                clusters.append(cluster)
        
        return clusters
    
    def _grow_cluster(self, seed, unvisited):
        """
        Expand cluster from seed using connection strength
        """
        cluster = {seed}
        unvisited.discard(seed)
        queue = [seed]
        
        while queue:
            current = queue.pop(0)
            
            for connection in self.connection_graph.get(current, []):
                target = connection['target']
                strength = connection['strength']
                
                if target in unvisited and strength > 0.5:
                    cluster.add(target)
                    unvisited.discard(target)
                    queue.append(target)
        
        return cluster
