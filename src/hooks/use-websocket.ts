"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WS_URL } from "@/lib/constants";
import { useNotificationStore } from "@/stores/notification-store";
import { Notification } from "@/types";

interface WebSocketMessage {
  type: string;
  payload: unknown;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const addNotification = useNotificationStore((s) => s.addNotification);

  const send = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === "string" ? message : JSON.stringify(message));
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      setIsConnected(true);
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);

        switch (message.type) {
          case "notification":
          case "new_notification":
            addNotification(message.payload as Notification);
            break;
          case "circle_update":
          case "circle.invite":
          case "circle.contribution":
          case "circle.payout":
            // Handled by React Query invalidation in circle hooks or via event bus
            break;
          default:
            break;
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [addNotification]);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;

    const attempts = reconnectAttemptRef.current + 1;
    reconnectAttemptRef.current = attempts;

    const delay = Math.min(1000 * Math.pow(2, attempts - 1), 30000);

    reconnectTimerRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastMessage,
    send,
  };
}
