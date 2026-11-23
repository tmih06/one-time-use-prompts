"use client";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useStaticSearch } from "fumadocs-core/search/client";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import { Skeleton } from "skullet/react";

/** Stand-in for result rows, measured into the skeleton while the first search waits on the index. */
const SAMPLE_ROWS = ["Prompt library", "Project setup", "Codebase cleanup", "Release checklist"];

function SampleRows() {
  return (
    <div className="flex flex-col p-1" aria-hidden>
      {SAMPLE_ROWS.map((title, i) => (
        <div key={title} className="px-2.5 py-2 text-sm">
          <div className="text-xs">{i % 2 ? "Library Browse" : "Library"}</div>
          <div className="font-medium">{title}</div>
        </div>
      ))}
    </div>
  );
}

export default function DefaultSearchDialog(props: SharedProps) {
  const { locale } = useI18n(); // (optional) for i18n
  const search = useStaticSearch({
    locale,
  });

  const pending = search.isLoading && !search.data;

  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        {/* The first search downloads the index; hold its place with a skeleton of result rows. */}
        <Skeleton data={pending ? "sample" : "ready"} loading={pending} label="Searching prompts">
          {(state) => (state === "sample" ? <SampleRows /> : <SearchDialogList />)}
        </Skeleton>
      </SearchDialogContent>
    </SearchDialog>
  );
}
