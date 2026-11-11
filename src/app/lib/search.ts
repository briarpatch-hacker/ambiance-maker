import { categoryById, categoryMeta } from "@/app/lib/categories";
import { categoryKeywords } from "@/app/lib/searchKeywords";

export const MAX_QUERY_LENGTH = 100;
const MAX_QUERY_WORDS = 8;

// Each tier outweighs any number of matches in the tiers below it (up to MAX_QUERY_WORDS).
const TITLE_WEIGHT = 100;
const DESCRIPTION_WEIGHT = 10;
const CATEGORY_WEIGHT = 1;

// Related ambiances: how much a word says about an ambiance, by where it appears.
const RELATED_TITLE_WEIGHT = 4;
const RELATED_DESCRIPTION_WEIGHT = 2;
const RELATED_CATEGORY_WEIGHT = 1;

export interface SearchableAmbiance {
  title: string;
  description: string;
  category_id: number;
  views: number;
}

// Reduces a word to a rough root so "rain", "rains", "rainy" and "raining" all match.
function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
  else if (/(ch|sh|ss|x)es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss"))
    w = w.slice(0, -1);
  if (w === "evening") return w; // would otherwise collide with "even"
  if (w.length > 6 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 5 && w.endsWith("ed")) w = w.slice(0, -2);
  if (w.length > 4 && w.endsWith("y")) w = w.slice(0, -1);
  return w;
}

function tokenize(text: string): string[] {
  const words =
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f'’]/g, "")
      .match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
  // Hyphenated words are also indexed joined and split, so "lo-fi" finds "lofi".
  return words
    .flatMap((word) =>
      word.includes("-")
        ? [word.replace(/-/g, ""), ...word.split("-")]
        : [word],
    )
    .map(stem);
}

// Filler that says nothing about which ambiance is wanted.
const STOP_WORDS = new Set(
  tokenize(
    "a an and or the of in on at for to with by from sound ambience ambiance background audio",
  ),
);

// Grammar words are also ignored when comparing ambiances. Search keeps them, since they can be part of a title.
const RELATED_IGNORED_WORDS = new Set([
  ...STOP_WORDS,
  ...tokenize(
    "is are was were be been am it its this that these those there here i me my you your we us our they them their he she his her " +
      "as than then but if so not no nor into onto through over under underneath beneath above below around against between behind " +
      "beyond along across after before during until toward towards within without upon about near far up down off out away " +
      "while when where what which who whose how why just only very too more most much some any all each every both few other " +
      "another such same can could will would should may might must do does did has have had one two " +
      "somewhere something nothing everything",
  ),
]);

const categoryWords = new Map<number, Set<string>>(
  Object.entries(categoryMeta).map(([name, meta]) => {
    const parent = categoryById[Math.floor(meta.id / 100) * 100]?.name;
    // Parent tags are left out because they just list the sibling subcategories.
    const text = [
      name,
      ...meta.tags,
      ...(categoryKeywords[name] ?? []),
      ...(parent && parent !== name
        ? [parent, ...(categoryKeywords[parent] ?? [])]
        : []),
    ];
    return [meta.id, new Set(tokenize(text.join(" ")))];
  }),
);

export function searchAmbiances<T extends SearchableAmbiance>(
  query: string,
  ambiances: T[],
  limit: number,
): T[] {
  const allWords = [...new Set(tokenize(query))];
  const meaningful = allWords.filter((word) => !STOP_WORDS.has(word));
  const words = (meaningful.length > 0 ? meaningful : allWords).slice(
    0,
    MAX_QUERY_WORDS,
  );
  if (words.length === 0) return [];

  const scored = ambiances.map((ambiance) => {
    const title = new Set(tokenize(ambiance.title));
    const description = new Set(tokenize(ambiance.description));
    const category = categoryWords.get(ambiance.category_id);
    let matched = 0;
    let score = 0;
    for (const word of words) {
      const weight = title.has(word)
        ? TITLE_WEIGHT
        : description.has(word)
          ? DESCRIPTION_WEIGHT
          : category?.has(word)
            ? CATEGORY_WEIGHT
            : 0;
      if (weight > 0) matched++;
      score += weight;
    }
    return { ambiance, matched, score };
  });

  // Only the ambiances matching the most query words are kept, so results
  // fall back to partial matches when nothing contains every word.
  const mostMatched = scored.reduce((max, s) => Math.max(max, s.matched), 0);
  if (mostMatched === 0) return [];

  return scored
    .filter((s) => s.matched === mostMatched)
    .sort((a, b) => b.score - a.score || b.ambiance.views - a.ambiance.views)
    .slice(0, limit)
    .map((s) => s.ambiance);
}

// Every word an ambiance is described by: its category's words, its description and its title.
function wordWeights(ambiance: SearchableAmbiance): Map<string, number> {
  const weights = new Map<string, number>();
  // Weakest source first, so a word found in several keeps its strongest weight.
  for (const word of categoryWords.get(ambiance.category_id) ?? []) {
    weights.set(word, RELATED_CATEGORY_WEIGHT);
  }
  for (const word of tokenize(ambiance.description)) {
    weights.set(word, RELATED_DESCRIPTION_WEIGHT);
  }
  for (const word of tokenize(ambiance.title)) {
    weights.set(word, RELATED_TITLE_WEIGHT);
  }
  for (const word of RELATED_IGNORED_WORDS) weights.delete(word);
  return weights;
}

// Ranks the other ambiances by the words they share with the current one.
// Unrelated ambiances score 0 and fill any leftover slots by views.
export function relatedAmbiances<T extends SearchableAmbiance & { id: string }>(
  current: T,
  ambiances: T[],
  limit: number,
): T[] {
  const others = ambiances
    .filter((ambiance) => ambiance.id !== current.id)
    .map((ambiance) => ({ ambiance, weights: wordWeights(ambiance) }));
  const own = wordWeights(current);

  // Words found on many ambiances say little about any one of them, so rarer words count for more.
  const frequency = new Map<string, number>();
  for (const { weights } of [{ weights: own }, ...others]) {
    for (const word of weights.keys()) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }
  }
  const total = others.length + 1;

  return others
    .map(({ ambiance, weights }) => {
      let score = 0;
      for (const [word, weight] of own) {
        const theirWeight = weights.get(word);
        if (theirWeight) {
          const rarity = Math.log(total / frequency.get(word)!);
          score += weight * theirWeight * rarity * rarity;
        }
      }
      return { ambiance, score };
    })
    .sort((a, b) => b.score - a.score || b.ambiance.views - a.ambiance.views)
    .slice(0, limit)
    .map((s) => s.ambiance);
}
