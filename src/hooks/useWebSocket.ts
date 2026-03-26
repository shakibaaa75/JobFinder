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
  const isConnectingRef = useRef(false);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }, []);

  const connect = useCallback(() => {
    if (isConnectingRef.current) {
      console.log('WebSocket: Already connecting, skipping...');
      return;
    }

    if (!userId || !token) {
      console.log('WebSocket: No userId or token, skipping connection');
      return;
    }

    isConnectingRef.current = true;

    // DEPLOYMENT FIX: Use environment variable or auto-detect protocol
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws?token=${encodeURIComponent(token)}`;
    
    console.log('WebSocket: Connecting to', wsUrl, 'Protocol:', wsProtocol);
    
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        wsRef.current = ws;
        isConnectingRef.current = false;
        startHeartbeat();
        
        ws.send(JSON.stringify({
          type: 'connect',
          user_id: userId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          if (data.type === 'pong') {
            return;
          }

          console.log('📨 WebSocket received:', data);
          setLastMessage(data);
        } catch (error) {
          console.error('WebSocket: Failed to parse message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        isConnectingRef.current = false;

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Auto-reconnect after 5 seconds (longer for production)
        if (userId && token) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 WebSocket reconnecting...');
            connect();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnectingRef.current = false;
      };
    } catch (error) {
      console.error('WebSocket: Failed to create connection:', error);
      isConnectingRef.current = false;
    }
  }, [userId, token, startHeartbeat]);

  useEffect(() => {
    if (userId && token) {
      connect();
    }

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
  }, [connect, userId, token]);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
        console.log('📤 WebSocket sent:', message);
      } else {
        console.warn('WebSocket not connected, message not sent:', message);
      }
    },
    []
  );

  return { 
    isConnected, 
    lastMessage, 
    sendMessage
  };
};