
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'reggie';
}

export type AssistantStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Timer {
    id: number;
    label: string | null;
    initialDuration: number; // in seconds
    endTime: number; // timestamp
}

export interface ScheduledEvent {
    id: number;
    label: string | null;
    subject?: string;
    triggerTime: number; // timestamp
    type: 'alarm' | 'reminder';
}
