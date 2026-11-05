import { headers } from "next/headers";

const FALLBACK_ORIGIN = process.env.NEXT_PUBLIC_BASE_URL || "https://jaayma.sn";

/** Build public URLs from the domain that actually served this request. */
export async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host")?.trim();

  if (host && /^[a-z\d.[\]:-]+$/i.test(host)) {
    const isLocalHost = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(host);
    const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = isLocalHost
      ? (forwardedProtocol === "https" ? "https" : "http")
      : "https";

    try {
      return new URL(`${protocol}://${host}`).origin;
    } catch {
      // Fall through to the configured canonical origin if the host is malformed.
    }
  }

  try {
    return new URL(FALLBACK_ORIGIN).origin;
  } catch {
    return "https://jaayma.sn";
  }
}
