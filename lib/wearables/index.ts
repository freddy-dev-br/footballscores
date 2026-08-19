import { WearableProvider } from "./types";
import { fitbitProvider } from "./fitbit";
import { googleFitProvider } from "./google-fit";
import { appleHealthProvider } from "./apple-health";

// Garmin has no self-serve OAuth signup — the Garmin Health API requires a
// negotiated partner agreement, so we surface it as an option without
// pretending it's connectable yet.
const garminProvider: WearableProvider = {
  id: "garmin",
  name: "Garmin",
  authType: "unavailable",
  configEnvVars: [],
  description:
    "Garmin's Health API requires a negotiated partner agreement (no self-serve developer signup), so it can't be wired up like Fitbit/Google Fit. Use manual entry or export via Garmin Connect's data export in the meantime.",
  isConfigured() {
    return false;
  },
};

export const WEARABLE_PROVIDERS: Record<string, WearableProvider> = {
  fitbit: fitbitProvider,
  google_fit: googleFitProvider,
  apple_health: appleHealthProvider,
  garmin: garminProvider,
};

export { parseAppleHealthExport } from "./apple-health";

export function parseCsvSteps(csv: string): { date: string; count: number }[] {
  const lines = csv.trim().split(/\r?\n/);
  const out: { date: string; count: number }[] = [];
  for (const line of lines) {
    const [date, countStr] = line.split(",").map((s) => s.trim());
    if (!date || !countStr || date.toLowerCase() === "date") continue;
    const count = parseInt(countStr, 10);
    if (!isNaN(count) && /^\d{4}-\d{2}-\d{2}$/.test(date)) out.push({ date, count });
  }
  return out;
}

export function parseCsvSleep(csv: string): { date: string; start: string; end: string; durationMinutes: number }[] {
  const lines = csv.trim().split(/\r?\n/);
  const out: { date: string; start: string; end: string; durationMinutes: number }[] = [];
  for (const line of lines) {
    const [date, start, end] = line.split(",").map((s) => s.trim());
    if (!date || !start || !end || date.toLowerCase() === "date") continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) continue;
    out.push({ date, start, end, durationMinutes: Math.round((endMs - startMs) / 60000) });
  }
  return out;
}
