import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { handlerError } from "./api-error";
import {
  readTraceIdFromError,
  readTraceIdFromHeaders,
  splitTraceReference,
  withTraceReference,
} from "./trace-id";

const TRACE_ID = "4bf92f3577b34da6a3ce929d0e0e4736";
const TRACE_ID_UPPER = TRACE_ID.toUpperCase();

let consoleError: ReturnType<typeof mock.method>;

beforeEach(() => {
  consoleError = mock.method(console, "error", () => {});
});

afterEach(() => {
  mock.restoreAll();
});

function axiosError(options: {
  message?: string;
  code?: string;
  status?: number;
  data?: unknown;
  headers?: unknown;
  request?: unknown;
  includeResponse?: boolean;
}): AxiosError {
  const message = options.message ?? "Request failed";
  const includeResponse =
    options.includeResponse ??
    (options.status !== undefined ||
      options.data !== undefined ||
      options.headers !== undefined);

  if (!includeResponse) {
    return new AxiosError(
      message,
      options.code ?? "ERR_NETWORK",
      undefined,
      options.request,
    );
  }

  const config = {
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig;
  const response = {
    data: options.data,
    status: options.status ?? 0,
    statusText: "Error",
    headers: options.headers ?? {},
    config,
    request: options.request,
  } as AxiosResponse;

  return new AxiosError(
    message,
    options.code ?? "ERR_BAD_RESPONSE",
    config,
    options.request,
    response,
  );
}

test("reads x-trace-id case-insensitively and normalizes it", () => {
  assert.equal(
    readTraceIdFromHeaders({ "X-Trace-Id": `  ${TRACE_ID_UPPER}  ` }),
    TRACE_ID,
  );
  assert.equal(
    readTraceIdFromHeaders(new AxiosHeaders({ "X-Trace-Id": TRACE_ID_UPPER })),
    TRACE_ID,
  );
  assert.equal(
    readTraceIdFromHeaders(new Headers({ "X-Trace-Id": TRACE_ID })),
    TRACE_ID,
  );
  assert.equal(
    readTraceIdFromHeaders({
      get(name: string) {
        return name === "X-Trace-Id" ? TRACE_ID_UPPER : undefined;
      },
      "X-Trace-Id": TRACE_ID_UPPER,
    }),
    TRACE_ID,
  );
});

test("ignores missing, empty, and non-trace header values", () => {
  assert.equal(readTraceIdFromHeaders(undefined), undefined);
  assert.equal(readTraceIdFromHeaders({}), undefined);
  assert.equal(readTraceIdFromHeaders({ "x-trace-id": "" }), undefined);
  assert.equal(readTraceIdFromHeaders({ "x-trace-id": "   " }), undefined);
  assert.equal(readTraceIdFromHeaders({ "x-trace-id": "abc" }), undefined);
  assert.equal(
    readTraceIdFromHeaders({ "x-trace-id": `${TRACE_ID}ff` }),
    undefined,
  );
  assert.equal(
    readTraceIdFromHeaders({ "x-trace-id": "g".repeat(32) }),
    undefined,
  );
  assert.equal(
    readTraceIdFromHeaders({ "x-request-id": TRACE_ID }),
    undefined,
  );
  assert.equal(
    readTraceIdFromHeaders({ "x-trace-id": ["nope", TRACE_ID_UPPER] }),
    TRACE_ID,
  );
});

test("reads a trace id from a network error that still has a response", () => {
  const error = axiosError({
    message: "Network Error",
    code: "ERR_NETWORK",
    status: 0,
    headers: {},
    request: {
      getResponseHeader(name: string) {
        if (name.toLowerCase() !== "x-trace-id") {
          throw new Error("not available");
        }
        return TRACE_ID_UPPER;
      },
    },
  });

  assert.equal(readTraceIdFromError(error), TRACE_ID);
});

test("prefers the response header over the request fallback", () => {
  const error = axiosError({
    status: 502,
    headers: { "x-trace-id": TRACE_ID },
    request: {
      res: {
        headers: { "x-trace-id": "a".repeat(32) },
      },
    },
  });

  assert.equal(readTraceIdFromError(error), TRACE_ID);
});

test("keeps today's error text when the trace header is missing", () => {
  const session = handlerError(axiosError({ status: 403, data: {} }));
  assert.deepEqual(session, {
    error: "session_expired",
    message: "Session expired. Please login again.",
  });
  assert.equal(session.message.includes("รหัสอ้างอิง"), false);

  const payload = handlerError(
    axiosError({
      status: 400,
      data: { error: "invalid_phone", message: "เบอร์โทรไม่ถูกต้อง" },
    }),
  );
  assert.deepEqual(payload, {
    error: "invalid_phone",
    message: "เบอร์โทรไม่ถูกต้อง",
  });

  const fallback = handlerError(
    axiosError({
      message: "Request failed with status code 500",
      status: 500,
      data: {},
    }),
  );
  assert.deepEqual(fallback, {
    error: "Request failed with status code 500",
    message: "Request failed with status code 500",
  });

  const network = handlerError(
    axiosError({ message: "Network Error", includeResponse: false }),
  );
  assert.deepEqual(network, {
    error: "Network Error",
    message: "Network Error",
  });

  assert.deepEqual(handlerError(new Error("boom")), {
    error: "unkmown",
    message: "An unknow error occurred. try again!",
  });
  assert.equal(consoleError.mock.calls.length, 0);
});

test("appends the trace id to HTTP, payload, and network errors and logs it", () => {
  const expired = handlerError(
    axiosError({
      status: 403,
      data: { error: "forbidden", message: "หมดอายุ" },
      headers: new AxiosHeaders({ "X-Trace-Id": TRACE_ID_UPPER }),
    }),
  );
  assert.deepEqual(expired, {
    error: "session_expired",
    message: `Session expired. Please login again. (รหัสอ้างอิง: ${TRACE_ID})`,
  });

  const payload = handlerError(
    axiosError({
      status: 422,
      data: { error: "invalid_phone", message: "เกิดข้อผิดพลาด" },
      headers: { "X-Trace-Id": TRACE_ID },
    }),
  );
  assert.equal(payload.error, "invalid_phone");
  assert.equal(
    payload.message,
    `เกิดข้อผิดพลาด (รหัสอ้างอิง: ${TRACE_ID})`,
  );

  const network = handlerError(
    axiosError({
      message: "Network Error",
      code: "ERR_NETWORK",
      status: 0,
      data: "",
      headers: { "x-trace-id": TRACE_ID },
    }),
  );
  assert.deepEqual(network, {
    error: "Network Error",
    message: `Network Error (รหัสอ้างอิง: ${TRACE_ID})`,
  });

  assert.equal(consoleError.mock.calls.length, 3);
  for (const call of consoleError.mock.calls) {
    assert.match(String(call.arguments[0]), new RegExp(TRACE_ID));
    assert.equal(typeof call.arguments[1], "object");
  }
});

test("does not invent a reference for an invalid header or a non-string payload", () => {
  const invalid = handlerError(
    axiosError({
      status: 500,
      data: { error: "oops", message: "เกิดข้อผิดพลาด" },
      headers: { "x-trace-id": "not-a-trace" },
    }),
  );
  assert.equal(invalid.message, "เกิดข้อผิดพลาด");

  const nonString = handlerError(
    axiosError({
      status: 500,
      data: { error: "oops", message: 12 },
      headers: { "x-trace-id": TRACE_ID },
    }),
  );
  assert.equal(nonString.message, 12);
  assert.equal(consoleError.mock.calls.length, 1);
});

test("round-trips the reference for the alert dialog", () => {
  const original = "เกิดข้อผิดพลาด";
  assert.equal(withTraceReference(original, undefined), original);

  const formatted = withTraceReference(original, TRACE_ID_UPPER);
  assert.equal(formatted, `เกิดข้อผิดพลาด (รหัสอ้างอิง: ${TRACE_ID})`);

  const split = splitTraceReference(formatted);
  assert.deepEqual(split, { message: original, traceId: TRACE_ID });
  assert.deepEqual(splitTraceReference("เบอร์โทรไม่ถูกต้อง"), {
    message: "เบอร์โทรไม่ถูกต้อง",
  });
  assert.equal(withTraceReference("", TRACE_ID), formatted);
});
