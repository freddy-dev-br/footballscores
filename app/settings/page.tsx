"use client";

import { Suspense, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { useSearchParams } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PROVIDERS_KEY = "/api/wearables";
const STATUS_KEY = "/api/system/status";

interface Provider {
  id: string;
  name: string;
  authType: "oauth" | "file_import" | "unavailable";
  description: string;
  configured: boolean;
  configEnvVars: string[];
  status: string;
  lastSyncAt: string | null;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    connected: "bg-green-100 text-green-700",
    manual_import: "bg-amber-100 text-amber-700",
    disconnected: "bg-gray-100 text-gray-500",
  };
  return map[status] ?? map.disconnected;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-gray-400 text-sm">Loading…</p>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const connectedParam = searchParams.get("connected");
  const wearableError = searchParams.get("wearable_error");

  const { data: providers } = useSWR<Provider[]>(PROVIDERS_KEY, fetcher);
  const { data: status } = useSWR<{ aiConfigured: boolean }>(STATUS_KEY, fetcher);
  const [importMsg, setImportMsg] = useState<Record<string, string>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleFile(providerId: string, kind: "csv_steps" | "csv_sleep" | "apple_health_xml", file: File) {
    const content = await file.text();
    const res = await fetch(`/api/wearables/${providerId}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, content }),
    });
    const data = await res.json();
    setImportMsg((m) => ({
      ...m,
      [providerId]: res.ok
        ? `Imported ${data.stepsImported ?? 0} step day(s), ${data.sleepImported ?? 0} sleep night(s).`
        : data.error ?? "Import failed.",
    }));
    mutate(PROVIDERS_KEY);
  }

  async function syncNow(providerId: string) {
    const res = await fetch(`/api/wearables/${providerId}/sync`, { method: "POST" });
    const data = await res.json();
    setImportMsg((m) => ({
      ...m,
      [providerId]: res.ok
        ? `Synced ${data.stepsSynced ?? 0} step day(s), ${data.sleepSynced ?? 0} sleep night(s).`
        : data.error ?? "Sync failed.",
    }));
    mutate(PROVIDERS_KEY);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Connect wearables and check AI configuration.</p>
      </div>

      {connectedParam && (
        <p className="text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg p-3">
          {connectedParam} connected successfully.
        </p>
      )}
      {wearableError && (
        <p className="text-sm bg-rose-50 text-rose-700 border border-rose-200 rounded-lg p-3">
          Connection failed ({wearableError}). Double-check your OAuth app's redirect URI matches this app's callback URL.
        </p>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-1">AI (OpenAI)</h2>
        {status?.aiConfigured ? (
          <p className="text-sm text-green-700">✓ OPENAI_API_KEY is set — food photo analysis and coaching advice are live.</p>
        ) : (
          <p className="text-sm text-amber-700">
            Not configured. Add <code className="bg-gray-100 px-1 rounded">OPENAI_API_KEY</code> to{" "}
            <code className="bg-gray-100 px-1 rounded">.env.local</code> to enable AI food analysis and coaching tips.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Wearables</h2>
        {providers?.map((p) => (
          <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{p.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>
                {p.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500">{p.description}</p>

            {p.authType === "oauth" && (
              <div className="flex items-center gap-3">
                {p.configured ? (
                  <>
                    <a
                      href={`/api/wearables/${p.id}/connect`}
                      className="text-sm bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-800"
                    >
                      {p.status === "connected" ? "Reconnect" : "Connect"}
                    </a>
                    {p.status === "connected" && (
                      <button
                        onClick={() => syncNow(p.id)}
                        className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Sync now
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-amber-700">
                    Requires{" "}
                    {p.configEnvVars.map((v) => (
                      <code key={v} className="bg-gray-100 px-1 rounded mr-1">
                        {v}
                      </code>
                    ))}
                    in .env.local.
                  </p>
                )}
              </div>
            )}

            {p.authType === "file_import" && (
              <div>
                <input
                  ref={(el) => {
                    fileInputs.current[p.id] = el;
                  }}
                  type="file"
                  accept=".xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(p.id, "apple_health_xml", file);
                  }}
                />
                <button
                  onClick={() => fileInputs.current[p.id]?.click()}
                  className="text-sm bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-800"
                >
                  Upload export.xml
                </button>
              </div>
            )}

            {p.authType !== "unavailable" && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer">Or import a CSV (date,count for steps / date,start,end for sleep)</summary>
                <div className="flex gap-3 mt-2">
                  <label className="text-indigo-600 cursor-pointer hover:underline">
                    steps.csv
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(p.id, "csv_steps", file);
                      }}
                    />
                  </label>
                  <label className="text-indigo-600 cursor-pointer hover:underline">
                    sleep.csv
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(p.id, "csv_sleep", file);
                      }}
                    />
                  </label>
                </div>
              </details>
            )}

            {importMsg[p.id] && <p className="text-xs text-gray-600">{importMsg[p.id]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
