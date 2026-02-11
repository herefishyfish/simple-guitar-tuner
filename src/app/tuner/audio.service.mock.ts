import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PitchData {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  amplitude: number;
}

export interface TunerSettings {
  referencePitch: number;
  noiseThreshold: number;
  bufferSize: number;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

@Injectable()
export class MockAudioService implements OnDestroy {
  private _pitchData = new BehaviorSubject<PitchData | null>(null);
  private _isListening = new BehaviorSubject<boolean>(false);
  private _hasPermission = new BehaviorSubject<boolean>(false);

  private _settings: TunerSettings = {
    referencePitch: 440,
    noiseThreshold: 0.01,
    bufferSize: 2048,
  };

  private mockInterval: ReturnType<typeof setInterval> | null = null;
  private currentCents = 0;
  private targetCents = 0;

  pitchData$: Observable<PitchData | null> = this._pitchData.asObservable();
  isListening$: Observable<boolean> = this._isListening.asObservable();
  hasPermission$: Observable<boolean> = this._hasPermission.asObservable();

  constructor(private ngZone: NgZone) {
    console.log('[MOCK AudioService] Initialized - using simulated pitch data');
  }

  ngOnDestroy(): void {
    this.stopMockData();
  }

  get settings(): TunerSettings {
    return { ...this._settings };
  }

  updateSettings(settings: Partial<TunerSettings>): void {
    this._settings = { ...this._settings, ...settings };
  }

  async requestPermission(): Promise<boolean> {
    console.log('[MOCK AudioService] Permission granted (mock)');
    this._hasPermission.next(true);
    return true;
  }

  async startListening(): Promise<void> {
    if (this._isListening.value) return;

    console.log('[MOCK AudioService] Starting mock audio data');
    this._hasPermission.next(true);
    this._isListening.next(true);
    this.startMockData();
  }

  stopListening(): void {
    if (!this._isListening.value) return;

    console.log('[MOCK AudioService] Stopping mock audio data');
    this.stopMockData();
    this._isListening.next(false);
    this._pitchData.next(null);
  }

  private startMockData(): void {
    // Simulate detecting an E2 string (82.41 Hz) with slight variation
    const baseNote = 'E';
    const baseOctave = 2;
    const baseFrequency = this.noteToFrequency(baseNote, baseOctave, this._settings.referencePitch);

    this.targetCents = (Math.random() - 0.5) * 40; // Random target between -20 and +20 cents

    this.mockInterval = setInterval(() => {
      this.ngZone.run(() => {
        // Slowly drift cents towards target, with some noise
        this.currentCents += (this.targetCents - this.currentCents) * 0.1;
        this.currentCents += (Math.random() - 0.5) * 2; // Add small noise

        // Occasionally change target
        if (Math.random() < 0.02) {
          this.targetCents = (Math.random() - 0.5) * 40;
        }

        // Calculate frequency with cents offset
        const centsRatio = Math.pow(2, this.currentCents / 1200);
        const frequency = baseFrequency * centsRatio;

        const pitchData: PitchData = {
          frequency,
          note: baseNote,
          octave: baseOctave,
          cents: Math.round(this.currentCents),
          amplitude: 0.3 + Math.random() * 0.4, // Random amplitude 0.3-0.7
        };

        this._pitchData.next(pitchData);
      });
    }, 50); // Update every 50ms
  }

  private stopMockData(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  getNoteFrequency(note: string, octave: number): number {
    return this.noteToFrequency(note, octave, this._settings.referencePitch);
  }

  private noteToFrequency(note: string, octave: number, referencePitch: number): number {
    const noteIndex = NOTES.indexOf(note);
    if (noteIndex === -1) return 0;

    // A4 = referencePitch (usually 440)
    // Calculate semitones from A4
    const semitonesFromA4 = noteIndex - 9 + (octave - 4) * 12;
    return referencePitch * Math.pow(2, semitonesFromA4 / 12);
  }
}
