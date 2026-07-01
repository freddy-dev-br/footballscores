"use client";

import { useState, useRef } from "react";

interface WatchData {
  steps?: number;
  heartRate?: number;
  device?: string;
}

interface WatchConnectProps {
  onData?: (data: WatchData) => void;
}

type BLEServer = {
  getPrimaryService: (service: string) => Promise<BLEService>;
  disconnect: () => void;
};

type BLEService = {
  getCharacteristic: (char: string) => Promise<BLECharacteristic>;
};

type BLECharacteristic = {
  startNotifications: () => Promise<BLECharacteristic>;
  addEventListener: (event: string, handler: (e: Event) => void) => void;
  removeEventListener: (event: string, handler: (e: Event) => void) => void;
};

type BLEDevice = {
  name?: string;
  gatt?: {
    connect: () => Promise<BLEServer>;
  };
  addEventListener: (event: string, handler: () => void) => void;
};

export default function WatchConnect({ onData }: WatchConnectProps) {
  const [connected, setConnected] = useState(false);
  const [device, setDevice] = useState<string | null>(null);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const serverRef = useRef<BLEServer | null>(null);
  const hrHandlerRef = useRef<((e: Event) => void) | null>(null);
  const hrCharRef = useRef<BLECharacteristic | null>(null);

  const supported = typeof navigator !== "undefined" && "bluetooth" in navigator;

  function parseHeartRate(value: DataView): number {
    const flags = value.getUint8(0);
    // Bit 0: 0 = UINT8 format, 1 = UINT16 format
    return flags & 0x01 ? value.getUint16(1, true) : value.getUint8(1);
  }

  async function connect() {
    if (!supported) {
      setError("Web Bluetooth is not supported in this browser. Try Chrome on Android or desktop.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const nav = navigator as unknown as {
        bluetooth: {
          requestDevice: (opts: unknown) => Promise<BLEDevice>;
        };
      };

      const bleDevice = await nav.bluetooth.requestDevice({
        filters: [
          { services: ["heart_rate"] },
          { services: ["fitness_machine"] },
        ],
        optionalServices: ["heart_rate", "battery_service", "device_information"],
      });

      const deviceName = bleDevice.name || "Unknown Device";
      setDevice(deviceName);

      if (!bleDevice.gatt) {
        setError("Device does not support GATT");
        return;
      }

      const server = await bleDevice.gatt.connect();
      serverRef.current = server;

      // Read heart rate characteristic and subscribe to notifications
      try {
        const hrService = await server.getPrimaryService("heart_rate");
        const hrChar = await hrService.getCharacteristic("heart_rate_measurement");
        hrCharRef.current = hrChar;

        const handler = (event: Event) => {
          const e = event as Event & { target: { value: DataView } };
          const bpm = parseHeartRate(e.target.value);
          setHeartRate(bpm);
          onData?.({ device: deviceName, heartRate: bpm });
        };
        hrHandlerRef.current = handler;
        hrChar.addEventListener("characteristicvaluechanged", handler);
        await hrChar.startNotifications();
      } catch {
        // Device may not support heart rate service — still mark as connected
      }

      setConnected(true);
      onData?.({ device: deviceName });

      // Handle unexpected disconnect
      bleDevice.addEventListener("gattserverdisconnected", () => {
        setConnected(false);
        setHeartRate(null);
      });
    } catch (err) {
      if ((err as Error).name !== "NotFoundError") {
        setError((err as Error).message || "Failed to connect");
      }
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    if (hrCharRef.current && hrHandlerRef.current) {
      hrCharRef.current.removeEventListener("characteristicvaluechanged", hrHandlerRef.current);
    }
    serverRef.current?.disconnect();
    serverRef.current = null;
    hrCharRef.current = null;
    hrHandlerRef.current = null;
    setConnected(false);
    setDevice(null);
    setHeartRate(null);
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⌚</span>
          <div>
            <p className="text-sm font-medium text-white">Smart Watch</p>
            {connected && device ? (
              <p className="text-xs text-green-400">{device} connected</p>
            ) : (
              <p className="text-xs text-gray-500">
                {supported ? "Bluetooth LE compatible" : "Not supported in this browser"}
              </p>
            )}
          </div>
        </div>
        {connected ? (
          <button
            onClick={disconnect}
            className="text-xs px-3 py-1.5 bg-red-900/60 text-red-400 hover:bg-red-900 border border-red-700/50 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={connecting || !supported}
            className="text-xs px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            {connecting ? "Connecting…" : "Connect"}
          </button>
        )}
      </div>

      {connected && heartRate !== null && (
        <div className="mt-3 flex items-center gap-2 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
          <span className="text-red-400">❤</span>
          <span className="text-sm text-white font-semibold">{heartRate} <span className="text-xs text-gray-400 font-normal">bpm</span></span>
          <span className="text-xs text-gray-500 ml-auto">Live</span>
        </div>
      )}

      {connected && heartRate === null && (
        <p className="mt-2 text-xs text-gray-500">Waiting for heart rate data…</p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
      )}
      {!supported && (
        <p className="mt-2 text-xs text-amber-400">
          Use Chrome on Android or desktop for Bluetooth support. Alternatively, log data manually.
        </p>
      )}
    </div>
  );
}
