import { CommonModule } from '@angular/common';
import { Component, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';
import { ModalDialogParams } from '@nativescript/angular';
import { Application, isAndroid, isIOS } from '@nativescript/core';
import { AppSettings, SettingsService } from './settings.service';
import { TunerStyle } from './renderers';

declare const NSBundle: any;

@Component({
  selector: 'ns-settings',
  templateUrl: './settings.component.html',
  imports: [CommonModule],
  schemas: [NO_ERRORS_SCHEMA]
})
export class SettingsComponent implements OnInit {
  settings!: AppSettings;
  pitchPresets: { label: string; value: number }[];
  tunerStyles: { value: TunerStyle; name: string; description: string }[];
  bufferSizePresets: { label: string; value: number; description: string }[];
  appVersion: string = '1.0.0';

  // Static sensitivity levels (threshold values)
  readonly SENSITIVITY_LEVELS = [
    { label: 'Full', value: 0.001 },
    { label: 'Very High', value: 0.005 },
    { label: 'High', value: 0.01 },
    { label: 'Normal', value: 0.02 },
    { label: 'Low', value: 0.04 },
    { label: 'Very Low', value: 0.08 }
  ];

  constructor(
    private settingsService: SettingsService,
    private params: ModalDialogParams
  ) {
    this.pitchPresets = this.settingsService.PITCH_PRESETS;
    this.tunerStyles = this.settingsService.TUNER_STYLES;
    this.bufferSizePresets = this.settingsService.BUFFER_SIZE_PRESETS;
    this.appVersion = this.getAppVersion();
  }

  private getAppVersion(): string {
    try {
      if (isAndroid) {
        const context = Application.android.context;
        const packageInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
        return packageInfo.versionName;
      } else if (isIOS) {
        return NSBundle.mainBundle.objectForInfoDictionaryKey('CFBundleShortVersionString');
      }
    } catch (e) {
      console.error('Error getting app version:', e);
    }
    return '1.0.0';
  }

  ngOnInit(): void {
    this.settingsService.settings$.subscribe(settings => {
      this.settings = { ...settings };
    });
  }

  close(): void {
    this.params.closeCallback();
  }

  selectPitch(value: number): void {
    this.settingsService.updateSettings({ referencePitch: value });
  }

  toggleTheme(): void {
    const newTheme = this.settings.theme === 'dark' ? 'light' : 'dark';
    this.settingsService.updateSettings({ theme: newTheme });
  }

  toggleShowFrequency(): void {
    this.settingsService.updateSettings({ showFrequency: !this.settings.showFrequency });
  }

  adjustSensitivity(direction: number): void {
    const currentIndex = this.SENSITIVITY_LEVELS.findIndex(l => l.value === this.settings.noiseThreshold);
    const newIndex = Math.max(0, Math.min(this.SENSITIVITY_LEVELS.length - 1, currentIndex + direction));
    this.settingsService.updateSettings({ noiseThreshold: this.SENSITIVITY_LEVELS[newIndex].value });
  }

  getSensitivityLabel(): string {
    const level = this.SENSITIVITY_LEVELS.find(l => l.value === this.settings?.noiseThreshold);
    return level?.label ?? 'High';
  }

  toggleKeepScreenAwake(): void {
    this.settingsService.updateSettings({ keepScreenAwake: !this.settings.keepScreenAwake });
  }

  selectTunerStyle(style: TunerStyle): void {
    this.settingsService.updateSettings({ tunerStyle: style });
  }

  selectBufferSize(value: number): void {
    this.settingsService.updateSettings({ bufferSize: value });
  }

  resetSettings(): void {
    this.settingsService.resetSettings();
  }
}
