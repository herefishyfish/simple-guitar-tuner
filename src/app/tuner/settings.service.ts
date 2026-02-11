import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApplicationSettings } from '@nativescript/core';
import { keepAwake, allowSleepAgain } from '@nativescript-community/insomnia';
import { TunerStyle, TUNER_STYLE_INFO } from './renderers';

export interface AppSettings {
  referencePitch: number;    // A4 frequency (default 440Hz)
  theme: 'dark' | 'light';   // UI theme
  noiseThreshold: number;    // Sensitivity (0.001 - 0.1)
  showFrequency: boolean;    // Show frequency display
  keepScreenAwake: boolean;  // Prevent screen from turning off
  tunerStyle: TunerStyle;    // Visual style of the tuner
  bufferSize: number;        // Audio buffer size (responsiveness)
}

const DEFAULT_SETTINGS: AppSettings = {
  referencePitch: 440,
  theme: 'dark',
  noiseThreshold: 0.01,
  showFrequency: true,
  keepScreenAwake: true,
  tunerStyle: 'boss',
  bufferSize: 2048
};

const SETTINGS_KEY = 'guitar_tuner_settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private _settings = new BehaviorSubject<AppSettings>(this.loadSettings());
  
  settings$: Observable<AppSettings> = this._settings.asObservable();

  get settings(): AppSettings {
    return { ...this._settings.value };
  }

  private loadSettings(): AppSettings {
    try {
      const saved = ApplicationSettings.getString(SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      ApplicationSettings.setString(SETTINGS_KEY, JSON.stringify(this._settings.value));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  updateSettings(partial: Partial<AppSettings>): void {
    const oldSettings = this._settings.value;
    this._settings.next({ ...oldSettings, ...partial });
    this.saveSettings();
    
    // Handle keepScreenAwake changes
    if ('keepScreenAwake' in partial) {
      this.applyScreenAwakeSetting(partial.keepScreenAwake!);
    }
  }

  resetSettings(): void {
    this._settings.next({ ...DEFAULT_SETTINGS });
    this.saveSettings();
    this.applyScreenAwakeSetting(DEFAULT_SETTINGS.keepScreenAwake);
  }

  applyScreenAwakeSetting(keepAwakeEnabled: boolean): void {
    try {
      if (keepAwakeEnabled) {
        keepAwake();
      } else {
        allowSleepAgain();
      }
    } catch (error) {
      console.error('Error setting screen awake state:', error);
    }
  }

  // Initialize screen awake state based on current settings
  initializeScreenAwake(): void {
    this.applyScreenAwakeSetting(this._settings.value.keepScreenAwake);
  }

  // Reference pitch presets
  readonly PITCH_PRESETS = [
    { label: '432', value: 432, default: false },
    { label: '440', value: 440, default: true },
    { label: '442', value: 442, default: false }
  ];

  // Tuner style options
  readonly TUNER_STYLES: { value: TunerStyle; name: string; description: string }[] = [
    { value: 'boss', ...TUNER_STYLE_INFO.boss },
    { value: 'classic', ...TUNER_STYLE_INFO.classic },
    { value: 'polytune', ...TUNER_STYLE_INFO.polytune },
    { value: 'pitchblack', ...TUNER_STYLE_INFO.pitchblack },
    { value: 'walrus', ...TUNER_STYLE_INFO.walrus },
    { value: 'modern', ...TUNER_STYLE_INFO.modern }
  ];

  // Buffer size presets (responsiveness)
  readonly BUFFER_SIZE_PRESETS = [
    { label: 'Fast', value: 1024, description: '~43 fps, lower accuracy' },
    { label: 'Balanced', value: 2048, description: '~22 fps, recommended' },
    { label: 'Accurate', value: 4096, description: '~11 fps, best for low notes' }
  ];
}
