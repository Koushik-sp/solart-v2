import { EventSeverity, EventType, SystemEvent } from "../types/system";
import { store } from "../data/mockSystem";

const MAX_EVENTS = 200;

function nextId(): string {
  // Timestamp + short random suffix is plenty for an MVP demo and avoids
  // pulling in uuid as a dependency.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function recordEvent(
  type: EventType,
  message: string,
  severity: EventSeverity = "info",
  metadata?: Record<string, unknown>
): SystemEvent {
  const event: SystemEvent = {
    id: nextId(),
    timestamp: Date.now(),
    type,
    message,
    severity,
    metadata,
  };
  store.events.unshift(event);
  if (store.events.length > MAX_EVENTS) {
    store.events.length = MAX_EVENTS;
  }
  return event;
}

export function listEvents(limit = 100): SystemEvent[] {
  return store.events.slice(0, limit);
}

export function clearEvents(): void {
  store.events.length = 0;
}
