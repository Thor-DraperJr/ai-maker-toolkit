import assert from "node:assert/strict";
import { test } from "node:test";
import { getServerDefaults, readEnvDefault } from "../dist/config.js";

const KEYS = ["SOCIAL_PROMOTER_POSTS_DIR", "SOCIAL_PROMOTER_SITE_URL", "SOCIAL_PROMOTER_VOICE_FILE"];

function withEnv(values, fn) {
    const saved = {};
    for (const key of KEYS) {
        saved[key] = process.env[key];
        if (values[key] === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = values[key];
        }
    }
    try {
        fn();
    } finally {
        for (const key of KEYS) {
            if (saved[key] === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = saved[key];
            }
        }
    }
}

test("readEnvDefault returns undefined when unset", () => {
    withEnv({}, () => {
        assert.equal(readEnvDefault("SOCIAL_PROMOTER_POSTS_DIR"), undefined);
    });
});

test("readEnvDefault trims and returns a real value", () => {
    withEnv({ SOCIAL_PROMOTER_SITE_URL: "  https://me.dev  " }, () => {
        assert.equal(readEnvDefault("SOCIAL_PROMOTER_SITE_URL"), "https://me.dev");
    });
});

test("readEnvDefault treats empty/whitespace as unset", () => {
    withEnv({ SOCIAL_PROMOTER_SITE_URL: "   " }, () => {
        assert.equal(readEnvDefault("SOCIAL_PROMOTER_SITE_URL"), undefined);
    });
});

test("readEnvDefault treats an unsubstituted placeholder as unset", () => {
    withEnv({ SOCIAL_PROMOTER_VOICE_FILE: "${user_config.voice_file}" }, () => {
        assert.equal(readEnvDefault("SOCIAL_PROMOTER_VOICE_FILE"), undefined);
    });
});

test("getServerDefaults only includes populated values", () => {
    withEnv(
        {
            SOCIAL_PROMOTER_POSTS_DIR: "/posts",
            SOCIAL_PROMOTER_SITE_URL: "${user_config.site_url}",
            SOCIAL_PROMOTER_VOICE_FILE: "",
        },
        () => {
            const defaults = getServerDefaults();
            assert.deepEqual(defaults, { postsDir: "/posts" });
        }
    );
});
