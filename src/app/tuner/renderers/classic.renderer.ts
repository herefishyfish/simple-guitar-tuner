import { TunerColors, TunerRenderer, TunerRendererContext } from './tuner-renderer.interface';

const DARK_COLORS: TunerColors = {
  background: '#000000',
  text: '#ffffff',
  textSecondary: '#5a5a6e',
  inTune: '#4ade80',
  sharp: '#f97316',
  flat: '#3b82f6',
  accent: '#8b5cf6'
};

const LIGHT_COLORS: TunerColors = {
  background: '#f8f8fc',
  text: '#1a1a2e',
  textSecondary: '#8888aa',
  inTune: '#22c55e',
  sharp: '#ea580c',
  flat: '#2563eb',
  accent: '#7c3aed'
};

export class ClassicRenderer implements TunerRenderer {
  name = 'Analog';
  description = 'Traditional needle meter';

  getColors(theme: 'dark' | 'light'): TunerColors {
    return theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }

  render(context: TunerRendererContext): void {
    const colors = this.getColors('dark');
    this.renderWithColors(context, colors);
  }

  renderWithColors(context: TunerRendererContext, colors: TunerColors): void {
    const { ctx, width: w, height: h, pitch, displayedCents, isListening, showFrequency } = context;

    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, w, h);

    // Draw the meter
    this.drawMeter(ctx, w, h, displayedCents, isListening, colors);
    
    // Draw note display
    this.drawNoteDisplay(ctx, w, h, pitch, displayedCents, isListening, colors);
    
