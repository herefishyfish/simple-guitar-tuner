import { TunerColors, TunerRenderer, TunerRendererContext } from './tuner-renderer.interface';

/**
 * Strobe renderer
 * Strobe-style tuner display with animated vertical bars
 * Features a horizontal strobe display with moving segments
 */

const DARK_COLORS: TunerColors = {
  background: '#000000',
  text: '#ffffff',
  textSecondary: '#666666',
  inTune: '#22c55e',
  sharp: '#f85149',
  flat: '#58a6ff',
  accent: '#a371f7'
};

const LIGHT_COLORS: TunerColors = {
  background: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#888888',
  inTune: '#22c55e',
  sharp: '#f85149',
  flat: '#58a6ff',
  accent: '#a371f7'
};

export class WalrusCanvasRenderer implements TunerRenderer {
  name = 'Strobe';
  description = 'Strobe-style display';
  
  private strobePhase = 0;
  private lastTime = Date.now();

  getColors(theme: 'dark' | 'light'): TunerColors {
    return theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }

  render(context: TunerRendererContext): void {
    const colors = this.getColors('dark');
    this.renderWithColors(context, colors);
  }

  renderWithColors(context: TunerRendererContext, colors: TunerColors): void {
    const { ctx, width: w, height: h, pitch, displayedCents, isListening, referencePitch, showFrequency } = context;

    // Update strobe animation
    const now = Date.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    
    // Strobe speed based on cents offset - stops when in tune
    if (isListening && pitch) {
      const strobeSpeed = displayedCents * 8; // Speed proportional to cents offset
      this.strobePhase += strobeSpeed * deltaTime;
    }

    // Dark background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, w, h);

    // Draw the strobe display at top
    this.drawStrobeDisplay(ctx, w, h, displayedCents, isListening, pitch, colors);
    
    // Draw note display (large centered note)
    this.drawNoteDisplay(ctx, w, h, pitch, displayedCents, isListening, colors);
    
    // Draw frequency if enabled (bottom right)
    if (showFrequency) {
      this.drawFrequencyDisplay(ctx, w, h, pitch, isListening, referencePitch, colors);
    }
  }

