"""
ROSOIDEAE Crystallization Engine
Forms discussion crystals based on conversation geometry
"""

import math
from typing import List, Tuple, Set
from dataclasses import dataclass

@dataclass
class CrystalNode:
    """A node in the discussion crystal lattice"""
    node_id: str
    position_vector: Tuple[float, float, float]
    binding_energy: float
    lattice_neighbors: Set[str]
    crystal_face: str

class CrystallizationEngine:
    """
    Organizes discussions into crystalline structures based on
    geometric alignment and binding affinities
    """
    
    def __init__(self):
        self.lattice_constant = 1.618  # Golden ratio spacing
        self.binding_threshold = 0.7
        self.crystal_formations = {}
        
    def nucleate_crystal(self, seed_content: str, seed_author: str) -> CrystalNode:
        """
        Create a crystal nucleus from initial discussion
        """
        # Map text properties to 3D spatial coordinates
        position = self._map_content_to_space(seed_content)
        
        # Calculate binding energy from content characteristics
        binding_energy = self._compute_binding_energy(seed_content, seed_author)
        
        # Determine crystal face based on topic signature
        crystal_face = self._identify_crystal_face(seed_content)
        
        node = CrystalNode(
            node_id=f"crystal_{hash(seed_content) % 1000000}",
            position_vector=position,
            binding_energy=binding_energy,
            lattice_neighbors=set(),
            crystal_face=crystal_face
        )
        
        self.crystal_formations[node.node_id] = node
        return node
        
    def _map_content_to_space(self, content: str) -> Tuple[float, float, float]:
        """
        Project content into 3D space using linguistic geometry
        """
        words = content.lower().split()
        
        # X-axis: Lexical diversity (entropy)
        unique_words = len(set(words))
        total_words = len(words)
        lexical_entropy = (unique_words / total_words) if total_words > 0 else 0
        x_coord = lexical_entropy * math.pi
        
        # Y-axis: Syntactic complexity (average clause length)
        clauses = content.split(',')
        avg_clause_len = sum(len(c.split()) for c in clauses) / len(clauses)
        y_coord = math.log(avg_clause_len + 1)
        
        # Z-axis: Semantic depth (syllable count proxy)
        syllable_est = sum(self._estimate_syllables(word) for word in words)
        z_coord = math.sqrt(syllable_est) / 10
        
        return (x_coord, y_coord, z_coord)
    
    def _estimate_syllables(self, word: str) -> int:
        """Rough syllable estimation using vowel clusters"""
        vowels = 'aeiou'
        syllable_count = 0
        previous_was_vowel = False
        
        for char in word.lower():
            is_vowel = char in vowels
            if is_vowel and not previous_was_vowel:
                syllable_count += 1
            previous_was_vowel = is_vowel
            
        return max(1, syllable_count)
    
    def _compute_binding_energy(self, content: str, author: str) -> float:
        """
        Calculate how strongly this content binds to crystal lattice
        """
        # Content length contributes to binding
        length_factor = min(1.0, len(content) / 500)
        
        # Author reputation (using hash as proxy for now)
        author_factor = (hash(author) % 100) / 100.0
        
        # Information density
        words = content.split()
        unique_ratio = len(set(words)) / len(words) if words else 0
        
        binding_energy = (
            length_factor * 0.3 +
            author_factor * 0.4 +
            unique_ratio * 0.3
        )
        
        return binding_energy
    
    def _identify_crystal_face(self, content: str) -> str:
        """
        Classify content into crystal face categories using word patterns
        """
        content_lower = content.lower()
        
        # Define face signatures using character frequency patterns
        face_signatures = {
            'cubic': lambda t: t.count('a') + t.count('e'),
            'hexagonal': lambda t: t.count('i') + t.count('o'),
            'tetragonal': lambda t: t.count('u') + t.count('y'),
            'orthorhombic': lambda t: t.count('s') + t.count('t'),
            'monoclinic': lambda t: t.count('n') + t.count('r'),
        }
        
        scores = {face: sig(content_lower) for face, sig in face_signatures.items()}
        return max(scores, key=scores.get)
    
    def attach_to_lattice(self, new_node: CrystalNode, existing_node: CrystalNode) -> bool:
        """
        Attempt to attach new node to existing crystal structure
        """
        # Calculate spatial distance in 3D
        distance = self._euclidean_distance(
            new_node.position_vector,
            existing_node.position_vector
        )
        
        # Check if nodes can bind based on distance and energy
        if distance <= self.lattice_constant * 1.5:
            # Calculate binding probability using Boltzmann-like distribution
            energy_diff = abs(new_node.binding_energy - existing_node.binding_energy)
            binding_prob = math.exp(-energy_diff / 0.5)
            
            if binding_prob > self.binding_threshold:
                new_node.lattice_neighbors.add(existing_node.node_id)
                existing_node.lattice_neighbors.add(new_node.node_id)
                return True
                
        return False
    
    def _euclidean_distance(self, pos1: Tuple[float, float, float], 
                           pos2: Tuple[float, float, float]) -> float:
        """Calculate 3D Euclidean distance"""
        return math.sqrt(
            (pos1[0] - pos2[0])**2 +
            (pos1[1] - pos2[1])**2 +
            (pos1[2] - pos2[2])**2
        )
    
    def grow_crystal(self, seed_id: str, new_contents: List[Tuple[str, str]]) -> List[CrystalNode]:
        """
        Grow crystal structure from seed by adding new nodes
        """
        seed_node = self.crystal_formations.get(seed_id)
        if not seed_node:
            return []
        
        attached_nodes = []
        
        for content, author in new_contents:
            new_node = self.nucleate_crystal(content, author)
            
            # Try to attach to seed and its neighbors
            if self.attach_to_lattice(new_node, seed_node):
                attached_nodes.append(new_node)
                
                # Also try attaching to neighbors for denser packing
                for neighbor_id in seed_node.lattice_neighbors:
                    neighbor = self.crystal_formations.get(neighbor_id)
                    if neighbor:
                        self.attach_to_lattice(new_node, neighbor)
        
        return attached_nodes
    
    def analyze_crystal_structure(self, crystal_id: str) -> dict:
        """
        Analyze geometric properties of crystal formation
        """
        crystal = self.crystal_formations.get(crystal_id)
        if not crystal:
            return {}
        
        # Collect all nodes in this crystal formation
        visited = set()
        crystal_nodes = []
        
        def traverse(node_id):
            if node_id in visited:
                return
            visited.add(node_id)
            node = self.crystal_formations.get(node_id)
            if node:
                crystal_nodes.append(node)
                for neighbor_id in node.lattice_neighbors:
                    traverse(neighbor_id)
        
        traverse(crystal_id)
        
        # Calculate crystal metrics
        total_binding_energy = sum(n.binding_energy for n in crystal_nodes)
        avg_coordination = sum(len(n.lattice_neighbors) for n in crystal_nodes) / len(crystal_nodes)
        
        # Face distribution
        face_counts = {}
        for node in crystal_nodes:
            face_counts[node.crystal_face] = face_counts.get(node.crystal_face, 0) + 1
        
        return {
            'node_count': len(crystal_nodes),
            'total_binding_energy': total_binding_energy,
            'average_coordination': avg_coordination,
            'dominant_face': max(face_counts, key=face_counts.get),
            'face_distribution': face_counts,
            'crystal_symmetry': self._calculate_symmetry(crystal_nodes)
        }
    
    def _calculate_symmetry(self, nodes: List[CrystalNode]) -> float:
        """
        Measure crystal symmetry using position variance
        """
        if not nodes:
            return 0.0
        
        # Calculate centroid
        centroid_x = sum(n.position_vector[0] for n in nodes) / len(nodes)
        centroid_y = sum(n.position_vector[1] for n in nodes) / len(nodes)
        centroid_z = sum(n.position_vector[2] for n in nodes) / len(nodes)
        
        # Measure variance from centroid
        variance = sum(
            self._euclidean_distance(n.position_vector, (centroid_x, centroid_y, centroid_z))**2
            for n in nodes
        ) / len(nodes)
        
        # Lower variance = higher symmetry
        symmetry_score = 1.0 / (1.0 + variance)
        return symmetry_score
