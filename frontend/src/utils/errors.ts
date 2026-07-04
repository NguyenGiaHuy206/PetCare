type ApiErrorPayload = {
  detail?: unknown;
};

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const responseData = (error as { response?: { data?: ApiErrorPayload } })?.response?.data;
  const detail = responseData?.detail;

  if (isNonEmptyString(detail)) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "msg" in item) {
          const message = (item as { msg?: unknown }).msg;
          return isNonEmptyString(message) ? message : null;
        }

        return null;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(". ");
    }
  }

  if (responseData && typeof responseData === "object" && "message" in responseData) {
    const message = (responseData as { message?: unknown }).message;
    if (isNonEmptyString(message)) {
      return message;
    }
  }

  if (error instanceof Error && isNonEmptyString(error.message)) {
    return error.message;
  }

  return fallback;
}