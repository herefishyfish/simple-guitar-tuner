import { TunerColors, TunerRenderer, TunerRendererContext } from './tuner-renderer.interface';

/**
 * Circular LED renderer
 * Circular arrangement of LED segments
 * Features a circular LED meter with center-out lighting
 */

const DARK_COLORS: TunerColors = {
  background: '#000000',
  text: '#ffffff',
  textSecondary: '#555555',
  inTune: '#00ff00',
  sharp: '#ff4444',
  flat: '#ff4444',
  accent: '#00ff00'
};

const LIGHT_COLORS: TunerColors = {
  background: '#111111',
  text: '#ffffff',
  textSecondary: '#666666',
  inTune: '#00ff00',
  sharp: '#ff5555',
  flat: '#ff5555',
  accent: '#00ff00'
};

export class PitchblackRenderer implements TunerRenderer {
  name = 'Circular';
  description = 'Circular LED meter';

  getColors(theme: 'dark' | 'light'): TunerColors {
    return theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }

  render(context: TunerRendererContext): void {
    const colors = this.getColors('dark');
    this.renderWithColors(context, colors);
  }

  renderWithColors(context: TunerRendererContext, colors: TunerColors): void {
    const { ctx, width: w, height: h, pitch, displayedCents, isListening, referencePitch, showFrequency } = context;

    // Pure black background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, w, h);

    // Draw the circular LED meter
    this.drawCircularMeter(ctx, w, h, displayedCents, isListening, colors);
    
    // Draw note display in center
    this.drawNoteDisplay(ctx, w, h, pitch, displayedCents, isListening, colors);
    
    // Draw frequency if enabled
    if (showFrequency) {
      this.drawFrequencyDisplay(ctx, w, h, pitch, isListening, colors);
    }
  }

  private drawCircularMeter(ctx: CanvasRenderingContext2D, w: number, h: number, displayedCents: number, isListening: boolean, colors: TunerColors): void {
    const centerX = w / 2;
    const centerY = h * 0.48;
    const radius = Math.min(w, h) * 0.38;
    const ledCount = 11; // 5 left, 1 center, 5 right
    const startAngle = Math.PI * 0.75; // Start at bottom-left
    const endAngle = Math.PI * 0.25; // End at bottom-right (going through top)
    const totalAngle = 2 * Math.PI - (startAngle - endAngle);
    const angleStep = totalAngle / (ledCount - 1);

    for (let i = 0; i < ledCount; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const isCenter = i === Math.floor(ledCount / 2);
      const isLeftHalf = i < Math.floor(ledCount / 2);
      
      let isLit = false;
      let ledColor = colors.textSecondary + '25';
      const ledRadius = isCenter ? 14 : 10;

      if (isListening) {
        const absCents = Math.abs(displayedCents);
        
        if (absCents <= 3) {
          // In tune - center LED glows green
          if (isCenter) {
            isLit = true;
            ledColor = colors.inTune;
          }
        } else if (displayedCents < -3) {
          // Flat - LEDs on left side light up
          const flatIndex = Math.min(5, Math.ceil(absCents / 10));
          const ledPosition = Math.floor(ledCount / 2) - i;
          if (isLeftHalf && ledPosition <= flatIndex && ledPosition > 0) {
            isLit = true;
            ledColor = colors.flat;
          }
        } else if (displayedCents > 3) {
          // Sharp - LEDs on right side light up
          const sharpIndex = Math.min(5, Math.ceil(absCents / 10));
          const ledPosition = i - Math.floor(ledCount / 2);
          if (!isLeftHalf && !isCenter && ledPosition <= sharpIndex && ledPosition > 0) {
            isLit = true;
            ledColor = colors.sharp;
          }
        }
      }

      // Draw LED dot
      ctx.beginPath();
      ctx.arc(x, y, ledRadius, 0, 2 * Math.PI);

      if (isLit) {
        // Glowing effect - TODO: Fix canvas shadow rendering issue
        // ctx.save();
        // ctx.shadowColor = ledColor;
        // ctx.shadowBlur = 25;
        // ctx.fillStyle = ledColor;
        // ctx.fill();
        // ctx.restore();
        
        ctx.fillStyle = ledColor;
        ctx.fill();
      } else {
        ctx.fillStyle = isCenter ? colors.inTune + '15' : ledColor;
        ctx.fill();
      }
    }

    // Draw meter ring outline
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 25, startAngle, startAngle + totalAngle);
    ctx.strokeStyle = colors.textSecondary + '30';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw "FLAT" and "SHARP" labels
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const labelRadius = radius + 45;
    const flatAngle = startAngle + angleStep * 1.5;
    const sharpAngle = startAngle + angleStep * (ledCount - 2.5);
    
    ctx.fillStyle = displayedCents < -3 ? colors.flat : colors.textSecondary + '50';
    ctx.fillText('♭', centerX + labelRadius * Math.cos(flatAngle), centerY + labelRadius * Math.sin(flatAngle));
    
    ctx.fillStyle = displayedCents > 3 ? colors.sharp : colors.textSecondary + '50';
    ctx.fillText('♯', centerX + labelRadius * Math.cos(sharpAngle), centerY + labelRadius * Math.sin(sharpAngle));
  }

  private drawNoteDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, displayedCents: number, isListening: boolean, colors: TunerColors): void {
    const centerX = w / 2;
    const centerY = h * 0.48;

    if (pitch && isListening) {
      const absCents = Math.abs(displayedCents);
      const noteColor = absCents <= 3 ? colors.inTune : colors.text;

      ctx.font = 'bold 80px system-ui';
      ctx.fillStyle = noteColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const noteLetter = pitch.note.replace('#', '');
      const isSharp = pitch.note.includes('#');

      // Glow when in tune - TODO: Fix canvas shadow rendering issue
      // if (absCents <= 3) {
      //   ctx.save();
      //   ctx.shadowColor = colors.inTune;
      //   ctx.shadowBlur = 25;
      //   ctx.fillText(noteLetter, centerX - (isSharp ? 15 : 0), centerY);
      //   ctx.restore();
      // }
      ctx.fillText(noteLetter, centerX - (isSharp ? 15 : 0), centerY);

      if (isSharp) {
        ctx.font = 'bold 35px system-ui';
        ctx.fillText('♯', centerX + 40, centerY - 20);
      }

      // Octave
      ctx.font = '28px system-ui';
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText(`${pitch.octave}`, centerX + (isSharp ? 50 : 35), centerY + 25);
    } else {
      ctx.font = 'bold 60px system-ui';
      ctx.fillStyle = colors.textSecondary + '30';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('—', centerX, centerY);
    }
  }

  private drawFrequencyDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, isListening: boolean, colors: TunerColors): void {
    const centerX = w / 2;
    const freqY = h * 0.88;

    ctx.font = '18px monospace';
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (pitch && isListening) {
      ctx.fillText(`${pitch.frequency.toFixed(1)} Hz`, centerX, freqY);
    }
  }

  private drawReferencePitch(ctx: CanvasRenderingContext2D, w: number, h: number, referencePitch: number, colors: TunerColors): void {
    ctx.font = '14px system-ui';
    ctx.fillStyle = colors.textSecondary + '70';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`A4=${referencePitch}`, w - 20, 25);
  }
}
