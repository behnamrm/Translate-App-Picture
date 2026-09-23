import type { CefrLevel } from '@/types';

export interface Scan {
  /** Displayable URI (file:// on native, data: URI on web). */
  uri: string;
  /** JPEG data, base64 encoded without the data: prefix. */
  base64: string;
  level: CefrLevel;
}

// Images are too large for route params, so the current scan is held in memory
// between the Home/Camera screens and the Analysis screen.
let currentScan: Scan | null = null;

export function setScan(scan: Scan) {
  currentScan = scan;
}

export function getScan(): Scan | null {
  return currentScan;
}
