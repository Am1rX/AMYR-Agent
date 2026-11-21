import { test } from "node:test";
import assert from "node:assert/strict";
import { answerPublicIdentityQuestion, configurePublicIdentity, PUBLIC_CREATOR_URL, PUBLIC_IDENTITY_DIRECTIVE } from "../src/publicIdentity.ts";

test("answers creator, handle and name questions consistently", () => {
  configurePublicIdentity({ CREATOR_HANDLE: "@example_owner", CREATOR_NAME_FA: "سازنده", CREATOR_NAME_EN: "the creator", CREATOR_NAME_AR: "الصانع" });
  for (const text of ["سازندت کیه؟", "کی تورو ساخته؟", "آیدی سازنده‌ات چیه؟", "آیدی سازنده ات چیه؟", "@agentamyrxbot سازندت کیه؟", "هرمس، سازنده تو کیه؟"]) {
    const answer = answerPublicIdentityQuestion(text, "fa");
    assert.match(answer, /سازنده/);
    assert.match(answer, /@example_owner/);
  }
  assert.equal(answerPublicIdentityQuestion("اسمت چیه؟", "fa"), "من هرمسم.");
  assert.equal(answerPublicIdentityQuestion("سازندت کیه؟", "fa"), "سازنده منو ساخته، آیدیش هم @example_owner هست.");
  assert.equal(answerPublicIdentityQuestion("اسمت چیه و سازندت کیه؟", "fa"), "من هرمسم. سازنده منو ساخته و آیدیش @example_owner هست.");
  assert.match(answerPublicIdentityQuestion("Who created you?", "en"), /the creator.*@example_owner/);
  assert.match(answerPublicIdentityQuestion("من صنعك؟", "ar"), /الصانع.*@example_owner/);
  assert.match(PUBLIC_IDENTITY_DIRECTIVE, /Hermes.*هرمس/);
  assert.equal(PUBLIC_CREATOR_URL, "https://t.me/example_owner");
});

test("does not hijack unrelated questions or commands", () => {
  assert.equal(answerPublicIdentityQuestion("سازنده تلگرام کیه؟", "fa"), null);
  assert.equal(answerPublicIdentityQuestion("سازنده تلگرام کیه و تو چه نظری داری؟", "fa"), null);
  assert.equal(answerPublicIdentityQuestion("اسم سازنده چیه؟", "fa"), null);
  assert.equal(answerPublicIdentityQuestion("/search سازندت کیه؟", "fa"), null);
});
