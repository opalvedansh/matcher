import { io, Socket } from 'socket.io-client';
import { supabase } from '../supabase';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ─── Fix 2: Physical Device Networking ────────────────────────────
// On native (physical phone via Expo Go), `localhost` resolves to the phone
// itself. We instead use the Expo dev server host (your Mac's LAN IP).
// On web or in production, we fall back to the env variable or localhost.
function getBaseUrl(): string {
  if (__DEV__ && Platform.OS !== 'web') {
    // expo-constants gives us the host of the Metro bundler (your Mac's IP)
    const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
    const host = debuggerHost?.split(':')[0] ?? 'localhost';
    return `http://${host}:4000`;
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
}

const SOCKET_URL = getBaseUrl();

type StatusListener = (connected: boolean) => void;

class SocketService {
  private socket: Socket | null = null;
  private currentMatchId: string | null = null;
  // Fix 4: Track connection status for UI awareness
  private statusListeners: Set<StatusListener> = new Set();
  private isConnected: boolean = false;

  private notifyStatus(connected: boolean) {
    this.isConnected = connected;
    this.statusListeners.forEach((fn) => fn(connected));
  }

  /**
   * Connects to the WebSocket server using the current Supabase JWT token.
   */
  async connect() {
    if (this.socket?.connected) return;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      console.warn('[Socket] No valid session token available');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server:', this.socket?.id);
      this.notifyStatus(true);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection Error:', err.message);
      this.notifyStatus(false);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.notifyStatus(false);
    });
    
    this.socket.on('error', (err) => {
      console.error('[Socket] Server Error:', err);
    });
  }

  /**
   * Fix 3: Updates the auth token and reconnects if necessary.
   * Called every time Supabase refreshes the JWT (happens hourly).
   */
  updateToken(newToken: string) {
    if (!this.socket) return;
    // Update the auth token on the socket instance
    this.socket.auth = { token: newToken };
    // If the socket is currently disconnected, try to reconnect with the fresh token
    if (!this.socket.connected) {
      console.log('[Socket] Reconnecting with refreshed token...');
      this.socket.connect();
    }
  }

  /**
   * Fix 4: Subscribe to connection status changes.
   * Returns an unsubscribe function.
   */
  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    // Immediately emit current status to new subscribers
    listener(this.isConnected);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Joins a specific match room to receive messages.
   */
  joinMatch(matchId: string) {
    if (!this.socket?.connected) return;
    this.currentMatchId = matchId;
    this.socket.emit('join_match', matchId);
    console.log(`[Socket] Joined match room: ${matchId}`);
  }

  /**
   * Sends a message to the currently joined match.
   */
  sendMessage(matchId: string, content: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('send_message', { matchId, content });
  }

  /**
   * Listens for incoming messages.
   */
  onReceiveMessage(callback: (message: any) => void) {
    if (!this.socket) return;
    this.socket.on('receive_message', callback);
  }

  /**
   * Removes message listener.
   */
  offReceiveMessage(callback: (message: any) => void) {
    if (!this.socket) return;
    this.socket.off('receive_message', callback);
  }

  /**
   * Disconnects the socket completely.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentMatchId = null;
      this.notifyStatus(false);
    }
  }
}

export const socketService = new SocketService();
