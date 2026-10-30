// Types for the window.MotionEngine global that scrub-engine.js installs.
export {};
declare global {
  interface ScrubApi {
    readonly progress: number;
    stats(): { bitmaps: number; images: number; loading: number; decodedMB: number; misses: number; window: number };
    dispose(): void;
    resize(): void;
  }
  interface Window {
    __ready?: boolean;
    MotionEngine?: {
      Scrub(o: {
        canvas: HTMLCanvasElement;
        driver: HTMLElement;
        count: number;
        src: (i: number) => string;
        fps?: number;
        lerp?: number;
        blend?: boolean;
        cover?: boolean;
        dpr?: number;
        prefetch?: boolean;
        aheadSec?: number;
        behindSec?: number;
      }): ScrubApi;
      step(): void;
    };
  }
}
