const CHANNEL = new BroadcastChannel('gp-v21');

export function sendRealtimeEvent(event: any) {
  CHANNEL.postMessage({
    ...event,
    createdAt: new Date().toISOString()
  });
}

export function subscribeRealtimeEvents(callback: (event: any) => void) {
  CHANNEL.onmessage = (message) => callback(message.data);
}
