import { test } from "node:test";
import assert from "node:assert/strict";
import { isModelContentBlocked, modelContentBlockedMessage } from "../src/modelContent.ts";

test("provider content blocks get a friendly explanation", () => {
  assert.equal(isModelContentBlocked(new Error("blocked by safety filter (PROHIBITED_CONTENT) [model=gemini]")), true);
  assert.equal(isModelContentBlocked("FLAGGED_PROMPT"), true);
  assert.match(modelContentBlockedMessage("fa"), /سازندهٔ مدل/);
  assert.doesNotMatch(modelContentBlockedMessage("fa"), /PROHIBITED_CONTENT|فیلتر امنیتی|خطا/);
});

test("ordinary failures are not mislabeled as content limits", () => {
  assert.equal(isModelContentBlocked(new Error("empty response (finish=unknown)")), false);
  assert.equal(isModelContentBlocked(new Error("Gemini TTS rate limited (429)")), false);
});
