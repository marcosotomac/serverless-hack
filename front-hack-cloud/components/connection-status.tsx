"use client";

import { useWebSocket } from "@/lib/websocket";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const { isConnected } = useWebSocket();

  return (
    <Badge
      variant={isConnected ? "default" : "secondary"}
      className="flex items-center gap-1"
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span className="text-xs">Conectado</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span className="text-xs">Desconectado</span>
        </>
      )}
    </Badge>
  );
}
