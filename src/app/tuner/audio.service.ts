import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AudioRecorder, PitchData } from './audio-recorder';

export { PitchData } from './audio-recorder';

export interface TunerSettings {
  referencePitch: number;
  noiseThreshold: number;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService implements OnDestroy {
  private _pitchData = new BehaviorSubject<PitchData | null>(null);
  private _isListening = new BehaviorSubject<boolean>(false);
  private _hasPermission = new BehaviorSubject<boolean>(false);
  
  private _settings: TunerSettings = {
    referencePitch: 440,
    noiseThreshold: 0.01
  };

  private recorder: AudioRecorder;

  pitchData$: Observable<PitchData | null> = this._pitchData.asObservable();
  isListening$: Observable<boolean> = this._isListening.asObservable();
  hasPermission$: Observable<boolean> = this._hasPermission.asObservable();

  constructor(private ngZone: NgZone) {
    this.recorder = new AudioRecorder({
      sampleRate: 44100,
      bufferSize: 4096
    });

    // Set up the audio data callback
    this.recorder.setAudioDataCallback((audioData: number[]) => {
      this.ngZone.run(() => {
        this.processAudioData(audioData);
      });
    });
  }

  ngOnDestroy(): void {
    this.recorder.dispose();
  }

  get settings(): TunerSettings {
    return { ...this._settings };
  }

  updateSettings(settings: Partial<TunerSettings>): void {
    this._settings = { ...this._settings, ...settings };
  }

  async requestPermission(): Promise<boolean> {
    const granted = await this.recorder.requestPermission();
    this._hasPermission.next(granted);
    return granted;
  }

  async startListening(): Promise<void> {
    if (this._isListening.value) return;

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.error('Microphone permission not granted');
      return;
    }

    this.recorder.start();
    this._isListening.next(true);
  }

  stopListening(): void {
    if (!this._isListening.value) return;

    this.recorder.stop();
    this._isListening.next(false);
    this._pitchData.next(null);
  }

  private processAudioData(audioData: number[]): void {
    const result = this.recorder.detectPitch(audioData, this._settings.noiseThreshold);
    
    if (result) {
      const noteData = this.recorder.frequencyToNote(result.frequency, this._settings.referencePitch);
      const pitchData: PitchData = {
        ...noteData,
        amplitude: result.amplitude
      };
      this._pitchData.next(pitchData);
    } else {
      this._pitchData.next(null);
    }
  }

  getNoteFrequency(note: string, octave: number): number {
    return this.recorder.noteToFrequency(note, octave, this._settings.referencePitch);
  }
}


