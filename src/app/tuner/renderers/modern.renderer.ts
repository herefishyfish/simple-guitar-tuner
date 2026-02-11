import { TunerColors, TunerRenderer, TunerRendererContext } from './tuner-renderer.interface';

/**
 * Modern renderer
 * Minimal dark design with organic waveform and frequency spectrum
 * Features a large centered note, wavy background shape, and spectrum bars
 */

const DARK_COLORS: TunerColors = {
  background: '#000000',
  text: '#e0e0e0',
  textSecondary: '#555555',
  inTune: '#22c55e',
  sharp: '#e84057',
  flat: '#e84057',
  accent: '#e84057'
};

const LIGHT_COLORS: TunerColors = {
  background: '#111111',
  text: '#f0f0f0',
  textSecondary: '#666666',
  inTune: '#22c55e',
  sharp: '#e84057',
  flat: '#e84057',
  accent: '#e84057'
};

export class ModernRenderer implements TunerRenderer {
  name = 'Modern';
  description = 'Minimal waveform display';

  private wavePhase = 0;
  private lastTime = Date.now();
  private spectrumValues: number[] = [];

  getColors(theme: 'dark' | 'light'): TunerColors {
    return theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }

  render(context: TunerRendererContext): void {
    const colors = this.getColors('dark');
    this.renderWithColors(context, colors);
  }

  renderWithColors(context: TunerRendererContext, colors: TunerColors): void {
    const { ctx, width: w, height: h, pitch, displayedCents, isListening, referencePitch, showFrequency } = context;

    // Animate wave
    const now = Date.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (isListening && pitch) {
      this.wavePhase += deltaTime * 1.5;
    } else {
      this.wavePhase += deltaTime * 0.3;
    }

    // Dark background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, w, h);

    // Draw organic waveform shape in the middle
    this.drawWaveform(ctx, w, h, displayedCents, isListening, pitch, colors);

    // Draw large centered note
    this.drawNoteDisplay(ctx, w, h, pitch, displayedCents, isListening, referencePitch, colors);

    // Draw detected frequency in accent color
    if (showFrequency) {
      this.drawDetectedFrequency(ctx, w, h, pitch, isListening, colors);
    }

    // Draw spectrum bars at the bottom
    this.drawSpectrumBars(ctx, w, h, displayedCents, isListening, pitch, colors);
  }

  private drawWaveform(ctx: CanvasRenderingContext2D, w: number, h: number, displayedCents: number, isListening: boolean, pitch: any, colors: TunerColors): void {
    const waveY = h * 0.68;
    const waveHeight = h * 0.18;
    const amplitude = isListening && pitch ? waveHeight * (0.6 + Math.abs(displayedCents) / 80) : waveHeight * 0.3;

    // Draw a subtle organic wave shape
    ctx.beginPath();
    ctx.moveTo(0, waveY);

    const segments = 80;
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * w;
      const normalizedX = i / segments;

      // Multiple sine waves for organic feel
      const wave1 = Math.sin(normalizedX * Math.PI * 3 + this.wavePhase) * amplitude * 0.6;
      const wave2 = Math.sin(normalizedX * Math.PI * 5 - this.wavePhase * 0.7) * amplitude * 0.3;
      const wave3 = Math.sin(normalizedX * Math.PI * 7 + this.wavePhase * 1.3) * amplitude * 0.15;

      // Envelope: fade edges
      const envelope = Math.sin(normalizedX * Math.PI);
      const y = waveY + (wave1 + wave2 + wave3) * envelope;

      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Close the wave shape to fill down to the bottom of the screen
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    // Fill with a dark translucent color
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();

    // Draw the wave line on top
    ctx.beginPath();
    ctx.moveTo(0, waveY);

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * w;
      const normalizedX = i / segments;

      const wave1 = Math.sin(normalizedX * Math.PI * 3 + this.wavePhase) * amplitude * 0.6;
      const wave2 = Math.sin(normalizedX * Math.PI * 5 - this.wavePhase * 0.7) * amplitude * 0.3;
      const wave3 = Math.sin(normalizedX * Math.PI * 7 + this.wavePhase * 1.3) * amplitude * 0.15;

      const envelope = Math.sin(normalizedX * Math.PI);
      const y = waveY + (wave1 + wave2 + wave3) * envelope;

      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = colors.textSecondary + '40';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private drawNoteDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, displayedCents: number, isListening: boolean, referencePitch: number, colors: TunerColors): void {
    const noteY = h * 0.30;
    const isPortrait = h > w;

    if (pitch && isListening) {
      const absCents = Math.abs(displayedCents);
      let noteColor = colors.text;
      if (absCents <= 3) {
        noteColor = colors.inTune;
      }

      // Large note letter
      const fontSize = isPortrait ? w * 0.40 : Math.min(w, h) * 0.30;
      ctx.font = `300 ${fontSize}px system-ui`;
      ctx.fillStyle = noteColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const noteLetter = pitch.note.replace('#', '');
      const isSharp = pitch.note.includes('#');

      ctx.fillText(noteLetter, w / 2 - (isSharp ? fontSize * 0.1 : 0), noteY);

      // Sharp symbol
      if (isSharp) {
        ctx.font = `300 ${fontSize * 0.35}px system-ui`;
        ctx.fillText('♯', w / 2 + fontSize * 0.35, noteY - fontSize * 0.2);
      }

      // Octave indicator (small, subtle)
      ctx.font = `300 ${fontSize * 0.18}px system-ui`;
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText(`${pitch.octave}`, w / 2 + (isSharp ? fontSize * 0.45 : fontSize * 0.3), noteY + fontSize * 0.12);

      // Reference frequency below the note name
      ctx.font = `300 ${Math.max(16, fontSize * 0.14)}px system-ui`;
      ctx.fillStyle = colors.textSecondary;
      ctx.textAlign = 'center';
      ctx.fillText(`${referencePitch}hz`, w / 2, noteY + fontSize * 0.42);
    } else {
      // Idle state
      const fontSize = isPortrait ? w * 0.30 : Math.min(w, h) * 0.22;
      ctx.font = `300 ${fontSize}px system-ui`;
      ctx.fillStyle = colors.textSecondary + '30';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('—', w / 2, noteY);

      // Show reference pitch even when idle
      ctx.font = `300 ${Math.max(14, fontSize * 0.14)}px system-ui`;
      ctx.fillStyle = colors.textSecondary + '50';
      ctx.fillText(`${referencePitch}hz`, w / 2, noteY + fontSize * 0.42);
    }
  }

