import { TunerColors, TunerRenderer, TunerRendererContext } from './tuner-renderer.interface';

/**
 * Chromatic renderer
 * Horizontal LED bar display with note indicator
 * Features a horizontal LED bar with needle-style indicator
 */

const DARK_COLORS: TunerColors = {
  background: '#1a1410',
  text: '#ffeedd',
  textSecondary: '#665544',
  inTune: '#00ff44',
  sharp: '#ff4400',
  flat: '#ff4400',
  accent: '#ffcc00'
};

const LIGHT_COLORS: TunerColors = {
  background: '#2a2420',
  text: '#fff8f0',
  textSecondary: '#887766',
  inTune: '#00ff44',
  sharp: '#ff5511',
  flat: '#ff5511',
  accent: '#ffdd22'
};

export class BossChromaticRenderer implements TunerRenderer {
  name = 'Chromatic';
  description = 'Horizontal LED bar';

  getColors(theme: 'dark' | 'light'): TunerColors {
    return theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }

  render(context: TunerRendererContext): void {
    const colors = this.getColors('dark');
    this.renderWithColors(context, colors);
  }

  renderWithColors(context: TunerRendererContext, colors: TunerColors): void {
    const { ctx, width: w, height: h, pitch, displayedCents, isListening, referencePitch, showFrequency } = context;

    // Warm dark background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, w, h);

    // Draw the LED meter bar
    this.drawLEDMeterBar(ctx, w, h, displayedCents, isListening, colors);
    
    // Draw note display with 7-segment style
    this.drawNoteDisplay(ctx, w, h, pitch, displayedCents, isListening, colors);
    
    // Draw flat/sharp indicators
    this.drawFlatSharpIndicators(ctx, w, h, displayedCents, isListening, colors);
    
    // Draw frequency if enabled
    if (showFrequency) {
      this.drawFrequencyDisplay(ctx, w, h, pitch, isListening, colors);
    }
  }

  private drawLEDMeterBar(ctx: CanvasRenderingContext2D, w: number, h: number, displayedCents: number, isListening: boolean, colors: TunerColors): void {
    const centerX = w / 2;
    const meterY = h * 0.72;
    const ledCount = 21; // 10 left + center + 10 right
    const ledWidth = Math.min((w * 0.75) / ledCount, 22);
    const ledHeight = ledWidth * 0.6;
    const ledSpacing = ledWidth * 1.15;
    const totalWidth = (ledCount - 1) * ledSpacing;
    const startX = centerX - totalWidth / 2;

    // Draw each LED
    for (let i = 0; i < ledCount; i++) {
      const x = startX + i * ledSpacing;
      const isCenter = i === 10;
      const isLeftHalf = i < 10;
      const distFromCenter = Math.abs(i - 10);
      
      let isLit = false;
      let ledColor = colors.textSecondary + '15';

      if (isListening) {
        const absCents = Math.abs(displayedCents);
        
        if (isCenter) {
          // Center LED - green when in tune
          if (absCents <= 5) {
            isLit = true;
            ledColor = colors.inTune;
          }
        } else if (displayedCents < -2 && isLeftHalf) {
          // Flat - red/orange LEDs from center outward on left
          const flatLeds = Math.min(10, Math.ceil(absCents / 5));
          if (distFromCenter <= flatLeds) {
            isLit = true;
            ledColor = colors.flat;
          }
        } else if (displayedCents > 2 && !isLeftHalf && !isCenter) {
          // Sharp - red/orange LEDs from center outward on right
          const sharpLeds = Math.min(10, Math.ceil(absCents / 5));
          if (distFromCenter <= sharpLeds) {
            isLit = true;
            ledColor = colors.sharp;
          }
        }
      }

      // Draw rectangular LED
      const ledX = x - ledWidth / 2;
      const ledY = meterY - ledHeight / 2;

      if (isLit) {
        // Glow effect
        ctx.save();
        ctx.shadowColor = ledColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = ledColor;
        ctx.fillRect(ledX, ledY, ledWidth, ledHeight);
        ctx.restore();
        
        // Bright center
        ctx.fillStyle = ledColor;
        ctx.fillRect(ledX, ledY, ledWidth, ledHeight);
        
        // Highlight on top half
        const gradient = ctx.createLinearGradient(ledX, ledY, ledX, ledY + ledHeight);
        gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(ledX, ledY, ledWidth, ledHeight);
      } else {
        ctx.fillStyle = isCenter ? colors.inTune + '10' : ledColor;
        ctx.fillRect(ledX, ledY, ledWidth, ledHeight);
      }

      // LED border
      ctx.strokeStyle = colors.textSecondary + '20';
      ctx.lineWidth = 1;
      ctx.strokeRect(ledX, ledY, ledWidth, ledHeight);
    }

    // Draw center triangle marker above
    ctx.beginPath();
    ctx.moveTo(centerX, meterY - ledHeight / 2 - 20);
    ctx.lineTo(centerX - 8, meterY - ledHeight / 2 - 8);
    ctx.lineTo(centerX + 8, meterY - ledHeight / 2 - 8);
    ctx.closePath();
    ctx.fillStyle = colors.inTune + '80';
    ctx.fill();
  }

