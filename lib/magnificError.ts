function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function validationDetails(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const source = payload as Record<string, unknown>;
  const candidates = [source.errors, source.details, source.detail];
  const entries = candidates.find(Array.isArray) as unknown[] | undefined;
  if (!entries) return [];

  return entries.flatMap((entry) => {
    if (typeof entry === "string") return [entry];
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const location = Array.isArray(item.loc)
      ? item.loc.filter((part) => typeof part === "string" || typeof part === "number").join(".")
      : stringValue(item.field) ?? stringValue(item.path);
    const message = stringValue(item.msg) ?? stringValue(item.message) ?? stringValue(item.error);
    return message ? [`${location ? `${location}: ` : ""}${message}`] : [];
  }).slice(0, 3);
}

/** Return useful validation detail without echoing request bodies or signed URLs. */
export function magnificErrorMessage(payload: unknown, fallbackText = ""): string {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const primary = stringValue(source.message)
    ?? stringValue(source.error)
    ?? (typeof source.detail === "string" ? stringValue(source.detail) : undefined)
    ?? stringValue(fallbackText.slice(0, 500))
    ?? "request failed";
  const details = validationDetails(payload);
  return details.length > 0 ? `${primary}: ${details.join("; ")}` : primary;
}
