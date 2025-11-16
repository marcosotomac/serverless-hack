"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { getToken, isAuthenticated } from "./auth";

// WebSocket configuration
const WS_URL = "wss://z3k9ammp3f.execute-api.us-east-1.amazonaws.com/dev";
const PING_INTERVAL = 30000; // 30 seconds
const RECONNECT_DELAY = 3000; // 3 seconds

// WebSocket message types
export type WebSocketEventType =
  | "incident.created"
  | "incident.updated"
  | "incident.priority"
  | "incident.closed";

export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
}

interface WebSocketContextValue {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (action: string, data?: any) => void;
  subscribe: (callback: (message: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribersRef = useRef<Set<(message: WebSocketMessage) => void>>(
    new Set()
  );
  const shouldConnectRef = useRef(true);

  const connect = () => {
    if (!isAuthenticated() || !shouldConnectRef.current) {
      return;
    }

    const token = getToken();
    if (!token) {
      console.error("No token available for WebSocket connection");
      return;
    }

    try {
      const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
      console.log("Connecting to WebSocket...");

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);

        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: "ping" }));
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("WebSocket message received:", message);

          setLastMessage(message);

          // Notify all subscribers
          subscribersRef.current.forEach((callback) => {
            try {
              callback(message);
            } catch (err) {
              console.error("Error in WebSocket subscriber:", err);
            }
          });
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if we should still be connected
        if (shouldConnectRef.current && isAuthenticated()) {
          console.log(`Reconnecting in ${RECONNECT_DELAY}ms...`);
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };
    } catch (err) {
      console.error("Error creating WebSocket:", err);
    }
  };

  const disconnect = () => {
    shouldConnectRef.current = false;

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  };

  const sendMessage = (action: string, data?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = { action, ...data };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected, cannot send message");
    }
  };

  const subscribe = (callback: (message: WebSocketMessage) => void) => {
    subscribersRef.current.add(callback);

    // Return unsubscribe function
    return () => {
      subscribersRef.current.delete(callback);
    };
  };

  useEffect(() => {
    shouldConnectRef.current = true;
    connect();

    return () => {
      disconnect();
    };
  }, []);

  const value: WebSocketContextValue = {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
