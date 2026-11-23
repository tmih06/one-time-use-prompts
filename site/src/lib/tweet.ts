import { getTweet } from "react-tweet/api";
import type { Tweet } from "react-tweet/api";

/** Numeric status ID for x.com / twitter.com status URLs, else undefined. */
export function tweetIdFromUrl(url: string): string | undefined {
  try {
    const u = new URL(url);
    if (!/(^|\.)(x\.com|twitter\.com)$/.test(u.hostname)) return;
    return u.pathname.match(/\/status(?:es)?\/(\d+)/)?.[1];
  } catch {
    return;
  }
}

/**
 * Fetch every tweet referenced by `urls` at build time. Tweets that are
 * deleted, protected, or fail to fetch are skipped — the caller falls back
 * to the plain source chip for them.
 */
export async function fetchTweets(urls: string[] = []): Promise<Tweet[]> {
  const ids = [...new Set(urls.map(tweetIdFromUrl).filter((id): id is string => !!id))];
  const tweets = await Promise.all(ids.map((id) => getTweet(id).catch(() => undefined)));
  return tweets.filter((t): t is Tweet => !!t);
}
