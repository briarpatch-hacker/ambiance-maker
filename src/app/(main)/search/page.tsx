import type { Metadata } from "next";
import Search from "@/app/components/Search/search";
import { MAX_QUERY_LENGTH } from "@/app/lib/search";
import { categoryMeta } from "@/app/lib/categories";
import { categoryKeywords } from "@/app/lib/searchKeywords";

const vocabulary = [
  ...Object.keys(categoryMeta),
  ...Object.values(categoryMeta).flatMap((category) => category.tags),
  ...Object.values(categoryKeywords).flat(),
];
const seenWords = new Set<string>();
const suggestionWords = vocabulary.filter((word) => {
  const key = word.toLowerCase();
  if (seenWords.has(key)) return false;
  seenWords.add(key);
  return true;
});

interface PageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

function getQuery(q: string | string[] | undefined): string {
  return ((Array.isArray(q) ? q[0] : q) ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const query = getQuery((await searchParams).q);
  return {
    title: "Search",
    description: "Search ambiances by sound, setting, or mood.",
    // Result pages are near-duplicates of each other, so only the bare page is indexed
    robots: query ? { index: false } : undefined,
  };
}

export default async function Page({ searchParams }: PageProps) {
  const query = getQuery((await searchParams).q);
  return <Search query={query} maxQueryLength={MAX_QUERY_LENGTH} suggestionWords={suggestionWords} />;
}
