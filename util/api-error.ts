import axios from "axios";
import type { ErrorResponse } from "../types/request";
import { readTraceIdFromError, withTraceReference } from "./trace-id";

export const handlerError = (error: unknown): ErrorResponse => {
  if (axios.isAxiosError(error)) {
    const traceId = readTraceIdFromError(error);
    if (traceId) {
      console.error(`API error (รหัสอ้างอิง: ${traceId})`, error);
    }

    if (error.status === 403) {
      return {
        error: "session_expired",
        message: withTraceReference(
          "Session expired. Please login again.",
          traceId,
        ),
      };
    } else if (
      error.response &&
      error.response.data &&
      error.response.data.message
    ) {
      const payloadMessage = error.response.data.message;
      return {
        error: error.response.data.error,
        message:
          typeof payloadMessage === "string"
            ? withTraceReference(payloadMessage, traceId)
            : payloadMessage,
      };
    } else {
      return {
        error: error.message,
        message: withTraceReference(error.message, traceId),
      };
    }
  } else {
    return {
      error: "unkmown",
      message: "An unknow error occurred. try again!",
    };
  }
};
