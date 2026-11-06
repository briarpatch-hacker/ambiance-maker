import type { Metadata } from "next";
import CategoriesPage from "@/app/components/Categories/categories";
import PageView from "@/app/components/Page View/pageView";
import { categories, categoryMeta } from "@/app/lib/categories";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/ /g, "-");
}

function slugToName(slug: string, pool: string[]) {
  return pool.find((name) => nameToSlug(name) === slug);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return {
      title: "Categories",
      description:
        "Explore ambiances by mood, setting, and sound. Browse categories from cozy rooms to open wilderness, from lo-fi beats to pure white noise.",
    };
  }

  const catName = slugToName(slug[0], Object.keys(categories));
  if (!catName) return {};

  if (slug.length === 1) {
    return {
      title: { absolute: `Categories | ${catName}` },
      description: categoryMeta[catName]?.description,
    };
  }

  const subcatName = slugToName(
    slug[1],
    Object.keys(categories[catName] ?? {}),
  );
  if (!subcatName) return {};

  return {
    title: { absolute: `Categories | ${subcatName}` },
    description: categoryMeta[subcatName]?.description,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return (
    <>
      <PageView page="categories" />
      <CategoriesPage slug={slug} />
    </>
  );
}