  private drawNoteDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, displayedCents: number, isListening: boolean, colors: TunerColors): void {
    const centerX = w / 2;
    const noteY = h * 0.35;

    if (pitch && isListening) {
      const absCents = Math.abs(displayedCents);
      const inTune = absCents <= 5;

      // 7-segment style note display
      ctx.font = 'bold 100px monospace';
      ctx.fillStyle = inTune ? colors.inTune : colors.accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const noteLetter = pitch.note.replace('#', '');
      const isSharp = pitch.note.includes('#');

      // Glow when in tune
      if (inTune) {
        ctx.save();
        ctx.shadowColor = colors.inTune;
        ctx.shadowBlur = 25;
        ctx.fillText(noteLetter, centerX - (isSharp ? 25 : 0), noteY);
        ctx.restore();
      }
      ctx.fillText(noteLetter, centerX - (isSharp ? 25 : 0), noteY);

      // Sharp symbol
      if (isSharp) {
        ctx.font = 'bold 45px system-ui';
        ctx.fillText('♯', centerX + 45, noteY - 25);
      }

      // Octave number
      ctx.font = 'bold 36px monospace';
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText(`${pitch.octave}`, centerX + (isSharp ? 60 : 45), noteY + 30);
    } else {
      // Dashes when no signal
      ctx.font = 'bold 80px monospace';
      ctx.fillStyle = colors.textSecondary + '20';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('--', centerX, noteY);
    }
  }

  private drawFlatSharpIndicators(ctx: CanvasRenderingContext2D, w: number, h: number, displayedCents: number, isListening: boolean, colors: TunerColors): void {
    const noteY = h * 0.35;
    const leftX = w * 0.18;
    const rightX = w * 0.82;

    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Flat indicator
    const isFlat = isListening && displayedCents < -5;
    if (isFlat) {
      ctx.save();
      ctx.shadowColor = colors.flat;
      ctx.shadowBlur = 15;
      ctx.fillStyle = colors.flat;
      ctx.fillText('♭', leftX, noteY);
      ctx.restore();
    }
    ctx.fillStyle = isFlat ? colors.flat : colors.textSecondary + '25';
    ctx.fillText('♭', leftX, noteY);

    // Sharp indicator
    const isSharpTuning = isListening && displayedCents > 5;
    if (isSharpTuning) {
      ctx.save();
      ctx.shadowColor = colors.sharp;
      ctx.shadowBlur = 15;
      ctx.fillStyle = colors.sharp;
      ctx.fillText('♯', rightX, noteY);
      ctx.restore();
    }
    ctx.fillStyle = isSharpTuning ? colors.sharp : colors.textSecondary + '25';
    ctx.fillText('♯', rightX, noteY);

    // Labels
    ctx.font = '14px system-ui';
    ctx.fillStyle = colors.textSecondary + '60';
    ctx.fillText('FLAT', leftX, noteY + 35);
    ctx.fillText('SHARP', rightX, noteY + 35);
  }

  private drawFrequencyDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, isListening: boolean, colors: TunerColors): void {
    const centerX = w / 2;
    const freqY = h * 0.9;

    ctx.font = '18px monospace';
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (pitch && isListening) {
      ctx.fillText(`${pitch.frequency.toFixed(1)} Hz`, centerX, freqY);
    }
  }

  private drawReferencePitch(ctx: CanvasRenderingContext2D, w: number, h: number, referencePitch: number, colors: TunerColors): void {
    ctx.font = '12px system-ui';
    ctx.fillStyle = colors.textSecondary + '60';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`A4=${referencePitch}Hz`, w - 40, h - 20);
  }
}