  private drawDetectedFrequency(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, isListening: boolean, colors: TunerColors): void {
    const freqY = h * 0.58;

    if (pitch && isListening) {
      // Show detected frequency in accent red
      const freqText = `${Math.round(pitch.frequency)}hz`;
      ctx.font = `bold ${Math.max(22, h * 0.04)}px system-ui`;
      ctx.fillStyle = colors.accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(freqText, w / 2, freqY);
    }
  }

  private drawSpectrumBars(ctx: CanvasRenderingContext2D, w: number, h: number, displayedCents: number, isListening: boolean, pitch: any, colors: TunerColors): void {
    const barAreaY = h * 0.75;
    const barAreaHeight = h * 0.24;
    const barCount = 32;
    const barGap = 3;
    const totalWidth = w * 0.85;
    const barWidth = (totalWidth - barGap * (barCount - 1)) / barCount;
    const startX = (w - totalWidth) / 2;

    // Initialize spectrum values if needed
    if (this.spectrumValues.length !== barCount) {
      this.spectrumValues = new Array(barCount).fill(0);
    }

    // Update spectrum values with smooth decay
    for (let i = 0; i < barCount; i++) {
      let target: number;
      if (isListening && pitch) {
        // Create a frequency-spectrum-like pattern
        const centerIndex = barCount / 2;
        const distFromCenter = Math.abs(i - centerIndex) / centerIndex;

        // Main peak around the center, influenced by cents
        const centsOffset = displayedCents / 50;
        const peakPosition = centerIndex + centsOffset * (barCount * 0.3);
        const distFromPeak = Math.abs(i - peakPosition) / (barCount * 0.5);

        // Gaussian-like falloff from peak
        const peakInfluence = Math.exp(-distFromPeak * distFromPeak * 4);

        // Add some noise/variation
        const noise = Math.sin(i * 2.5 + this.wavePhase * 3) * 0.15 + 
                      Math.sin(i * 4.7 - this.wavePhase * 2) * 0.1;

        target = (peakInfluence * 0.8 + noise * 0.3 + 0.05) * barAreaHeight;
        target = Math.max(barAreaHeight * 0.03, Math.min(barAreaHeight * 0.95, target));
      } else {
        // Quiet idle animation
        const idleNoise = Math.sin(i * 0.8 + this.wavePhase * 0.5) * 0.5 + 0.5;
        target = barAreaHeight * 0.03 * idleNoise + barAreaHeight * 0.015;
      }

      // Smooth transition
      this.spectrumValues[i] += (target - this.spectrumValues[i]) * 0.15;
    }

    // Draw bars
    for (let i = 0; i < barCount; i++) {
      const x = startX + i * (barWidth + barGap);
      const barH = this.spectrumValues[i];

      ctx.fillStyle = colors.textSecondary + '50';
      ctx.fillRect(x, barAreaY + barAreaHeight - barH, barWidth, barH);
    }

    // Draw indicator bar (thicker red bar showing tuning position)
    if (isListening && pitch) {
      const absCents = Math.abs(displayedCents);
      const inTune = absCents <= 3;

      // Position the indicator: center = in tune, left = flat, right = sharp
      const clampedCents = Math.max(-50, Math.min(50, displayedCents));
      const indicatorNormalized = (clampedCents + 50) / 100; // 0 to 1
      const indicatorX = startX + indicatorNormalized * totalWidth;

      const indicatorWidth = 4;
      const indicatorHeight = barAreaHeight;
      const indicatorColor = inTune ? colors.inTune : colors.accent;

      ctx.fillStyle = indicatorColor;
      ctx.fillRect(indicatorX - indicatorWidth / 2, barAreaY, indicatorWidth, indicatorHeight);
    }
  }
}
