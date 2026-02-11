import { PitchData } from '../audio.service';

export type TunerStyle = 'classic' | 'polytune' | 'pitchblack' | 'walrus' | 'boss' | 'modern';

export interface TunerColors {
  background: string;
  text: string;
  textSecondary: string;
  inTune: string;
  sharp: string;
  flat: string;
  accent: string;
}

export interface TunerRendererContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pitch: PitchData | null;
  displayedCents: number;
  isListening: boolean;
  referencePitch: number;
  showFrequency: boolean;
}

export interface TunerRenderer {
  name: string;
  description: string;
  getColors(theme: 'dark' | 'light'): TunerColors;
  render(context: TunerRendererContext): void;
}

export const TUNER_STYLE_INFO: Record<TunerStyle, { name: string; description: string }> = {
  classic: { name: 'Analog', description: 'Traditional needle meter' },
  polytune: { name: 'LED Bar', description: 'Multi-segment LED display' },
  pitchblack: { name: 'Circular', description: 'Circular LED meter' },
  walrus: { name: 'Strobe', description: 'Strobe-style display' },
  boss: { name: 'Chromatic', description: 'Horizontal LED bar' },
  modern: { name: 'Modern', description: 'Minimal waveform display' }
};
