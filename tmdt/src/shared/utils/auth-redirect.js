export function resolveAuthRedirectPath(status, errorCode) {
  if (status === 401 || errorCode === "AUTH_UNAUTHORIZED") {
    return "/login";
  }

  if (status === 403 || errorCode === "AUTH_FORBIDDEN") {
    return "/forbidden";
  }

  return null;
}
