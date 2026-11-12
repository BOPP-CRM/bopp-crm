const TRACE_ID_HEADER = "x-trace-id";
const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;

export const TRACE_REFERENCE_LABEL = "รหัสอ้างอิง";

const TRACE_REFERENCE_SUFFIX = new RegExp(
  ` \\(${TRACE_REFERENCE_LABEL}: ([0-9a-f]{32})\\)$`,
  "i",
);

function traceIdCandidates(value: unknown): string[] {
  if (typeof value === "string") {
    return value.split(",");
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => traceIdCandidates(item));
  }

  return [];
}

export function normalizeTraceId(value: unknown): string | undefined {
  for (const candidate of traceIdCandidates(value)) {
    const traceId = candidate.trim().toLowerCase();
    if (TRACE_ID_PATTERN.test(traceId)) {
      return traceId;
    }
  }

  return undefined;
}

export function readTraceIdFromHeaders(headers: unknown): string | undefined {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }

  const record = headers as { get?: (name: string) => unknown };

  if (typeof record.get === "function") {
    try {
      const fromGetter = normalizeTraceId(record.get(TRACE_ID_HEADER));
      if (fromGetter) return fromGetter;
    } catch {
      // Some header bags throw for an unknown name. Fall through to a
      // case-insensitive scan of the own properties.
    }
  }

  try {
    for (const [key, value] of Object.entries(record)) {
      if (key.toLowerCase() === TRACE_ID_HEADER) {
        const traceId = normalizeTraceId(value);
        if (traceId) return traceId;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function readTraceIdFromError(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const record = error as {
    response?: { headers?: unknown };
    request?: {
      getResponseHeader?: (name: string) => unknown;
      res?: { headers?: unknown };
    };
  };

  const fromResponse = readTraceIdFromHeaders(record.response?.headers);
  if (fromResponse) return fromResponse;

  const request = record.request;
  if (request && typeof request.getResponseHeader === "function") {
    try {
      const fromXhr = normalizeTraceId(
        request.getResponseHeader(TRACE_ID_HEADER),
      );
      if (fromXhr) return fromXhr;
    } catch {
      // XMLHttpRequest throws if the header cannot be read.
    }
  }

  return readTraceIdFromHeaders(request?.res?.headers);
}

export function withTraceReference(
  message: string,
  traceId: string | undefined,
): string {
  const normalized = traceId ? normalizeTraceId(traceId) : undefined;
  if (!normalized) return message;

  const reference = `(${TRACE_REFERENCE_LABEL}: ${normalized})`;
  if (!message) return `เกิดข้อผิดพลาด ${reference}`;
  return `${message} ${reference}`;
}

export function splitTraceReference(message: string): {
  message: string;
  traceId?: string;
} {
  const match = TRACE_REFERENCE_SUFFIX.exec(message);
  if (!match) return { message };

  return {
    message: message.slice(0, match.index),
    traceId: match[1].toLowerCase(),
  };
}
