/**
 * ROSOIDEAE Pulse Visualizer
 * Real-time activity visualization with particle effects
 */

interface PulseParticle {
  particleId: string;
  originX: number;
  originY: number;
  velocityX: number;
  velocityY: number;
  hueValue: number;
  luminosity: number;
  lifetime: number;
  maxLifetime: number;
}

interface ActivityPulse {
  pulseId: string;
  threadId: string;
  intensity: number;
  timestamp: number;
  authorVaultId: string;
}

export class PulseVisualizer {
  private canvasContext: CanvasRenderingContext2D;
  private activeParticles: PulseParticle[];
  private pulseHistory: ActivityPulse[];
  private animationHandle: number | null;
  private colorWavePhase: number;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvasContext = canvas.getContext('2d')!;
    this.activeParticles = [];
    this.pulseHistory = [];
    this.animationHandle = null;
    this.colorWavePhase = 0;
    
    this.initializeVisualization();
  }
  
  private initializeVisualization(): void {
    this.canvasContext.canvas.width = window.innerWidth;
    this.canvasContext.canvas.height = window.innerHeight;
    
    // Create ambient particle field
    for (let i = 0; i < 50; i++) {
      this.spawnAmbientParticle();
    }
    
    this.beginAnimationCycle();
  }
  
  private spawnAmbientParticle(): void {
    const particle: PulseParticle = {
      particleId: `ambient_${Date.now()}_${Math.random()}`,
      originX: Math.random() * this.canvasContext.canvas.width,
      originY: Math.random() * this.canvasContext.canvas.height,
      velocityX: (Math.random() - 0.5) * 0.3,
      velocityY: (Math.random() - 0.5) * 0.3,
      hueValue: 280 + Math.random() * 40, // Purple range
      luminosity: 0.2 + Math.random() * 0.3,
      lifetime: 0,
      maxLifetime: 5000 + Math.random() * 3000
    };
    
    this.activeParticles.push(particle);
  }
  
  registerActivityPulse(pulse: ActivityPulse): void {
    this.pulseHistory.push(pulse);
    
    // Limit history size
    if (this.pulseHistory.length > 200) {
      this.pulseHistory.shift();
    }
    
    // Generate burst of particles for this pulse
    const particleCount = Math.floor(pulse.intensity * 15);
    const baseX = Math.random() * this.canvasContext.canvas.width;
    const baseY = Math.random() * this.canvasContext.canvas.height;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 1 + Math.random() * 2;
      
      this.activeParticles.push({
        particleId: `pulse_${pulse.pulseId}_${i}`,
        originX: baseX,
        originY: baseY,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        hueValue: this.intensityToHue(pulse.intensity),
        luminosity: 0.6 + pulse.intensity * 0.4,
        lifetime: 0,
        maxLifetime: 2000 + pulse.intensity * 1000
      });
    }
  }
  
  private intensityToHue(intensity: number): number {
    // High intensity = red, low intensity = purple
    // Intensity ranges from 0 to 1
    return 280 - (intensity * 280); // 280 (purple) to 0 (red)
  }
  
  private beginAnimationCycle(): void {
    const renderFrame = () => {
      this.updateParticles();
      this.renderVisualization();
      this.animationHandle = requestAnimationFrame(renderFrame);
    };
    
    renderFrame();
  }
  
  private updateParticles(): void {
    this.colorWavePhase += 0.01;
    
    this.activeParticles = this.activeParticles.filter(particle => {
      // Update position
      particle.originX += particle.velocityX;
      particle.originY += particle.velocityY;
      particle.lifetime += 16; // Assume ~60fps
      
      // Apply gravity-like attraction to center
      const centerX = this.canvasContext.canvas.width / 2;
      const centerY = this.canvasContext.canvas.height / 2;
      const dx = centerX - particle.originX;
      const dy = centerY - particle.originY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 50) {
        particle.velocityX += (dx / distance) * 0.01;
        particle.velocityY += (dy / distance) * 0.01;
      }
      
      // Apply friction
      particle.velocityX *= 0.99;
      particle.velocityY *= 0.99;
      
      // Wrap around edges
      if (particle.originX < 0) particle.originX = this.canvasContext.canvas.width;
      if (particle.originX > this.canvasContext.canvas.width) particle.originX = 0;
      if (particle.originY < 0) particle.originY = this.canvasContext.canvas.height;
      if (particle.originY > this.canvasContext.canvas.height) particle.originY = 0;
      
      // Keep particle if still alive
      return particle.lifetime < particle.maxLifetime;
    });
    
    // Maintain ambient particle count
    while (this.activeParticles.length < 50) {
      this.spawnAmbientParticle();
    }
  }
  
  private renderVisualization(): void {
    // Clear with fade effect
    this.canvasContext.fillStyle = 'rgba(10, 10, 10, 0.15)';
    this.canvasContext.fillRect(
      0, 0,
      this.canvasContext.canvas.width,
      this.canvasContext.canvas.height
    );
    
    // Draw connection lines between nearby particles
    this.renderConnectionLines();
    
    // Draw particles
    this.activeParticles.forEach(particle => {
      const lifetimeRatio = particle.lifetime / particle.maxLifetime;
      const alpha = particle.luminosity * (1 - lifetimeRatio);
      
      // Dynamic hue shift
      const shiftedHue = (particle.hueValue + this.colorWavePhase * 50) % 360;
      
      // Particle glow
      const gradient = this.canvasContext.createRadialGradient(
        particle.originX, particle.originY, 0,
        particle.originX, particle.originY, 8
      );
      gradient.addColorStop(0, `hsla(${shiftedHue}, 80%, 60%, ${alpha})`);
      gradient.addColorStop(1, `hsla(${shiftedHue}, 80%, 30%, 0)`);
      
      this.canvasContext.fillStyle = gradient;
      this.canvasContext.beginPath();
      this.canvasContext.arc(
        particle.originX, particle.originY,
        8, 0, Math.PI * 2
      );
      this.canvasContext.fill();
    });
    
    // Draw pulse metrics
    this.renderMetricsOverlay();
  }
  
  private renderConnectionLines(): void {
    const maxConnectionDistance = 120;
    
    for (let i = 0; i < this.activeParticles.length; i++) {
      for (let j = i + 1; j < this.activeParticles.length; j++) {
        const p1 = this.activeParticles[i];
        const p2 = this.activeParticles[j];
        
        const dx = p2.originX - p1.originX;
        const dy = p2.originY - p1.originY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxConnectionDistance) {
          const alpha = (1 - distance / maxConnectionDistance) * 0.3;
          const avgHue = (p1.hueValue + p2.hueValue) / 2;
          
          this.canvasContext.strokeStyle = `hsla(${avgHue}, 70%, 50%, ${alpha})`;
          this.canvasContext.lineWidth = 1;
          this.canvasContext.beginPath();
          this.canvasContext.moveTo(p1.originX, p1.originY);
          this.canvasContext.lineTo(p2.originX, p2.originY);
          this.canvasContext.stroke();
        }
      }
    }
  }
  
  private renderMetricsOverlay(): void {
    const recentPulses = this.pulseHistory.filter(
      p => Date.now() - p.timestamp < 60000
    );
    
    const avgIntensity = recentPulses.length > 0
      ? recentPulses.reduce((sum, p) => sum + p.intensity, 0) / recentPulses.length
      : 0;
    
    this.canvasContext.fillStyle = 'rgba(156, 27, 27, 0.8)';
    this.canvasContext.font = 'bold 16px monospace';
    this.canvasContext.fillText(
      `Activity: ${recentPulses.length} pulses/min`,
      20, 30
    );
    this.canvasContext.fillText(
      `Intensity: ${(avgIntensity * 100).toFixed(1)}%`,
      20, 55
    );
    this.canvasContext.fillText(
      `Particles: ${this.activeParticles.length}`,
      20, 80
    );
  }
  
  computeActivityHeatmap(gridSize: number = 20): number[][] {
    const width = this.canvasContext.canvas.width;
    const height = this.canvasContext.canvas.height;
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;
    
    const heatmap: number[][] = Array(gridSize)
      .fill(0)
      .map(() => Array(gridSize).fill(0));
    
    this.pulseHistory.forEach(pulse => {
      // Distribute heat based on timestamp recency
      const age = Date.now() - pulse.timestamp;
      const heat = pulse.intensity * Math.exp(-age / 30000);
      
      // Random position for pulse (in real app, would use actual position)
      const gridX = Math.floor(Math.random() * gridSize);
      const gridY = Math.floor(Math.random() * gridSize);
      
      heatmap[gridY][gridX] += heat;
    });
    
    return heatmap;
  }
  
  destroy(): void {
    if (this.animationHandle !== null) {
      cancelAnimationFrame(this.animationHandle);
    }
    this.activeParticles = [];
    this.pulseHistory = [];
  }
}
