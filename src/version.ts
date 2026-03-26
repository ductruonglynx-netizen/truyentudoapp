export const APP_VERSION_SEMVER = '0.0.0-a';

export function formatAppVersionLabel(version: string): string {
  const normalized = String(version || '').trim().toLowerCase();
  if (normalized === '0.0.0-a') return '0.0a';
  return normalized || 'dev';
}

export const APP_VERSION_LABEL = formatAppVersionLabel(APP_VERSION_SEMVER);
