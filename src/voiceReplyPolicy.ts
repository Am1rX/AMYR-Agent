export interface VoiceReplyContext {
  isPrivate: boolean;
  incomingVoice: boolean;
  replyToBot: boolean;
  replyToBotVoice: boolean;
}

/** The most specific conversation cue wins. One random draw is used per turn. */
export function voiceReplyProbability(context: VoiceReplyContext): number {
  if (context.isPrivate && context.incomingVoice) return 1;
  if (context.replyToBotVoice) return 0.9;
  if (!context.isPrivate && context.replyToBot) return 0.35;
  if (context.isPrivate) return 0.3;
  return 0;
}

/** Private, ordinary text gets a voice reply only when the finished answer is short. */
export function isShortVoiceAnswer(text: string): boolean {
  const answer = String(text ?? "").trim();
  return answer.length > 0 && answer.length <= 240
    && answer.split(/\s+/u).length <= 40
    && answer.split(/\r?\n/u).filter(Boolean).length <= 2;
}

export function shouldSendVoiceReply(
  context: VoiceReplyContext,
  answer: string,
  roll: number,
): boolean {
  const probability = voiceReplyProbability(context);
  if (roll >= probability) return false;
  if (context.isPrivate && context.incomingVoice) return answer.trim().length > 0;
  if (context.isPrivate && !context.incomingVoice && !context.replyToBotVoice) {
    return isShortVoiceAnswer(answer);
  }
  // Avoid a partially spoken answer when a tool returns a long report.
  return answer.trim().length > 0 && answer.length <= 2_500;
}
