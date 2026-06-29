import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";

export interface PostSummary {
    filePath: string;
    title: string;
    excerpt: string;
    slug: string;
    category: string;
    date: string;
    url: string;
    /** Full markdown body (frontmatter stripped). Populated only when includeBody is set. */
    body?: string;
}

function stripMarkup(markdown: string): string {
    return String(markdown)
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`[^`]*`/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^>\s?/gm, "")
        .replace(/[*_~`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeSegment(value: string): string {
    return String(value)
        .toLowerCase()
        .trim()
        .replace(/["']/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function inferCategory(categories: unknown, fallback: string): string {
    if (Array.isArray(categories) && categories.length) {
        return normalizeSegment(String(categories[0]));
    }
    if (typeof categories === "string" && categories.trim()) {
        return normalizeSegment(categories.split(",")[0]);
    }
    return normalizeSegment(fallback);
}

function getPostDate(fileName: string, frontmatterDate: unknown): string {
    if (frontmatterDate instanceof Date) {
        return frontmatterDate.toISOString().slice(0, 10);
    }
    if (typeof frontmatterDate === "string" && frontmatterDate.trim()) {
        return frontmatterDate.slice(0, 10);
    }
    const match = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "1970-01-01";
}

function deriveExcerpt(content: string, fallback: unknown): string {
    if (typeof fallback === "string" && fallback.trim()) {
        return stripMarkup(fallback);
    }
    const body = stripMarkup(content);
    if (body.length <= 200) {
        return body;
    }
    return `${body.slice(0, 197).replace(/\s+\S*$/, "")}...`;
}

function buildUrl(siteUrl: string, category: string, slug: string): string {
    const base = siteUrl.trim().replace(/\/$/, "");
    if (!base) {
        return "";
    }
    return `${base}/${category}/${slug}/`;
}

/**
 * Find published markdown posts under a directory, newest first.
 * Skips files with `draft: true` in frontmatter.
 */
export function findPosts(
    postsDir: string,
    options: {
        siteUrl?: string;
        defaultCategory?: string;
        includeDrafts?: boolean;
        includeBody?: boolean;
    } = {},
): PostSummary[] {
    const { siteUrl = "", defaultCategory = "posts", includeDrafts = false, includeBody = false } = options;

    if (!fs.existsSync(postsDir)) {
        throw new Error(`Posts directory not found: ${postsDir}`);
    }

    const entries = fs.readdirSync(postsDir, { recursive: true }) as string[];
    const markdownFiles = entries.filter((entry) => entry.endsWith(".md"));
    const posts: PostSummary[] = [];

    for (const relative of markdownFiles) {
        const filePath = path.join(postsDir, relative);
        if (!fs.statSync(filePath).isFile()) {
            continue;
        }

        const parsed = matter(fs.readFileSync(filePath, "utf8"));
        if (parsed.data?.draft === true && !includeDrafts) {
            continue;
        }

        const fileName = path.basename(filePath);
        const slug = path.basename(fileName, ".md").replace(/^\d{4}-\d{2}-\d{2}-/, "");
        const category = inferCategory(parsed.data?.categories, defaultCategory);
        const title = String(parsed.data?.title || slug.replace(/-/g, " ")).trim();

        posts.push({
            filePath,
            title,
            excerpt: deriveExcerpt(parsed.content, parsed.data?.excerpt),
            slug,
            category,
            date: getPostDate(fileName, parsed.data?.date),
            url: buildUrl(siteUrl, category, slug),
            ...(includeBody ? { body: parsed.content.trim() } : {}),
        });
    }

    return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export interface ToneProfile {
    summary: string;
    topTerms: string[];
}

const STOP_WORDS = new Set([
    "the", "and", "for", "that", "with", "this", "from", "have", "into", "your", "about", "what", "when",
    "where", "there", "their", "will", "would", "could", "should", "than", "then", "over", "under", "just",
    "also", "like", "because", "while", "only", "being", "been", "were", "they", "them", "are", "our", "out",
    "not", "but", "can", "all", "its", "you", "how", "why", "who",
]);

/** Infer a lightweight tone profile from prior posts for the agent to calibrate against. */
export function buildToneProfile(priorPosts: PostSummary[]): ToneProfile {
    if (!priorPosts.length) {
        return { summary: "grounded, direct, practical, no hype", topTerms: [] };
    }

    const combined = priorPosts.map((p) => `${p.title}. ${p.excerpt}`).join(" ").toLowerCase();
    const counts = new Map<string, number>();
    for (const token of combined.replace(/[^a-z0-9\s]/g, " ").split(/\s+/)) {
        if (!token || token.length < 4 || STOP_WORDS.has(token)) {
            continue;
        }
        counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    const topTerms = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([word]) => word);

    const traits: string[] = [];
    if (/security|risk|threat/.test(combined)) traits.push("risk-aware");
    if (/leader|leadership|executive/.test(combined)) traits.push("executive-relevant");
    if (/operator|practical|build/.test(combined)) traits.push("operator-focused");
    if (!traits.length) traits.push("direct", "grounded", "useful");

    return { summary: traits.join(", "), topTerms };
}

export interface CorpusProfile {
    postCount: number;
    earliest: string;
    latest: string;
    toneProfile: ToneProfile;
    titles: string[];
}

/**
 * Summarize the whole body of an author's work, not just the latest post. Gives
 * the agent an overview of span and recurring themes when building a voice read.
 * The deeper voice signal comes from full post bodies returned by find_latest_post;
 * this is the corpus-level context around it.
 */
export function buildCorpusProfile(
    postsDir: string,
    options: { siteUrl?: string; defaultCategory?: string } = {},
): CorpusProfile {
    const posts = findPosts(postsDir, options);
    if (!posts.length) {
        return { postCount: 0, earliest: "", latest: "", toneProfile: buildToneProfile([]), titles: [] };
    }
    return {
        postCount: posts.length,
        earliest: posts[posts.length - 1].date,
        latest: posts[0].date,
        toneProfile: buildToneProfile(posts),
        titles: posts.map((p) => p.title),
    };
}