    // Draw frequency if enabled
    if (showFrequency) {
      this.drawFrequencyDisplay(ctx, w, h, pitch, displayedCents, isListening, colors);
    }
  }

  private drawMeter(ctx: CanvasRenderingContext2D, w: number, h: number, displayedCents: number, isListening: boolean, colors: TunerColors): void {
    const isPortrait = h > w;
    const centerX = isPortrait ? w / 2 : w * 0.65;
    const centerY = isPortrait ? h * 0.65 : h * 0.7;
    const radius = isPortrait ? w * 0.4 : Math.min(w * 0.3, h * 0.5);

    // Main meter arc background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = colors.textSecondary + '30';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw tick marks
    const tickCount = 21;
    for (let i = 0; i < tickCount; i++) {
      const angle = Math.PI + (i / (tickCount - 1)) * Math.PI;
      const cents = (i - 10) * 5; // -50 to +50
      const isMajor = cents % 25 === 0;
      const isCenter = cents === 0;

      const innerRadius = radius - (isCenter ? 28 : (isMajor ? 22 : 15));
      const outerRadius = radius - 6;

      const x1 = centerX + innerRadius * Math.cos(angle);
      const y1 = centerY + innerRadius * Math.sin(angle);
      const x2 = centerX + outerRadius * Math.cos(angle);
      const y2 = centerY + outerRadius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isCenter ? colors.inTune : colors.textSecondary + (isMajor ? '90' : '50');
      ctx.lineWidth = isCenter ? 3 : (isMajor ? 2 : 1);
      ctx.lineCap = 'round';
      ctx.stroke();

      // Labels for major ticks
      if (isMajor) {
        const labelRadius = radius - 40;
        const labelX = centerX + labelRadius * Math.cos(angle);
        const labelY = centerY + labelRadius * Math.sin(angle);

        ctx.font = `${Math.max(12, radius * 0.1)}px system-ui`;
        ctx.fillStyle = isCenter ? colors.inTune : colors.textSecondary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = isCenter ? '0' : (cents > 0 ? `+${cents}` : `${cents}`);
        ctx.fillText(label, labelX, labelY);
      }
    }

    // Draw "in tune" zone highlight
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 1.45, Math.PI * 1.55);
    ctx.strokeStyle = colors.inTune + '40';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw needle
    const needleAngle = Math.PI + (displayedCents / 50 + 1) * Math.PI / 2;
    const needleLength = radius - 50;

    let needleColor: string;
    const absCents = Math.abs(displayedCents);
    if (absCents <= 5) {
      needleColor = colors.inTune;
    } else if (displayedCents > 0) {
      needleColor = colors.sharp;
    } else {
      needleColor = colors.flat;
    }

    // Needle shadow - TODO: Fix canvas shadow rendering issue
    // ctx.save();
    // ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    // ctx.shadowBlur = 8;
    // ctx.shadowOffsetX = 2;
    // ctx.shadowOffsetY = 2;

    // Draw needle body
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const needleX = centerX + needleLength * Math.cos(needleAngle);
    const needleY = centerY + needleLength * Math.sin(needleAngle);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = needleColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    // ctx.restore();

    // Draw needle pivot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = needleColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = colors.background;
    ctx.fill();

    // Glow effect when in tune - on the needle pivot
    // TODO: Fix canvas shadow rendering issue
    // if (isListening && absCents <= 5) {
    //   ctx.save();
    //   ctx.beginPath();
    //   ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
    //   ctx.fillStyle = colors.inTune;
    //   ctx.shadowColor = colors.inTune;
    //   ctx.shadowBlur = 25;
    //   ctx.fill();
    //   ctx.restore();
    // }
  }

  private drawNoteDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, displayedCents: number, isListening: boolean, colors: TunerColors): void {
    const isPortrait = h > w;
    const noteX = isPortrait ? w / 2 : w * 0.22;
    const noteY = isPortrait ? h * 0.2 : h * 0.4;

    if (pitch && isListening) {
      const absCents = Math.abs(displayedCents);
      let noteColor = colors.text;
      if (absCents <= 5) {
        noteColor = colors.inTune;
      }

      // Large note
      const fontSize = isPortrait ? w * 0.28 : h * 0.32;
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.fillStyle = noteColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const noteLetter = pitch.note.replace('#', '');
      const isSharp = pitch.note.includes('#');

      // Glow when in tune
      // TODO: Fix canvas shadow rendering issue
      // if (absCents <= 5) {
      //   ctx.save();
      //   ctx.shadowColor = colors.inTune;
      //   ctx.shadowBlur = 25;
      //   ctx.fillText(noteLetter, noteX - (isSharp ? fontSize * 0.15 : 0), noteY);
      //   ctx.restore();
      // }
      ctx.fillText(noteLetter, noteX - (isSharp ? fontSize * 0.15 : 0), noteY);

      // Sharp symbol
      if (isSharp) {
        ctx.font = `bold ${fontSize * 0.4}px system-ui`;
        ctx.fillText('♯', noteX + fontSize * 0.35, noteY - fontSize * 0.2);
      }

      // Octave
      ctx.font = `${fontSize * 0.25}px system-ui`;
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText(`${pitch.octave}`, noteX + (isSharp ? fontSize * 0.45 : fontSize * 0.3), noteY + fontSize * 0.2);
    } else {
      const fontSize = isPortrait ? w * 0.18 : h * 0.25;
      ctx.font = `${fontSize}px system-ui`;
      ctx.fillStyle = colors.textSecondary + '40';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('—', noteX, noteY);
    }
  }

  private drawFrequencyDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, displayedCents: number, isListening: boolean, colors: TunerColors): void {
    const isPortrait = h > w;
    const freqX = isPortrait ? w / 2 : w * 0.22;
    const freqY = isPortrait ? h * 0.88 : h * 0.65;

    ctx.font = '16px monospace';
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (pitch && isListening) {
      const centsText = displayedCents >= 0 ? `+${Math.round(displayedCents)}` : `${Math.round(displayedCents)}`;
      if (isPortrait) {
        ctx.fillText(`${pitch.frequency.toFixed(1)} Hz  •  ${centsText}¢`, freqX, freqY);
      } else {
        ctx.fillText(`${pitch.frequency.toFixed(1)} Hz`, freqX, freqY);
        ctx.fillText(`${centsText}¢`, freqX, freqY + 22);
      }
    }
  }
}
