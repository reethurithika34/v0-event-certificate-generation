import type { Event } from "./types"

const STORAGE_KEY = "eventeye_events"

export function saveEvents(events: Event[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  }
}

export function loadEvents(): Event[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []

  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function saveEvent(event: Event): void {
  const events = loadEvents()
  const index = events.findIndex((e) => e.id === event.id)

  if (index >= 0) {
    events[index] = event
  } else {
    events.push(event)
  }

  saveEvents(events)
}

export function deleteEvent(eventId: string): void {
  const events = loadEvents().filter((e) => e.id !== eventId)
  saveEvents(events)
}
