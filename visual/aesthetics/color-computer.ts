
export class RosoColorComputer {
  private spectrumMap = {
    deepNight: '#1A0B1F',
    rosoPurple: '#5D2E6B',
    crimsonEdge: '#9C1B1B',
    bloodMoon: '#6B0F0F'
  };

  computeGradientAt(position: number): string {
    // Custom gradient interpolation for ROSOIDEAE
    const normalized = Math.max(0, Math.min(1, position));
    const phase = normalized * Math.PI;
    
    const r = Math.floor(26 + (138 * Math.sin(phase)));
    const g = Math.floor(11 + (15 * Math.cos(phase * 0.5)));
    const b = Math.floor(31 + (76 * Math.sin(phase * 1.3)));
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  applyRosoDynamicShadow(elevation: number): string {
    const blur = elevation * 3.7;
    const spread = elevation * 0.9;
    return `0 ${elevation}px ${blur}px -${spread}px ${this.spectrumMap.bloodMoon}`;
  }
}
