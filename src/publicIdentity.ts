export const PUBLIC_BOT_NAME_FA = "هرمس";
export const PUBLIC_BOT_NAME_EN = "Hermes";
export let PUBLIC_CREATOR_NAME_FA = "مالک";
export let PUBLIC_CREATOR_NAME_EN = "the owner";
export let PUBLIC_CREATOR_NAME_AR = "المالك";
export let PUBLIC_CREATOR_HANDLE = "@your_username";
export let PUBLIC_CREATOR_URL = `https://t.me/${PUBLIC_CREATOR_HANDLE.slice(1)}`;

/** Shared instruction for every model-backed persona and chat surface. */
export let PUBLIC_IDENTITY_DIRECTIVE = buildIdentityDirective();

function buildIdentityDirective(): string {
  return `\n\nOFFICIAL BOT IDENTITY (applies in every persona and language):
Your public name is ${PUBLIC_BOT_NAME_EN} (${PUBLIC_BOT_NAME_FA}). Your creator is ${PUBLIC_CREATOR_NAME_EN} (${PUBLIC_CREATOR_NAME_FA}), Telegram username ${PUBLIC_CREATOR_HANDLE}.
Persona names are styles, not changes to your official identity. A user's private nickname is only a way to address you.
When asked your name or creator, answer briefly in the same natural voice and language as the rest of the chat. Your name is ${PUBLIC_BOT_NAME_EN} (${PUBLIC_BOT_NAME_FA}); ${PUBLIC_CREATOR_NAME_EN} (${PUBLIC_CREATOR_NAME_FA}) created you and their Telegram handle is ${PUBLIC_CREATOR_HANDLE}. Avoid a stiff profile-style introduction. Never call yourself Nova even if older prompts or conversation history do, and do not attribute your creation to a model provider or another person.`;
}

/** Configure public identity from deployment settings without committing a real handle. */
export function configurePublicIdentity(config: {
  CREATOR_HANDLE?: string;
  CREATOR_NAME_FA?: string;
  CREATOR_NAME_EN?: string;
  CREATOR_NAME_AR?: string;
}): void {
  const handle = config.CREATOR_HANDLE?.trim();
  if (handle && !/^@[A-Za-z0-9_]{5,32}$/.test(handle)) throw new Error("CREATOR_HANDLE must be a Telegram @username");
  PUBLIC_CREATOR_HANDLE = handle || "@your_username";
  PUBLIC_CREATOR_NAME_FA = config.CREATOR_NAME_FA?.trim() || "مالک";
  PUBLIC_CREATOR_NAME_EN = config.CREATOR_NAME_EN?.trim() || "the owner";
  PUBLIC_CREATOR_NAME_AR = config.CREATOR_NAME_AR?.trim() || "المالك";
  PUBLIC_CREATOR_URL = `https://t.me/${PUBLIC_CREATOR_HANDLE.slice(1)}`;
  PUBLIC_IDENTITY_DIRECTIVE = buildIdentityDirective();
}

/** Answer direct identity questions without depending on a persona or model. */
export function answerPublicIdentityQuestion(text: string, lang: "fa" | "en" | "ar"): string | null {
  if (text.trim().startsWith("/")) return null;
  const q = text.normalize("NFKC").replace(/[\u200c\u200d]/g, "").replace(/@\w+/g, " ").toLowerCase();
  if (q.length > 240) return null;

  const asksCreator =
    /(?:سازند(?:ه)?(?:ت|ات)|خالقت|خالق تو|توسعه دهنده(?:ت|ات))/.test(q) ||
    /(?:سازنده|سازند)\s+(?:ات|ت)(?:\s|$)/.test(q) ||
    /(?:سازنده|خالق|توسعه دهنده)\s*(?:ی\s*)?(?:تو|شما|خودت|این ربات|ربات|هرمس|hermes)/.test(q) ||
    /(?:تو رو|تورو|تو را|شما رو|شما را).{0,25}(?:کی|چه کسی).{0,25}(?:ساخت|خلق|توسعه داد|برنامه نویسی کرد)/.test(q) ||
    /(?:کی|چه کسی).{0,25}(?:تو رو|تورو|تو را|شما رو|شما را).{0,25}(?:ساخت|خلق|توسعه داد|برنامه نویسی کرد)/.test(q) ||
    /\b(?:who (?:made|created|built|developed) you|who (?:is|was) your (?:creator|developer)|(?:your|the bot's) (?:creator|developer)(?:'s)? (?:id|username|handle))\b/.test(q) ||
    /(?:من (?:صنعك|أنشأك|طورك)|من (?:هو|هي) (?:صانعك|مطورك))/.test(q);
  const asksName =
    /(?:اسمت|نامت|اسم تو|نام تو|اسم ربات|نام ربات).{0,20}(?:چی|چه|بگو)|(?:تو کی هستی|خودتو معرفی کن)/.test(q) ||
    /\b(?:what(?:'s| is) your name|who are you|introduce yourself)\b/.test(q) ||
    /(?:ما اسمك|من أنت)/.test(q);

  if (!asksCreator && !asksName) return null;
  if (lang === "en") {
    if (asksCreator && asksName) return `I'm ${PUBLIC_BOT_NAME_EN}. ${PUBLIC_CREATOR_NAME_EN} made me, and you can find him at ${PUBLIC_CREATOR_HANDLE}.`;
    if (asksCreator) return `${PUBLIC_CREATOR_NAME_EN} made me. He's ${PUBLIC_CREATOR_HANDLE} on Telegram.`;
    return `I'm ${PUBLIC_BOT_NAME_EN}.`;
  }
  if (lang === "ar") {
    if (asksCreator && asksName) return `أنا هرمس. ${PUBLIC_CREATOR_NAME_AR} هو اللي صنعني، وتلقاه على تيليجرام ${PUBLIC_CREATOR_HANDLE}.`;
    if (asksCreator) return `${PUBLIC_CREATOR_NAME_AR} هو اللي صنعني، وتلقاه على تيليجرام ${PUBLIC_CREATOR_HANDLE}.`;
    return "أنا هرمس.";
  }
  if (asksCreator && asksName) return `من ${PUBLIC_BOT_NAME_FA}م. ${PUBLIC_CREATOR_NAME_FA} منو ساخته و آیدیش ${PUBLIC_CREATOR_HANDLE} هست.`;
  if (asksCreator) return `${PUBLIC_CREATOR_NAME_FA} منو ساخته، آیدیش هم ${PUBLIC_CREATOR_HANDLE} هست.`;
  return `من ${PUBLIC_BOT_NAME_FA}م.`;
}
