import { WearableProvider } from "./types";

// Apple Health has no public cloud API — Apple only exposes HealthKit data
// on-device. The standard way to get it into a web app is exporting
// "export.xml" from the Health app (Profile → Export All Health Data) and
// uploading it here, which we parse below.
export const appleHealthProvider: WearableProvider = {
  id: "apple_health",
  name: "Apple Health",
  authType: "file_import",
  configEnvVars: [],
  description:
    "No cloud API exists for Apple Health. Export your data from the Health app (Profile → Export All Health Data) and upload the export.xml file to import steps and sleep.",
  isConfigured() {
    return true; // always available — it's a file import, not OAuth
  },
};

interface ParsedHealthData {
  steps: { date: string; count: number }[];
  sleep: { date: string; start: string; end: string; durationMinutes: number }[];
}

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : null;
}

function toDateKey(appleDate: string): string {
  // Apple format: "2026-08-18 07:32:00 -0700" -> use the calendar date portion
  return appleDate.slice(0, 10);
}

export function parseAppleHealthExport(xml: string): ParsedHealthData {
  const stepsByDate = new Map<string, number>();
  const sleepSessions: ParsedHealthData["sleep"] = [];

  const recordRegex = /<Record\b[^>]*>/g;
  let match: RegExpExecArray | null;
  while ((match = recordRegex.exec(xml))) {
    const tag = match[0];
    const type = attr(tag, "type");
    if (type === "HKQuantityTypeIdentifierStepCount") {
      const startDate = attr(tag, "startDate");
      const value = attr(tag, "value");
      if (startDate && value) {
        const date = toDateKey(startDate);
        stepsByDate.set(date, (stepsByDate.get(date) ?? 0) + Math.round(parseFloat(value)));
      }
    } else if (type === "HKCategoryTypeIdentifierSleepAnalysis") {
      const startDate = attr(tag, "startDate");
      const endDate = attr(tag, "endDate");
      const value = attr(tag, "value") ?? "";
      const isAsleep = /Asleep/i.test(value);
      if (startDate && endDate && isAsleep) {
        const durationMinutes = Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / 60000
        );
        if (durationMinutes > 0) {
          sleepSessions.push({ date: toDateKey(startDate), start: startDate, end: endDate, durationMinutes });
        }
      }
    }
  }

  // Merge same-night sleep fragments into one session per date, summing duration.
  const sleepByDate = new Map<string, { start: string; end: string; durationMinutes: number }>();
  for (const s of sleepSessions) {
    const existing = sleepByDate.get(s.date);
    if (!existing) {
      sleepByDate.set(s.date, { start: s.start, end: s.end, durationMinutes: s.durationMinutes });
    } else {
      existing.durationMinutes += s.durationMinutes;
      if (new Date(s.end) > new Date(existing.end)) existing.end = s.end;
      if (new Date(s.start) < new Date(existing.start)) existing.start = s.start;
    }
  }

  return {
    steps: Array.from(stepsByDate.entries()).map(([date, count]) => ({ date, count })),
    sleep: Array.from(sleepByDate.entries()).map(([date, v]) => ({ date, ...v })),
  };
}
