import { test } from "node:test";
import assert from "node:assert/strict";
import { htmlToMainText } from "../src/webSearch.ts";

test("search page reading keeps the live value when navigation precedes main content", () => {
  const html = `<html><body><header>${"menu ".repeat(1000)}</header><main><h1>Gold 18K</h1><span>Current price 264,961,000</span></main></body></html>`;
  assert.match(htmlToMainText(html, 200), /Current price 264,961,000/);
});

test("search page reading still handles pages without a main element", () => {
  assert.equal(htmlToMainText("<article><p>Useful result</p></article>", 100), "Useful result");
});
