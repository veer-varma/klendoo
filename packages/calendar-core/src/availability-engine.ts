import { AvailabilitySlot, CalendarEvent } from './types';

export class AvailabilityEngine {
  private bufferMinutes: number = 15;

  setBuffer(minutes: number) {
    this.bufferMinutes = minutes;
  }

  calculateAvailability(
    events: CalendarEvent[],
    date: string,
    workStartHour: number = 9,
    workEndHour: number = 17,
    slotDuration: number = 30
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const dayEvents = events.filter((e) => e.startTime.split('T')[0] === date);
    
    dayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    let currentTime = new Date(`${date}T${String(workStartHour).padStart(2, '0')}:00:00`);
    const endOfDay = new Date(`${date}T${String(workEndHour).padStart(2, '0')}:00:00`);

    for (const event of dayEvents) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Add buffer before event
      const bufferStart = new Date(eventStart.getTime() - this.bufferMinutes * 60000);

      if (currentTime < bufferStart) {
        while (new Date(currentTime.getTime() + slotDuration * 60000) <= bufferStart) {
          const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
          slots.push({
            date,
            startTime: currentTime.toISOString().split('T')[1].slice(0, 5),
            endTime: slotEnd.toISOString().split('T')[1].slice(0, 5),
            duration: slotDuration,
          });
          currentTime = slotEnd;
        }
      }

      currentTime = new Date(eventEnd.getTime() + this.bufferMinutes * 60000);
    }

    // Add remaining slots until end of day
    while (new Date(currentTime.getTime() + slotDuration * 60000) <= endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
      slots.push({
        date,
        startTime: currentTime.toISOString().split('T')[1].slice(0, 5),
        endTime: slotEnd.toISOString().split('T')[1].slice(0, 5),
        duration: slotDuration,
      });
      currentTime = slotEnd;
    }

    return slots;
  }

  findCommonSlots(availabilityMap: Record<string, AvailabilitySlot[]>, date: string): AvailabilitySlot[] {
    const people = Object.keys(availabilityMap);
    if (people.length === 0) return [];

    const baseSlots = availabilityMap[people[0]];
    return baseSlots.filter((slot) =>
      people.every((person) =>
        availabilityMap[person].some(
          (s) => s.startTime === slot.startTime && s.endTime === slot.endTime
        )
      )
    );
  }
}
