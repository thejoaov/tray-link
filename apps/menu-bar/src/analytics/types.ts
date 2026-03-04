export interface AnalyticsAdapter {
  track(event: string, properties?: Record<string, unknown>): void
  identify(userId: string): void
}

export enum AnalyticsEvent {
  APP_OPENED = 'APP_OPENED',
  PROJECT_ADDED = 'PROJECT_ADDED',
  PROJECT_REMOVED = 'PROJECT_REMOVED',
  PROJECT_OPENED_EDITOR = 'PROJECT_OPENED_EDITOR',
  PROJECT_OPENED_TERMINAL = 'PROJECT_OPENED_TERMINAL',
  PROJECT_OPENED_FINDER = 'PROJECT_OPENED_FINDER',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
  ERROR = 'ERROR',
}
