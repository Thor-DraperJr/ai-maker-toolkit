import {
    chmodSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Storage layer for X credentials. Today this is bring-your-own-keys (the four
 * OAuth 1.0a user-context values from a personal X developer app). The shape is
 * deliberately small so a future OAuth/PKCE flow (a shared "sign in with X" app)
 * can replace the source without touching the publish path.
 */
export interface XCredentials {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
}

export type CredentialSource = "env" | "file" | "none";

export interface CredentialStatus {
    configured: boolean;
    source: CredentialSource;
    configPath: string;
}

function configDir(): string {
    return join(homedir(), ".social-promoter");
}

export function configPath(): string {
    return join(configDir(), "credentials.json");
}

/** Read credentials from the environment, or null if any of the four are missing. */
function fromEnv(): XCredentials | null {
    const appKey = process.env.X_API_KEY;
    const appSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessSecret = process.env.X_ACCESS_SECRET;
    if (!appKey || !appSecret || !accessToken || !accessSecret) {
        return null;
    }
    return { appKey, appSecret, accessToken, accessSecret };
}

/** Read credentials from the locked config file, or null if absent/invalid. */
function fromFile(): XCredentials | null {
    const path = configPath();
    if (!existsSync(path)) {
        return null;
    }
    try {
        const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<XCredentials>;
        if (raw.appKey && raw.appSecret && raw.accessToken && raw.accessSecret) {
            return {
                appKey: raw.appKey,
                appSecret: raw.appSecret,
                accessToken: raw.accessToken,
                accessSecret: raw.accessSecret,
            };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Resolve credentials. Environment variables win for CI, deployment hosts, and
 * scripted setups; the stored config file is the path the `login` command writes
 * for everyday users.
 */
export function getCredentials(): XCredentials | null {
    return fromEnv() ?? fromFile();
}

export function getStatus(): CredentialStatus {
    const path = configPath();
    if (fromEnv()) {
        return { configured: true, source: "env", configPath: path };
    }
    if (fromFile()) {
        return { configured: true, source: "file", configPath: path };
    }
    return { configured: false, source: "none", configPath: path };
}

/** Persist credentials to a permission-locked file in the user's home directory. */
export function saveCredentials(creds: XCredentials): string {
    const dir = configDir();
    mkdirSync(dir, { recursive: true });
    try {
        chmodSync(dir, 0o700);
    } catch {
        // Permission bits are advisory on some platforms (e.g. Windows); ignore.
    }
    const path = configPath();
    writeFileSync(path, JSON.stringify(creds, null, 2), { mode: 0o600 });
    try {
        chmodSync(path, 0o600);
    } catch {
        // Ignore on platforms that do not honor POSIX modes.
    }
    return path;
}

/** Remove stored credentials. Returns true if a file was deleted. */
export function clearCredentials(): boolean {
    const path = configPath();
    if (!existsSync(path)) {
        return false;
    }
    rmSync(path);
    return true;
}
