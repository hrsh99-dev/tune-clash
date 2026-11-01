export function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://localhost:4000';
}

export function getSocketUrl(): string {
  const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envSocketUrl) {
    return envSocketUrl.replace(/\/+$/, '');
  }
  return 'http://localhost:4000';
}
