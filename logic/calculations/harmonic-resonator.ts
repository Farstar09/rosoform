/**
 * ROSOIDEAE Harmonic Resonator
 * Uses wave interference patterns to match discussion themes
 */

interface WaveformSignature {
  fundamentalFreq: number;
  harmonicSeries: number[];
  amplitudeProfile: number[];
  phaseOffsets: number[];
}

export class HarmonicResonator {
  private waveformCache: Map<string, WaveformSignature>;
  private resonanceThreshold: number = 0.618; // Golden ratio
  
  constructor() {
    this.waveformCache = new Map();
  }
  
  /**
   * Convert text into waveform signature using character resonance
   */
  synthesizeWaveform(textInput: string, authorEntropy: number): WaveformSignature {
    const charCodes = Array.from(textInput).map(c => c.charCodeAt(0));
    
    // Fundamental frequency based on text hash modulo
    const hashSum = charCodes.reduce((acc, code) => acc + code, 0);
    const fundamentalFreq = (hashSum % 256) / 256.0;
    
    // Generate harmonic overtones using Fibonacci spacing
    const harmonicSeries: number[] = [];
    let fib1 = 1, fib2 = 1;
    for (let i = 0; i < 7; i++) {
      const nextFib = fib1 + fib2;
      harmonicSeries.push(fundamentalFreq * nextFib);
      fib1 = fib2;
      fib2 = nextFib;
    }
    
    // Amplitude profile from character frequency distribution
    const amplitudeProfile = this.generateAmplitudeProfile(textInput);
    
    // Phase offsets influenced by author's contribution pattern
    const phaseOffsets = harmonicSeries.map((freq, idx) => 
      (authorEntropy * idx * Math.PI) % (2 * Math.PI)
    );
    
    return {
      fundamentalFreq,
      harmonicSeries,
      amplitudeProfile,
      phaseOffsets
    };
  }
  
  private generateAmplitudeProfile(text: string): number[] {
    const segments = this.segmentText(text, 8);
    return segments.map(segment => {
      const vowelRatio = this.calculateVowelRatio(segment);
      const punctuationDensity = segment.split('').filter(c => /[!?.,]/.test(c)).length / segment.length;
      return vowelRatio * 0.7 + punctuationDensity * 0.3;
    });
  }
  
  private segmentText(text: string, numSegments: number): string[] {
    const segmentLength = Math.ceil(text.length / numSegments);
    const segments: string[] = [];
    for (let i = 0; i < numSegments; i++) {
      segments.push(text.slice(i * segmentLength, (i + 1) * segmentLength));
    }
    return segments;
  }
  
  private calculateVowelRatio(text: string): number {
    const vowelCount = (text.match(/[aeiouAEIOU]/g) || []).length;
    return vowelCount / (text.length || 1);
  }
  
  /**
   * Calculate resonance between two waveforms using interference patterns
   */
  measureResonance(wave1: WaveformSignature, wave2: WaveformSignature): number {
    // Frequency alignment score
    const freqDelta = Math.abs(wave1.fundamentalFreq - wave2.fundamentalFreq);
    const freqScore = Math.exp(-freqDelta * 5);
    
    // Harmonic interference pattern
    let constructiveInterference = 0;
    let destructiveInterference = 0;
    
    for (let i = 0; i < Math.min(wave1.harmonicSeries.length, wave2.harmonicSeries.length); i++) {
      const phaseDiff = Math.abs(wave1.phaseOffsets[i] - wave2.phaseOffsets[i]);
      const amplitudeProduct = wave1.amplitudeProfile[i] * wave2.amplitudeProfile[i];
      
      if (phaseDiff < Math.PI / 2) {
        constructiveInterference += amplitudeProduct * Math.cos(phaseDiff);
      } else {
        destructiveInterference += amplitudeProduct * Math.sin(phaseDiff);
      }
    }
    
    const interferenceScore = constructiveInterference / (constructiveInterference + destructiveInterference + 0.1);
    
    // Weighted combination
    return freqScore * 0.4 + interferenceScore * 0.6;
  }
  
  /**
   * Find discussions that resonate with given waveform
   */
  discoverResonantThreads(targetWave: WaveformSignature, candidateWaves: Map<string, WaveformSignature>): Array<{threadId: string, resonance: number}> {
    const resonances: Array<{threadId: string, resonance: number}> = [];
    
    candidateWaves.forEach((wave, threadId) => {
      const resonanceScore = this.measureResonance(targetWave, wave);
      if (resonanceScore >= this.resonanceThreshold) {
        resonances.push({ threadId, resonance: resonanceScore });
      }
    });
    
    return resonances.sort((a, b) => b.resonance - a.resonance);
  }
}
