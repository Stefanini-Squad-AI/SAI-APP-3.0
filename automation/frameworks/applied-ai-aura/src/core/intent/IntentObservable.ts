/**
 * AURA — Intent Observable
 * Observer pattern implementation for tracking all intent events in a pipeline.
 */
import type { IntentEvent, IntentEventHandler, IntentObservable } from './types';

export class AuraIntentObservable implements IntentObservable {
  private readonly handlers = new Set<IntentEventHandler>();

  subscribe(handler: IntentEventHandler): () => void {
    this.handlers.add(handler);
    return () => { this.handlers.delete(handler); };
  }

  emit(event: IntentEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch {
        // handlers must not crash the pipeline
      }
    }
  }
}
