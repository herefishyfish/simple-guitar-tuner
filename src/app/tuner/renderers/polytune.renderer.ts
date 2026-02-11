import { TunerColors, TunerRenderer, TunerRendererContext } from './tuner-renderer.interface';

/**
 * LED Bar renderer
 * Multi-segment vertical LED bar display
 * Features a horizontal LED bar display with segment-style LEDs
 */

const DARK_COLORS: TunerColors = {
  background: '#0a0a0a',
  text: '#ffffff',
  textSecondary: '#666666',
  inTune: '#00ff00',
  sharp: '#ff0000',
  flat: '#ff0000',
  accent: '#00ff00'
};

const LIGHT_COLORS: TunerColors = {
  background: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#888888',
  inTune: '#00ff00',
  sharp: '#ff3333',
  flat: '#ff3333',
  accent: '#00ff00'
};

export class PolytuneRenderer implements TunerRenderer {
  name = 'LED Bar';
  description = 'Multi-segment LED display';

  getColors(theme: 'dark' | 'light'): TunerColors {
    return theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }

  render(context: TunerRendererContext): void {
    const { ctx, width: w, height: h } = context;
    const colors = this.getColors('dark');
    this.renderWithColors(context, colors);
  }

  renderWithColors(context: TunerRendererContext, colors: TunerColors): void {
    const { ctx, width: w, height: h, pitch, displayedCents, isListening, referencePitch, showFrequency } = context;

    // Dark background like a pedal display
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, w, h);

    // Draw the LED bar meter
    this.drawLEDMeter(ctx, w, h, displayedCents, isListening, colors);
    
    // Draw note display
    this.drawNoteDisplay(ctx, w, h, pitch, displayedCents, isListening, colors);
    
    // Draw frequency if enabled
    if (showFrequency) {
      this.drawFrequencyDisplay(ctx, w, h, pitch, isListening, colors);
    }
  }

  private drawLEDMeter(ctx: CanvasRenderingContext2D, w: number, h: number, displayedCents: number, isListening: boolean, colors: TunerColors): void {
    const centerX = w / 2;
    const meterY = h * 0.65;
    const ledCount = 21; // -50 to +50 cents, center is in tune
    const ledWidth = Math.min(w * 0.7 / ledCount, 25);
    
    // Make LEDs taller in portrait mode
    const isPortrait = h > w;
    const heightMultiplier = isPortrait ? 3.5 : 1.8;
    const ledHeight = ledWidth * heightMultiplier;
    
    const ledSpacing = ledWidth * 1.3;
    const totalWidth = (ledCount - 1) * ledSpacing;
    const startX = centerX - totalWidth / 2;

    // Calculate which LEDs should light up
    const normalizedCents = Math.max(-50, Math.min(50, displayedCents));
    const centIndex = Math.round((normalizedCents + 50) / 5); // 0-20

    for (let i = 0; i < ledCount; i++) {
      const x = startX + i * ledSpacing;
      const isCenter = i === 10;
      const isLeftHalf = i < 10;
      const isRightHalf = i > 10;
      
      let isLit = false;
      let ledColor = colors.textSecondary + '30';

      if (isListening) {
        // Light up LEDs based on cents position
        const absCents = Math.abs(displayedCents);
        
        if (absCents <= 3 && isCenter) {
          // In tune - only center LED lights green
          isLit = true;
          ledColor = colors.inTune;
        } else if (displayedCents < -3 && isLeftHalf) {
          // Flat - light red LEDs on left side
          const flatLeds = Math.min(10, Math.ceil(absCents / 5));
          if (i >= 10 - flatLeds) {
            isLit = true;
            ledColor = colors.flat;
          }
        } else if (displayedCents > 3 && isRightHalf) {
          // Sharp - light red LEDs on right side
          const sharpLeds = Math.min(10, Math.ceil(absCents / 5));
          if (i <= 10 + sharpLeds) {
            isLit = true;
            ledColor = colors.sharp;
          }
        }
      }

      // Draw LED segment with rounded corners
      ctx.beginPath();
      const cornerRadius = 3;
      const ledX = x - ledWidth / 2;
      const ledY = meterY - ledHeight / 2;
      
      ctx.roundRect(ledX, ledY, ledWidth, ledHeight, cornerRadius);
      
      if (isLit) {
        // Glowing effect for lit LEDs - TODO: Fix canvas shadow rendering issue
        // ctx.save();
        // ctx.shadowColor = ledColor;
        // ctx.shadowBlur = 15;
        // ctx.fillStyle = ledColor;
        // ctx.fill();
        // ctx.restore();
        
        // Inner highlight
        ctx.fillStyle = ledColor;
        ctx.fill();
      } else {
        // Dim unlit LED
        ctx.fillStyle = isCenter ? colors.inTune + '20' : colors.textSecondary + '15';
        ctx.fill();
      }

      // LED border
      ctx.strokeStyle = colors.textSecondary + '40';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw labels
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Flat label
    ctx.fillStyle = displayedCents < -3 ? colors.flat : colors.textSecondary + '60';
    ctx.fillText('♭', startX - ledSpacing, meterY);
    
    // Sharp label
    ctx.fillStyle = displayedCents > 3 ? colors.sharp : colors.textSecondary + '60';
    ctx.fillText('♯', startX + totalWidth + ledSpacing, meterY);
  }

  private drawNoteDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, displayedCents: number, isListening: boolean, colors: TunerColors): void {
    const centerX = w / 2;
    const noteY = h * 0.32;

    if (pitch && isListening) {
      const absCents = Math.abs(displayedCents);
      const noteColor = absCents <= 3 ? colors.inTune : colors.text;

      // Note letter with segment-display style font effect
      ctx.font = 'bold 120px system-ui';
      ctx.fillStyle = noteColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const noteLetter = pitch.note.replace('#', '');
      const isSharp = pitch.note.includes('#');

      // Glow effect when in tune - TODO: Fix canvas shadow rendering issue
      // if (absCents <= 3) {
      //   ctx.save();
      //   ctx.shadowColor = colors.inTune;
      //   ctx.shadowBlur = 30;
      //   ctx.fillText(noteLetter, centerX - (isSharp ? 20 : 0), noteY);
      //   ctx.restore();
      // }
      ctx.fillText(noteLetter, centerX - (isSharp ? 20 : 0), noteY);

      // Sharp symbol
      if (isSharp) {
        ctx.font = 'bold 50px system-ui';
        ctx.fillText('♯', centerX + 55, noteY - 25);
      }

      // Octave number
      ctx.font = '36px system-ui';
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText(`${pitch.octave}`, centerX + (isSharp ? 70 : 50), noteY + 35);
    } else {
      // No pitch - show dashes
      ctx.font = 'bold 100px system-ui';
      ctx.fillStyle = colors.textSecondary + '40';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('—', centerX, noteY);
    }
  }

  private drawFrequencyDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, isListening: boolean, colors: TunerColors): void {
    const centerX = w / 2;
    const freqY = h * 0.85;

    ctx.font = '20px monospace';
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (pitch && isListening) {
      ctx.fillText(`${pitch.frequency.toFixed(1)} Hz`, centerX, freqY);
    } else {
      ctx.fillText('--- Hz', centerX, freqY);
    }
  }

  private drawReferencePitch(ctx: CanvasRenderingContext2D, w: number, h: number, referencePitch: number, colors: TunerColors): void {
    ctx.font = '14px system-ui';
    ctx.fillStyle = colors.textSecondary + '80';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`A4=${referencePitch}`, w - 20, 25);
  }
}
