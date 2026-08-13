import { useEffect, useState } from 'react';
import { socketService } from '../api/socket';

/**
 * useSocketStatus
 *
 * A React hook that exposes the real-time WebSocket connection status.
 * Components can use this to show "Reconnecting..." banners or disable
 * the send button when the connection is lost.
 *
 * @returns `isConnected` — true when the WebSocket is live, false otherwise.
 *
 * @example
 * const { isConnected } = useSocketStatus();
 * if (!isConnected) return <Text>Reconnecting...</Text>;
 */
export function useSocketStatus(): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe and get back the unsubscribe function
    const unsubscribe = socketService.onStatusChange(setIsConnected);
    return unsubscribe;
  }, []);

  return { isConnected };
}
