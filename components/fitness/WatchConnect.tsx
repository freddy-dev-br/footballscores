"use client";

import { useState } from "react";

interface WatchData {
  steps?: number;
  heartRate?: number;
  device?: string;
}

interface WatchConnectProps {
  onData?: (data: WatchData) => void;
}

export default function WatchConnect({ onData }: WatchConnectProps) {
  const [connected, setConnected] = useState(false);
  const [device, setDevice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const supported = typeof navigator !== "undefined" && "bluetooth" in navigator;

  async function connect() {
    if (!supported) {
      setError("Web Bluetooth is not supported in this browser. Try Chrome on Android.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      // Request a BLE device - fitness trackers commonly advertise heart rate and step counter services
      const bleDevice = await (navigator as unknown as { bluetooth: { requestDevice: (opts: unknown) => Promise<{ name?: string; gatt?: { connect: () => Promise<unknown> } }> } }).bluetooth.requestDevice({
        filters: [
          { services: ["heart_rate"] },
          { services: ["fitness_machine"] },
        ],
        optionalServices: ["battery_service", "device_information"],
      });

      setDevice(bleDevice.name || "Unknown Device");

      if (bleDevice.gatt) {
        await bleDevice.gatt.connect();
        setConnected(true);
        onData?.({ device: bleDevice.name || "Watch" });
      }
    } catch (err) {
      if ((err as Error).name !== "NotFoundError") {
        setError((err as Error).message || "Failed to connect");
      }
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    setConnected(false);
    setDevice(null);
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
