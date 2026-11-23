import { gitConfig } from "./shared";

/** Compact count: 987 → "987", 1234 → "1.2k". */
export function formatStars(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`;
}

/** Star count read once per build; null if GitHub can't be reached, so the badge is simply omitted. */
async function fetchStars(): Promise<number | null> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch(`https://api.github.com/repos/${gitConfig.user}/${gitConfig.repo}`, {
      headers: {
        accept: "application/vnd.github+json",
        ...(token && { authorization: `Bearer ${token}` }),
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const { stargazers_count } = (await res.json()) as { stargazers_count?: unknown };
    return typeof stargazers_count === "number" ? stargazers_count : null;
  } catch {
    return null;
  }
}

export const stars = await fetchStars();
