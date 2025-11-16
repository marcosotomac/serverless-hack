"use client";

import { useWebSocket } from "@/lib/websocket";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const { isConnected } = useWebSocket();

  return (
    <Badge
      variant={isConnected ? "default" : "secondary"}
      className="flex items-center gap-1 shrink-0"
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="text-[10px] sm:text-xs hidden xs:inline">Conectado</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="text-[10px] sm:text-xs hidden xs:inline">Desconectado</span>
        </>
      )}
    </Badge>
  );
}
