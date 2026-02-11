export interface PitchData {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  amplitude: number;
}

export interface AudioRecorderOptions {
  sampleRate?: number;
  bufferSize?: number;
}

export type AudioDataCallback = (audioData: number[]) => void;

// Musical notes
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export abstract class AudioRecorderCommon {
  protected readonly sampleRate: number;
  protected readonly bufferSize: number;
  protected audioDataCallback: AudioDataCallback | null = null;
  protected _isRecording = false;

  constructor(options?: AudioRecorderOptions) {
    this.sampleRate = options?.sampleRate ?? 44100;
    this.bufferSize = options?.bufferSize ?? 4096;
  }

  get isRecording(): boolean {
    return this._isRecording;
  }

  setAudioDataCallback(callback: AudioDataCallback | null): void {
    this.audioDataCallback = callback;
  }

  // Platform-specific implementations
  abstract requestPermission(): Promise<boolean>;
  abstract start(): void;
  abstract stop(): void;
  abstract dispose(): void;

  // Shared pitch detection logic
  detectPitch(audioData: number[], noiseThreshold: number = 0.01): { frequency: number; amplitude: number } | null {
    // Calculate amplitude (RMS)
    let sum = 0;
    for (const sample of audioData) {
      sum += sample * sample;
    }
    const amplitude = Math.sqrt(sum / audioData.length);

    // Check if signal is above noise threshold
    if (amplitude < noiseThreshold) {
      return null;
    }

    // Detect pitch using autocorrelation (YIN-inspired algorithm)
    const frequency = this.autocorrelate(audioData);
    
    if (frequency > 0) {
      return { frequency, amplitude };
    }
    
    return null;
  }

  private autocorrelate(audioData: number[]): number {
    const minFreq = 60; // E2 is ~82Hz, go a bit lower
    const maxFreq = 1500; // High E on guitar ~1318Hz
    
    const minPeriod = Math.floor(this.sampleRate / maxFreq);
    const maxPeriod = Math.floor(this.sampleRate / minFreq);
    
    const bufferSize = audioData.length;
    if (bufferSize < maxPeriod * 2) return 0;

    // Difference function
    const diff = new Array(maxPeriod).fill(0);
    
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      for (let i = 0; i < bufferSize - maxPeriod; i++) {
        const delta = audioData[i] - audioData[i + tau];
        diff[tau] += delta * delta;
      }
    }

    // Cumulative mean normalized difference function (CMNDF)
    const cmndf = new Array(maxPeriod).fill(0);
    cmndf[0] = 1;
    let runningSum = 0;
    
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      runningSum += diff[tau];
      cmndf[tau] = diff[tau] * tau / runningSum;
    }

    // Find the first minimum below threshold
    const threshold = 0.1;
    let bestTau = 0;
    
    for (let tau = minPeriod; tau < maxPeriod - 1; tau++) {
      if (cmndf[tau] < threshold) {
        // Find local minimum
        while (tau + 1 < maxPeriod && cmndf[tau + 1] < cmndf[tau]) {
          tau++;
        }
        bestTau = tau;
        break;
      }
    }

    // If no minimum found below threshold, find global minimum
    if (bestTau === 0) {
      let minValue = cmndf[minPeriod];
      bestTau = minPeriod;
      
      for (let tau = minPeriod + 1; tau < maxPeriod; tau++) {
        if (cmndf[tau] < minValue) {
          minValue = cmndf[tau];
          bestTau = tau;
        }
      }
      
      // Only return if minimum is reasonable
      if (minValue > 0.5) return 0;
    }

    // Parabolic interpolation for better accuracy
    if (bestTau > minPeriod && bestTau < maxPeriod - 1) {
      const s0 = cmndf[bestTau - 1];
      const s1 = cmndf[bestTau];
      const s2 = cmndf[bestTau + 1];
      const betterTau = bestTau + (s0 - s2) / (2 * (s0 - 2 * s1 + s2));
      return this.sampleRate / betterTau;
    }

    return this.sampleRate / bestTau;
  }

  // Convert frequency to musical note
  frequencyToNote(frequency: number, referencePitch: number = 440): Omit<PitchData, 'amplitude'> {
    // Calculate semitones from A4
    const semitonesFromA4 = 12 * Math.log2(frequency / referencePitch);
    
    // Round to nearest semitone
    const roundedSemitones = Math.round(semitonesFromA4);
    
    // Calculate cents deviation (100 cents = 1 semitone)
    const cents = Math.round((semitonesFromA4 - roundedSemitones) * 100);
    
    // Calculate note index and octave
    // A4 is the 9th note (index 9) of octave 4
    const noteIndexFromC0 = roundedSemitones + 9 + (4 * 12);
    const octave = Math.floor(noteIndexFromC0 / 12);
    const noteIndex = ((noteIndexFromC0 % 12) + 12) % 12;
    
    return {
      frequency,
      note: NOTE_NAMES[noteIndex],
      octave,
      cents
    };
  }

  // Get expected frequency for a note
  noteToFrequency(note: string, octave: number, referencePitch: number = 440): number {
    const noteIndex = NOTE_NAMES.indexOf(note);
    if (noteIndex === -1) return 0;
    
    // Semitones from A4
    const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9);
    return referencePitch * Math.pow(2, semitonesFromA4 / 12);
  }
}
