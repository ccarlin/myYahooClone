#!/usr/bin/env node
// Creates myyahoo.json from myyahoo.example.json on a fresh install or first run.
//
// myyahoo.json holds personal state (watchlists, RSS feeds, weather areas) that
// the in-app modals rewrite at runtime, so it is not tracked in git. The example
// file is the tracked template.
//
// This copies rather than renames: the template has to survive so that a later
// install (or a user who deletes their config) can be seeded again, and so the
// operation is idempotent.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXAMPLE = path.join(ROOT, 'myyahoo.example.json');
const CONFIG = path.join(ROOT, 'myyahoo.json');

function ensureConfig(configPath = CONFIG, examplePath = EXAMPLE) {
    let existing = null;
    try {
        existing = fs.statSync(configPath);
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }

    if (existing) {
        if (!existing.isFile()) {
            throw new Error(
                `${configPath} exists but is not a file. This usually means Docker created a ` +
                'directory because the bind mount source was missing. Delete the ' +
                'directory (or fix the volume in docker-compose.yml) and run this again.'
            );
        }
        return { created: false, reason: 'already exists' };
    }

    if (!fs.existsSync(examplePath)) {
        throw new Error(`Cannot seed config: template ${examplePath} is missing.`);
    }

    // Fail early with a clear message rather than letting the server die later
    // on a JSON parse error.
    JSON.parse(fs.readFileSync(examplePath, 'utf8'));

    fs.copyFileSync(examplePath, configPath);
    return { created: true };
}

if (require.main === module) {
    try {
        const result = ensureConfig();
        if (result.created) {
            console.log(`Created myyahoo.json from myyahoo.example.json. Edit it to add your own feeds.`);
        }
    } catch (err) {
        console.error(`[ensure-config] ${err.message}`);
        process.exit(1);
    }
}

module.exports = { ensureConfig, ROOT, CONFIG, EXAMPLE };
