/** Provider-side content blocks are a normal response, not a bot crash. */
export function isModelContentBlocked(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /blocked by safety|safety filter|prohibited_content|flagged_prompt|content (?:was )?blocked|blocklist|gemini[^\n]*blocked/i.test(message);
}

export function modelContentBlockedMessage(lang: string): string {
  if (lang === "fa") return "به این سؤال نمی‌تونم جواب بدم؛ سازندهٔ مدل این نوع محتوا رو محدود کرده. اگه خواستی، یه جور دیگه بپرس 🙂";
  if (lang === "ar") return "ما أقدر أجاوب عن هالسؤال؛ مطوّر النموذج قيّد هذا النوع من المحتوى. إذا تحب، اسألني بطريقة ثانية 🙂";
  return "I can't answer that one; the model provider limits this kind of content. Feel free to ask another way 🙂";
}
