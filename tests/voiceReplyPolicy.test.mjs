import { test } from "node:test";
import assert from "node:assert/strict";
import { isShortVoiceAnswer, shouldSendVoiceReply, voiceReplyProbability } from "../src/voiceReplyPolicy.ts";

const context = (changes = {}) => ({
  isPrivate: false, incomingVoice: false, replyToBot: false, replyToBotVoice: false,
  ...changes,
});

test("voice replies use the most specific rule in groups", () => {
  const botVoice = context({ replyToBot: true, replyToBotVoice: true });
  const botText = context({ replyToBot: true });
  assert.equal(voiceReplyProbability(botVoice), 0.9);
  assert.equal(voiceReplyProbability(botText), 0.35);
  assert.equal(voiceReplyProbability(context()), 0);
  assert.equal(shouldSendVoiceReply(botVoice, "سلام", 0.89), true);
  assert.equal(shouldSendVoiceReply(botVoice, "سلام", 0.9), false);
  assert.equal(shouldSendVoiceReply(botText, "سلام", 0.34), true);
  assert.equal(shouldSendVoiceReply(botText, "سلام", 0.35), false);
});

test("private voice input always gets voice; replies to bot voice use 90 percent", () => {
  const directVoice = context({ isPrivate: true, incomingVoice: true });
  const botVoiceReply = context({ isPrivate: true, replyToBot: true, replyToBotVoice: true });
  assert.equal(voiceReplyProbability(directVoice), 1);
  assert.equal(shouldSendVoiceReply(directVoice, "پاسخ", 0.999), true);
  assert.equal(voiceReplyProbability(botVoiceReply), 0.9);
  assert.equal(shouldSendVoiceReply(botVoiceReply, "پاسخ", 0.9), false);
});

test("private ordinary messages use 30 percent only for short answers", () => {
  const privateText = context({ isPrivate: true });
  assert.equal(voiceReplyProbability(privateText), 0.3);
  assert.equal(isShortVoiceAnswer("دو خط\nپاسخ"), true);
  assert.equal(shouldSendVoiceReply(privateText, "جواب کوتاه", 0.29), true);
  assert.equal(shouldSendVoiceReply(privateText, "جواب کوتاه", 0.3), false);
  assert.equal(shouldSendVoiceReply(privateText, "کلمه ".repeat(80), 0.1), false);
  assert.equal(shouldSendVoiceReply(privateText, "سه\nخط\nپاسخ", 0.1), false);
});
