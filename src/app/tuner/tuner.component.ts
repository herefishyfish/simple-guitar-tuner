import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, NO_ERRORS_SCHEMA, NgZone, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ModalDialogService, registerElement } from '@nativescript/angular';
import { Canvas } from '@nativescript/canvas';
import { Application, Color, EventData, Page, Screen } from '@nativescript/core';
import { Subscription } from 'rxjs';
import { AudioService, PitchData } from './audio.service';
import { AppSettings, SettingsService } from './settings.service';
import { SettingsComponent } from './settings.component';
import {
  TunerRenderer,
  TunerRendererContext,
  TunerColors,
  TunerStyle,
  ClassicRenderer,
  PolytuneRenderer,
  PitchblackRenderer,
  WalrusCanvasRenderer,
  BossChromaticRenderer
} from './renderers';

// Register the Canvas element
registerElement('Canvas', () => Canvas);

// Create renderer instances
const RENDERERS: Record<TunerStyle, TunerRenderer> = {
  classic: new ClassicRenderer(),
  polytune: new PolytuneRenderer(),
  pitchblack: new PitchblackRenderer(),
  walrus: new WalrusCanvasRenderer(),
  boss: new BossChromaticRenderer()
};

@Component({
  selector: 'ns-tuner',
  templateUrl: './tuner.component.html',
  imports: [CommonModule],
  providers: [ModalDialogService],
  schemas: [NO_ERRORS_SCHEMA]
})
export class TunerComponent implements OnInit, OnDestroy {
  @ViewChild('tunerCanvas', { static: false }) canvasRef!: ElementRef;
  
  private canvas!: Canvas;
  private ctx!: CanvasRenderingContext2D;
  private subscriptions: Subscription[] = [];
  private animationId: number = 0;
  private currentPitch: PitchData | null = null;
  private targetCents: number = 0;
  private displayedCents: number = 0;
  private currentRenderer: TunerRenderer = RENDERERS.classic;
  private currentColors!: TunerColors;
  
  // Canvas dimensions
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;
  
  private isListening = false;
  private settings!: AppSettings;

  constructor(
    private audioService: AudioService,
    private settingsService: SettingsService,
    @Inject(ModalDialogService) private modalService: ModalDialogService,
    @Inject(ViewContainerRef) private viewContainerRef: ViewContainerRef,
    @Inject(NgZone) private ngZone: NgZone,
    @Inject(Page) private page: Page
  ) {
    this.page.actionBarHidden = true;
    if (global.isAndroid) {
      (this.page as any).androidOverflowEdge = 'top,bottom,left,right';
      this.updateSystemBarColors();
    }
  }

  ngOnInit(): void {
    // Initialize screen awake state
    this.settingsService.initializeScreenAwake();
    
    // Subscribe to settings changes
    this.subscriptions.push(
      this.settingsService.settings$.subscribe(settings => {
        this.settings = { ...settings };
        this.currentRenderer = RENDERERS[settings.tunerStyle] || RENDERERS.classic;
        this.currentColors = this.currentRenderer.getColors(settings.theme);
        this.updateSystemBarColors();
        this.audioService.updateSettings({
          referencePitch: settings.referencePitch,
          noiseThreshold: settings.noiseThreshold
        });
      })
    );

    // Subscribe to pitch data
    this.subscriptions.push(
      this.audioService.pitchData$.subscribe(pitch => {
        this.currentPitch = pitch;
        if (pitch) {
          this.targetCents = pitch.cents;
        }
      })
    );

    // Track listening state internally
    this.subscriptions.push(
      this.audioService.isListening$.subscribe(isListening => {
        this.isListening = isListening;
      })
    );
  }

  ngOnDestroy(): void {
    this.stopTuner();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    // Remove orientation change listener
    Application.off('orientationChanged', this.onOrientationChanged, this);
  }

  onCanvasReady(args: EventData): void {
    this.canvas = args.object as Canvas;
    this.ctx = this.canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
    this.dpr = Screen.mainScreen.scale;
    
    // Set initial canvas size
    this.resizeCanvas();
    
    // Listen for orientation changes
    Application.on('orientationChanged', this.onOrientationChanged, this);
    
    // Start render loop
    this.startRenderLoop();
    
    // Auto-start the tuner
    this.startTuner();
  }

  private onOrientationChanged = (): void => {
    // Delay to allow screen dimensions to update
    setTimeout(() => {
      this.resizeCanvas();
    }, 100);
  };

  private resizeCanvas(): void {
    if (!this.canvas || !this.ctx) return;
    
    const screenWidth = Screen.mainScreen.widthDIPs;
    const screenHeight = Screen.mainScreen.heightDIPs;
    
    this.width = screenWidth;
    this.height = screenHeight;
    
    // Reset canvas size
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    
    // Reset transform and apply scale
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  private startRenderLoop(): void {
    const render = () => {
      this.ngZone.runOutsideAngular(() => {
        this.updateAnimation();
        this.draw();
        this.animationId = requestAnimationFrame(render);
      });
    };
    render();
  }

  private updateAnimation(): void {
    // Smooth cents animation
    const smoothing = 0.15;
    if (this.currentPitch) {
      this.displayedCents += (this.targetCents - this.displayedCents) * smoothing;
    } else {
      // Slowly return to center when no pitch detected
      this.displayedCents *= 0.9;
    }
  }

  private draw(): void {
    if (!this.ctx || !this.currentRenderer) return;
    
    const context: TunerRendererContext = {
      ctx: this.ctx,
      width: this.width,
      height: this.height,
      pitch: this.currentPitch,
      displayedCents: this.displayedCents,
      isListening: this.isListening,
      referencePitch: this.settings?.referencePitch ?? 440,
      showFrequency: this.settings?.showFrequency ?? true
    };

    // Use the renderWithColors method if available for theme support
    if ('renderWithColors' in this.currentRenderer && typeof (this.currentRenderer as any).renderWithColors === 'function') {
      (this.currentRenderer as any).renderWithColors(context, this.currentColors);
    } else {
      this.currentRenderer.render(context);
    }
  }

  private async startTuner(): Promise<void> {
    await this.audioService.startListening();
  }

  private stopTuner(): void {
    this.audioService.stopListening();
  }

  private updateSystemBarColors(): void {
    if (global.isAndroid && this.currentColors) {
      try {
        const activity = Application.android?.foregroundActivity || Application.android?.startActivity;
        if (activity) {
          const window = activity.getWindow();
          const color = new Color(this.currentColors.background).android;
          window.setStatusBarColor(color);
          window.setNavigationBarColor(color);
        }
      } catch (e) {
        console.error('Failed to set system bar colors:', e);
      }
    }
  }

  openSettings(): void {
    this.audioService.stopListening();
    
    this.modalService.showModal(SettingsComponent, {
      viewContainerRef: this.viewContainerRef,
      fullscreen: true
    }).then(() => {
      this.audioService.startListening();
    });
  }
}
