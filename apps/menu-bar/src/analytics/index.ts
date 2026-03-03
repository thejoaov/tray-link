import { ConsoleAdapter } from './adapters/console';
import { AnalyticsAdapter, AnalyticsEvent } from './types';

class Analytics {
  private static adapter: AnalyticsAdapter = new ConsoleAdapter();

  static setAdapter(adapter: AnalyticsAdapter) {
    this.adapter = adapter;
  }

  static track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
    this.adapter.track(event, properties);
  }

  static identify(userId: string) {
    this.adapter.identify(userId);
  }
}

export { AnalyticsEvent };
export default Analytics;