  private drawStrobeDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, displayedCents: number, isListening: boolean, pitch: any, colors: TunerColors): void {
    const strobeY = h * 0.15;
    const strobeHeight = h * 0.18;
    const strobeWidth = w * 0.85;
    const startX = (w - strobeWidth) / 2;
    
    // Strobe container background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(startX - 10, strobeY - strobeHeight / 2 - 10, strobeWidth + 20, strobeHeight + 20);
    
    // Determine if in tune
    const absCents = Math.abs(displayedCents);
    const inTune = isListening && pitch && absCents <= 2;
    
    // Draw STATIC alternating vertical lines
    const lineCount = 31;
    const totalPadding = strobeWidth * 0.1; // 10% padding on each side
    const usableWidth = strobeWidth - totalPadding;
    const lineSpacing = usableWidth / (lineCount - 1); // 30 gaps for 31 lines
    const centerIndex = Math.floor(lineCount / 2); // Index 15 is the center
    
    for (let i = 0; i < lineCount; i++) {
      // Center the lines so index 15 is at w/2
      const x = w / 2 + (i - centerIndex) * lineSpacing;
      const isAlternate = i % 2 === 1; // Odd indices are tall lines, even are short
      
      // Calculate distance from center for height variation
      const centerX = w / 2;
      const distFromCenter = Math.abs(x - centerX) / (usableWidth / 2);
      const baseHeightMultiplier = 1 - distFromCenter * 0.4;
      
      // Alternate lines: taller/thicker (off-white) vs shorter/thinner (gray)
      let lineHeight: number;
      let lineWidth: number;
      let lineColor: string;
      
      if (isAlternate) {
        // Tall, thick, off-white lines - always same color
        lineHeight = strobeHeight * 0.85 * baseHeightMultiplier;
        lineWidth = lineSpacing * 0.35;
        lineColor = 'rgba(240, 240, 235, 0.9)';
      } else {
        // Shorter, thinner, gray lines - always same color
        lineHeight = strobeHeight * 0.5 * baseHeightMultiplier;
        lineWidth = lineSpacing * 0.2;
        lineColor = 'rgba(150, 150, 150, 0.7)';
      }
      
      ctx.fillStyle = lineColor;
      ctx.fillRect(x - lineWidth / 2, strobeY - lineHeight / 2, lineWidth, lineHeight);
    }
    
    // Draw center indicator triangle
    const triangleSize = 12;
    const triangleY = strobeY - strobeHeight / 2 - 5;
    
    ctx.beginPath();
    ctx.moveTo(w / 2, triangleY + triangleSize);
    ctx.lineTo(w / 2 - triangleSize / 2, triangleY);
    ctx.lineTo(w / 2 + triangleSize / 2, triangleY);
    ctx.closePath();
    
    ctx.save();
    if (inTune) {
      ctx.fillStyle = colors.inTune;
      // TODO: Fix canvas shadow rendering issue
      // ctx.shadowColor = colors.inTune;
      // ctx.shadowBlur = 15;
    } else {
      ctx.fillStyle = colors.textSecondary;
    }
    ctx.fill();
    ctx.restore();
    
    // Draw a SINGLE indicator line that shows tuning position
    if (isListening && pitch) {
      const indicatorWidth = 6;
      const indicatorHeight = strobeHeight * 0.95;
      
      // Color: green when in tune, red when sharp/flat
      const indicatorColor = inTune ? colors.inTune : '#ff4444';
      
      // Position based on cents offset: center = in tune, left = flat, right = sharp
      // Map -50 to +50 cents across the usable width
      const clampedCents = Math.max(-50, Math.min(50, displayedCents));
      const indicatorX = w / 2 + (clampedCents / 50) * (usableWidth / 2);
      
      // Draw the single indicator line
      ctx.save();
      ctx.fillStyle = indicatorColor;
      // TODO: Fix canvas shadow rendering issue
      // ctx.shadowColor = indicatorColor;
      // ctx.shadowBlur = 10;
      ctx.fillRect(indicatorX - indicatorWidth / 2, strobeY - indicatorHeight / 2, indicatorWidth, indicatorHeight);
      ctx.restore();
    }
    
    // Draw center line marker
    ctx.strokeStyle = inTune ? colors.inTune : colors.textSecondary + '60';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, strobeY - strobeHeight / 2);
    ctx.lineTo(w / 2, strobeY + strobeHeight / 2);
    ctx.stroke();
  }

  private drawNoteDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, displayedCents: number, isListening: boolean, colors: TunerColors): void {
    const noteY = h * 0.55;
    const isPortrait = h > w;

    if (pitch && isListening) {
      const absCents = Math.abs(displayedCents);
      let noteColor = colors.text;
      if (absCents <= 2) {
        noteColor = colors.inTune;
      }

      // Large note letter - bigger in portrait mode
      const fontSize = isPortrait ? w * 0.45 : Math.min(w, h) * 0.35;
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.fillStyle = noteColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const noteLetter = pitch.note.replace('#', '');
      const isSharp = pitch.note.includes('#');

      // Glow effect when in tune - TODO: Fix canvas shadow rendering issue
      // if (absCents <= 2) {
      //   ctx.save();
      //   ctx.shadowColor = colors.inTune;
      //   ctx.shadowBlur = 30;
      //   ctx.fillText(noteLetter, w / 2, noteY);
      //   ctx.restore();
      // }
      ctx.fillText(noteLetter, w / 2, noteY);

      // Sharp symbol
      if (isSharp) {
        ctx.font = `bold ${fontSize * 0.4}px system-ui`;
        ctx.fillText('♯', w / 2 + fontSize * 0.4, noteY - fontSize * 0.25);
      }

      // Octave number (smaller, below)
      ctx.font = `${fontSize * 0.2}px system-ui`;
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText(`${pitch.octave}`, w / 2 + (isSharp ? fontSize * 0.5 : fontSize * 0.35), noteY + fontSize * 0.15);
    } else {
      // Placeholder when not detecting
      const fontSize = Math.min(w, h) * 0.25;
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.fillStyle = colors.textSecondary + '30';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('—', w / 2, noteY);
    }
  }

  private drawFrequencyDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, pitch: any, isListening: boolean, referencePitch: number, colors: TunerColors): void {
    // Reference pitch display (bottom right of "screen" area)
    const refX = w * 0.85;
    const refY = h * 0.75;

    ctx.font = '20px system-ui';
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${referencePitch}`, refX, refY);
    
    // Current frequency (if pitch detected)
    if (pitch && isListening) {
      ctx.font = '16px monospace';
      ctx.fillStyle = colors.textSecondary + '80';
      ctx.fillText(`${pitch.frequency.toFixed(1)} Hz`, refX, refY + 25);
    }
  }
}
