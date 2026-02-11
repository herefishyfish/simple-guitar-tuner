import { Application, Utils } from '@nativescript/core';
import { AudioRecorderCommon, AudioRecorderOptions } from './audio.common';

export * from './audio.common';

export class AudioRecorder extends AudioRecorderCommon {
  private audioRecord: android.media.AudioRecord | null = null;
  private recordingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options?: AudioRecorderOptions) {
    super(options);
  }

  async requestPermission(): Promise<boolean> {
    try {
      const permissions = (android as any).Manifest.permission;
      const activity = Application.android.foregroundActivity || Application.android.startActivity;
      
      const hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED ===
        androidx.core.content.ContextCompat.checkSelfPermission(
          Utils.android.getApplicationContext(),
          permissions.RECORD_AUDIO
        );

      if (hasPermission) {
        return true;
      }

      return new Promise((resolve) => {
        const requestCode = 1001;
        const callback = (args: any) => {
          if (args.requestCode === requestCode) {
            const granted = args.grantResults && 
              args.grantResults.length > 0 && 
              args.grantResults[0] === android.content.pm.PackageManager.PERMISSION_GRANTED;
            Application.android.off(Application.android.activityRequestPermissionsEvent, callback);
            resolve(granted);
          }
        };
        Application.android.on(Application.android.activityRequestPermissionsEvent, callback);
        
        androidx.core.app.ActivityCompat.requestPermissions(
          activity,
          [permissions.RECORD_AUDIO],
          requestCode
        );
      });
    } catch (error) {
      console.error('Error requesting Android permission:', error);
      return false;
    }
  }

  start(): void {
    if (this._isRecording) return;

    try {
      const audioSource = android.media.MediaRecorder.AudioSource.MIC;
      const channelConfig = android.media.AudioFormat.CHANNEL_IN_MONO;
      const audioFormat = android.media.AudioFormat.ENCODING_PCM_16BIT;
      
      const minBufferSize = android.media.AudioRecord.getMinBufferSize(
        this.sampleRate,
        channelConfig,
        audioFormat
      );
      
      const bufferSize = Math.max(this.bufferSize * 2, minBufferSize);
      
      this.audioRecord = new android.media.AudioRecord(
        audioSource,
        this.sampleRate,
        channelConfig,
        audioFormat,
        bufferSize
      );

      if (this.audioRecord.getState() !== android.media.AudioRecord.STATE_INITIALIZED) {
        console.error('AudioRecord failed to initialize');
        return;
      }

      this.audioRecord.startRecording();
      this._isRecording = true;

      // Start reading audio data
      const audioData = Array.create('short', this.bufferSize);
      
      this.recordingTimer = setInterval(() => {
        if (!this._isRecording || !this.audioRecord) return;
        
        const readResult = this.audioRecord.read(audioData, 0, this.bufferSize);
        if (readResult > 0 && this.audioDataCallback) {
          // Convert to float array
          const floatData: number[] = [];
          for (let i = 0; i < readResult; i++) {
            floatData.push(audioData[i] / 32768.0);
          }
          this.audioDataCallback(floatData);
        }
      }, 50);
    } catch (error) {
      console.error('Error starting Android recording:', error);
    }
  }

  stop(): void {
    if (!this._isRecording) return;

    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    if (this.audioRecord) {
      try {
        this.audioRecord.stop();
        this.audioRecord.release();
      } catch (error) {
        console.error('Error stopping Android recording:', error);
      }
      this.audioRecord = null;
    }

    this._isRecording = false;
  }

  dispose(): void {
    this.stop();
    this.audioDataCallback = null;
  }
}
