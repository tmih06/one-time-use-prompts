import { EmbeddedTweet } from "react-tweet";
import type { Tweet } from "react-tweet/api";

/**
 * Static tweet cards for catalog `source` URLs, rendered at build time from
 * data fetched in the page frontmatter — no Twitter JS ships to the browser.
 */
export function TweetCards({ tweets }: { tweets: Tweet[] }) {
  if (tweets.length === 0) return null;
  return (
    <div className="not-prose mt-10 mb-5 flex flex-col gap-3">
      <span className="text-xs font-medium uppercase tracking-wider text-fd-muted-foreground">
        Source
      </span>
      {tweets.map((tweet) => (
        <div key={tweet.id_str} className="react-tweet-theme tweet-card">
          <EmbeddedTweet tweet={tweet} />
        </div>
      ))}
    </div>
  );
}
