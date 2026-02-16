/**
 * @fileoverview Utility for handling asset paths in Vite with support for BASE_URL.
 */

/**
 * Prepends the base URL to a given asset path.
 * @param path The relative path to the asset (e.g., "/armor.png").
 * @returns The path with the base URL prepended.
 */
export function getAssetPath(path: string): string {
  // If the path already starts with the base URL (avoid double-prepending)
  // or is an external URL, return as is.
  if (path.startsWith(import.meta.env.BASE_URL) || path.startsWith("http")) {
    return path;
  }

  // Ensure path starts with a slash if it doesn't
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Remove the trailing slash from BASE_URL if it exists to avoid double slashes
  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;

  return `${baseUrl}${normalizedPath}`;
}
