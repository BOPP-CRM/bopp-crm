export type FormatDateInput = string | number | Date | null | undefined;

export type FormatDateOptions = {
  locale?: string;
  fallback?: string;
  formatOptions?: Intl.DateTimeFormatOptions;
};

function toDate(value: FormatDateInput): Date | null {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const dateFromNumber = new Date(value);
    return Number.isNaN(dateFromNumber.getTime()) ? null : dateFromNumber;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  // Support API format: "YYYY-MM-DD HH:mm:ss" as UTC
  const normalizedValue = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
    trimmedValue,
  )
    ? `${trimmedValue.replace(" ", "T")}Z`
    : trimmedValue;

  const dateFromString = new Date(normalizedValue);
  return Number.isNaN(dateFromString.getTime()) ? null : dateFromString;
}

export function formatDate(
  value: FormatDateInput,
  options: FormatDateOptions = {},
  hasTime: boolean = false,
): string {
  const {
    locale = "th-TH",
    fallback = "-",
    formatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  } = options;

  if (hasTime) {
    formatOptions.hour = "2-digit";
    formatOptions.minute = "2-digit";
  }

  const date = toDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}
