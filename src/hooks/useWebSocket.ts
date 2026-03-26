// src/hooks/useWebSocket.ts
import { useState, useEffect, useRef, useCallback } from 'react';

// ✅ FIX: extend allowed message types (NO function changes)
type WebSocketMessageType =
  | 'new_message'
  | 'message_read'
  | 'typing'
  | 'media_message'
  | 'ping'
  | 'pong'
  | 'connect';

export interface WebSocketMessage {
  type: WebSocketMessageType; // ✅ FIXED HERE
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

// interface WebSocketEvent {
//   type: string;
//   data: any;
// }

export const useWebSocket = (userId: number | null, token: string | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Send heartbeat to keep connection alive
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
    if (!userId || !token) {
      console.log('No userId or token, skipping WebSocket connection');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${token}`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      wsRef.current = ws;
      startHeartbeat();
      
      ws.send(JSON.stringify({
        type: 'connect',
        user_id: userId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data);
        
        switch (data.type) {
          case 'new_message':
          case 'media_message':
          case 'message_read':
          case 'typing':
            setLastMessage(data);
            break;

          case 'pong':
            // heartbeat response
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
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

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (userId && token) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect WebSocket...');
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [userId, token, startHeartbeat]);

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

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
        console.log('📤 WebSocket message sent:', message);
      } else {
        console.warn('WebSocket not connected:', message);
      }
    },
    []
  );

  const sendTyping = useCallback((receiverId: number, isTyping: boolean) => {
    sendMessage({
      type: 'typing',
      receiver_id: receiverId,
      is_typing: isTyping
    });
  }, [sendMessage]);

  const sendReadReceipt = useCallback((messageId: number, readerId: number) => {
    sendMessage({
      type: 'message_read',
      message_id: messageId,
      reader_id: readerId
    });
  }, [sendMessage]);

  const sendNewMessage = useCallback((
    receiverId: number, 
    message: string, 
    messageId: number,
    replyToId?: number | null
  ) => {
    sendMessage({
      type: 'new_message',
      receiver_id: receiverId,
      message,
      id: messageId,
      reply_to_id: replyToId
    });
  }, [sendMessage]);

  const sendMediaMessage = useCallback((
    receiverId: number,
    messageId: number,
    mediaType: 'image' | 'video',
    filePath: string,
    fileName: string,
    fileSize: number
  ) => {
    sendMessage({
      type: 'media_message',
      receiver_id: receiverId,
      id: messageId,
      media_type: mediaType,
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize
    });
  }, [sendMessage]);

  return { 
    isConnected, 
    lastMessage, 
    sendMessage,
    sendTyping,
    sendReadReceipt,
    sendNewMessage,
    sendMediaMessage
  };
};