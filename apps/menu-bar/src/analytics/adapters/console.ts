import { AnalyticsAdapter } from '../types';

const isDev = Boolean((globalThis as { __DEV__?: boolean }).__DEV__);

export class ConsoleAdapter implements AnalyticsAdapter {
  track(event: string, properties?: Record<string, unknown>) {
    if (isDev) {
      console.log(`[Analytics] ${event}`, properties || '');
    }
  }

  identify(userId: string) {
    if (isDev) {
      console.log(`[Analytics] identify: ${userId}`);
    }
  }
}
