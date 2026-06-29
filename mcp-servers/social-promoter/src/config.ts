/**
 * Default inputs the server can read from its environment. These let a bundle
 * (MCPB) or MCP config wire an author's blog in once via user_config, so the
 * agent does not have to pass postsDir/siteUrl/voiceFile on every call. Any tool
 * argument still overrides the matching default.
 *
 * Values are treated as unset when empty, whitespace, or an unsubstituted
 * "${...}" placeholder (some clients leave optional placeholders in place).
 */
export function readEnvDefault(name: string): string | undefined {
    const raw = process.env[name];
    if (raw === undefined) {
        return undefined;
    }
    const value = raw.trim();
    if (!value || value.includes("${")) {
        return undefined;
    }
    return value;
}

export interface ServerDefaults {
    postsDir?: string;
    siteUrl?: string;
    voiceFile?: string;
}

export function getServerDefaults(): ServerDefaults {
    const defaults: ServerDefaults = {};
    const postsDir = readEnvDefault("SOCIAL_PROMOTER_POSTS_DIR");
    const siteUrl = readEnvDefault("SOCIAL_PROMOTER_SITE_URL");
    const voiceFile = readEnvDefault("SOCIAL_PROMOTER_VOICE_FILE");
    if (postsDir) defaults.postsDir = postsDir;
    if (siteUrl) defaults.siteUrl = siteUrl;
    if (voiceFile) defaults.voiceFile = voiceFile;
    return defaults;
}
