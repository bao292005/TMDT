export function logInfo(action, data = {}, correlationId = null) {
  const payload = {
    level: "INFO",
    timestamp: new Date().toISOString(),
    action,
    data,
    correlationId: correlationId || "none"
  };
  console.log(JSON.stringify(payload));
}

export function logError(action, error, correlationId = null) {
  const payload = {
    level: "ERROR",
    timestamp: new Date().toISOString(),
    action,
    error: error?.message || error,
    stack: error?.stack,
    correlationId: correlationId || "none"
  };
  console.error(JSON.stringify(payload));
}
