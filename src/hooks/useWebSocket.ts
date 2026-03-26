// src/hooks/useWebSocket.ts
import { useState, useEffect, useRef, useCallback } from 'react';

type WebSocketMessageType =
  | 'new_message'
  | 'message_read'
  | 'typing'
  | 'media_message'
  | 'ping'
  | 'pong'
  | 'connect';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  id?: number;
  sender_id?: number;
  receiver_id?: number;
  message?: string;
  message_id?: number;
  is_typing?: boolean;
  reader_id?: number;
  media_type?: 'image' | 'video';
  file_path?: string;
  file_name?: string;
  file_size?: number;
  reply_to_id?: number | null;
  reply_to_message?: any;
  created_at?: string;
}

export const useWebSocket = (userId: number | null, token: string | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get WebSocket URL from environment
  const getWebSocketUrl = useCallback(() => {
    // Use environment variable if available
    const wsUrl = import.meta.env.VITE_WS_URL;
    
    if (wsUrl) {
      return `${wsUrl}/ws?token=${token}`;
    }
    
    // Fallback: construct from current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws?token=${token}`;
  }, [token]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }, []);

  const connect = useCallback(() => {
    if (!userId || !token) {
      console.log('WebSocket: No userId or token, skipping connection');
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = getWebSocketUrl();
    console.log('🔌 WebSocket connecting to:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      wsRef.current = ws;
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket received:', data);
        
        if (data.type === 'pong') return;
        setLastMessage(data);
      } catch (error) {
        console.error('WebSocket: Failed to parse message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      wsRef.current = null;

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Auto-reconnect
      if (userId && token) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 WebSocket reconnecting...');
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [userId, token, getWebSocketUrl, startHeartbeat]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 WebSocket sent:', message);
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
};