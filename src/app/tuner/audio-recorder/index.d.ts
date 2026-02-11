import { AudioRecorderCommon, AudioRecorderOptions, AudioDataCallback, PitchData } from './audio.common';

export { AudioRecorderCommon, AudioRecorderOptions, AudioDataCallback, PitchData, NOTE_NAMES } from './audio.common';

export declare class AudioRecorder extends AudioRecorderCommon {
  constructor(options?: AudioRecorderOptions);
  requestPermission(): Promise<boolean>;
  start(): void;
  stop(): void;
  dispose(): void;
}
