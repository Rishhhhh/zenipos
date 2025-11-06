/**
 * Shared types for realtime subscriptions
 */

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  schema: string;
  table: string;
  commit_timestamp: string;
}

export interface SubscriptionOptions {
  filter?: string;
  event?: RealtimeEvent;
  enabled?: boolean;
}

export interface RealtimeStats {
  activeChannels: number;
  totalSubscribers: number;
  channelsCreated: number;
  channelsRemoved: number;
  channels: Array<{
    key: string;
    state: string;
    subscribers: number;
  }>;
}
