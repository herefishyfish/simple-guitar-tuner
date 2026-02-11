import { AudioRecorderCommon, AudioRecorderOptions } from './audio.common';

export * from './audio.common';

export class AudioRecorder extends AudioRecorderCommon {
  private audioEngine: AVAudioEngine | null = null;

  constructor(options?: AudioRecorderOptions) {
    super(options);
  }

  async requestPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      AVAudioSession.sharedInstance().requestRecordPermission((granted: boolean) => {
        resolve(granted);
      });
    });
  }

  start(): void {
    if (this._isRecording) return;

    try {
      const audioSession = AVAudioSession.sharedInstance();
      audioSession.setCategoryModeOptionsError(
        AVAudioSessionCategoryRecord,
        AVAudioSessionModeDefault,
        AVAudioSessionCategoryOptions.DefaultToSpeaker
      );
      audioSession.setActiveError(true);

      // Use AVAudioEngine for real-time audio processing
      this.audioEngine = AVAudioEngine.new();
      const inputNode = this.audioEngine.inputNode;
      const format = inputNode.outputFormatForBus(0);
      
      inputNode.installTapOnBusBufferSizeFormatBlock(
        0,
        this.bufferSize,
        format,
        (buffer: AVAudioPCMBuffer, time: AVAudioTime) => {
          if (!this.audioDataCallback) return;
          
          const channelData = buffer.floatChannelData;
          if (channelData) {
            const data = channelData[0];
            const frameLength = buffer.frameLength;
            const floatData: number[] = [];
            
            for (let i = 0; i < frameLength; i++) {
              floatData.push(data[i]);
            }
            
            this.audioDataCallback(floatData);
          }
        }
      );

      this.audioEngine.prepare();
      this.audioEngine.startAndReturnError();
      
      this._isRecording = true;
    } catch (error) {
      console.error('Error starting iOS recording:', error);
    }
  }

  stop(): void {
    if (!this._isRecording) return;

    if (this.audioEngine) {
      try {
        this.audioEngine.inputNode.removeTapOnBus(0);
        this.audioEngine.stop();
      } catch (error) {
        console.error('Error stopping iOS recording:', error);
      }
      this.audioEngine = null;
    }

    this._isRecording = false;
  }

  dispose(): void {
    this.stop();
    this.audioDataCallback = null;
  }
}
