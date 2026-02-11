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

  adjustSensitivity(delta: number): void {
    const current = this.settings.noiseThreshold;
    const newValue = Math.max(0.005, Math.min(0.1, current + delta));
    this.settingsService.updateSettings({ noiseThreshold: newValue });
  }

  getSensitivityLabel(): string {
    const threshold = this.settings?.noiseThreshold ?? 0.015;
    if (threshold <= 0.008) return 'Very High';
    if (threshold <= 0.015) return 'High';
    if (threshold <= 0.025) return 'Normal';
    if (threshold <= 0.05) return 'Low';
    return 'Very Low';
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
