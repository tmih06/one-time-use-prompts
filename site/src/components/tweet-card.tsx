import { BadgeCheck, Heart, MessageCircle } from "lucide-react";
import type { Tweet } from "react-tweet/api";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Tweet body without the trailing t.co links X appends for media and quotes. */
function bodyOf(tweet: Tweet): string {
  const [start, end] = tweet.display_text_range ?? [0, tweet.text.length];
  return Array.from(tweet.text).slice(start, end).join("").trim();
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * Compact attribution for a prompt's x.com source, rendered at build time from
 * data fetched in the page route — no Twitter JS ships to the browser. It's
 * text-only on purpose: the full embed is a tall image that just repeats the
 * prompt, so the card shows who said it and links out for the rest.
 */
export function TweetSourceCard({ tweet, className = "" }: { tweet: Tweet; className?: string }) {
  const url = `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
  const date = new Date(tweet.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <section className={`not-prose ${className}`}>
      <h3 className="mb-2 px-2.5 text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
        Original post
      </h3>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="press group block rounded-2xl bg-surface p-4 hover:bg-surface-raised"
      >
        <p className="line-clamp-5 whitespace-pre-line text-[0.9375rem] leading-relaxed text-foreground">
          {bodyOf(tweet)}
        </p>

        <div className="mt-4 flex items-center gap-2.5">
          <img
            src={tweet.user.profile_image_url_https}
            alt=""
            width={32}
            height={32}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-8 shrink-0 rounded-full bg-surface-raised object-cover"
          />
          <div className="min-w-0 flex-1 text-[0.8125rem] leading-tight">
            <div className="flex items-center gap-1 font-medium text-foreground">
              <span className="truncate">{tweet.user.name}</span>
              {(tweet.user.is_blue_verified || tweet.user.verified) && (
                <BadgeCheck className="size-3.5 shrink-0 text-brand" aria-label="Verified" />
              )}
            </div>
            <div className="truncate text-muted-foreground">@{tweet.user.screen_name}</div>
          </div>
          <XLogo className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        </div>

        <div className="mt-3.5 flex items-center gap-3 border-t border-fd-border pt-3 text-xs text-muted-foreground">
          <time dateTime={tweet.created_at}>{date}</time>
          <span className="ms-auto inline-flex items-center gap-1">
            <Heart className="size-3.5" />
            {compact.format(tweet.favorite_count)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" />
            {compact.format(tweet.conversation_count)}
          </span>
        </div>
      </a>
    </section>
  );
}
