// The social profiles (lib/social.ts) match the master list in SLG_Website/scripts/social.mjs. Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { SOCIAL, SOCIAL_URLS } from "../lib/social.ts";

const NAMES = ["LinkedIn", "Facebook", "Instagram", "YouTube", "X", "Threads", "Pinterest", "Quora", "WhatsApp"];

test("all nine profiles, in order, each an https address with an icon", () => {
  assert.deepEqual(SOCIAL.map((s) => s.name), NAMES);
  for (const s of SOCIAL) {
    assert.match(s.url, /^https:\/\/[^\s"<>]+$/, s.name);
    assert.match(s.d, /^M[\d.\s,a-zA-Z-]+$/, `${s.name} icon`);
  }
  assert.equal(new Set(SOCIAL_URLS).size, 9);
  assert.ok(SOCIAL_URLS.includes("https://www.linkedin.com/company/145290015/"));
  assert.ok(SOCIAL_URLS.includes("https://whatsapp.com/channel/0029Vb8psTi0bIdfwuCnnj1K"));
});
