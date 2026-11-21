import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareConversationHistory } from "../src/memory.ts";

test("keeps an unanswered earlier user turn when the current turn is removed", () => {
  const history = [
    { role: "user", parts: [{ text: "Please review this report" }] },
    { role: "user", parts: [{ text: "Yes" }] },
  ];
  assert.deepEqual(prepareConversationHistory(history), [history[0]]);
});

test("keeps completed exchanges and tool responses while excluding current user text", () => {
  const history = [
    { role: "user", parts: [{ text: "First request" }] },
    { role: "model", parts: [{ text: "First answer" }] },
    { role: "user", parts: [{ functionResponse: { name: "search" } }] },
    { role: "model", parts: [{ text: "Tool result summary" }] },
    { role: "user", parts: [{ text: "Follow-up" }] },
  ];
  assert.deepEqual(prepareConversationHistory(history), history.slice(0, -1));
  assert.deepEqual(prepareConversationHistory(history.slice(0, 3)), history.slice(0, 3));
});
