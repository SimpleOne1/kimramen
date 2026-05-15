import * as iconv from "iconv-lite";

const MOJIBAKE_RE = /(?:Р.|С.|вЂ.|в„ў|В.|�{1,})/;
const CYRILLIC_RE = /[А-Яа-яЁёІіЇїЄєҐґ]/;
const BROKEN_RE = /�/g;

function decodeCp1251Mojibake(value: string): string {
  return iconv.decode(iconv.encode(value, "cp1251"), "utf8");
}

function mojibakeScore(value: string): number {
  const brokenCount = (value.match(BROKEN_RE) || []).length * 8;
  const suspiciousPairs = (value.match(/(?:Р.|С.|вЂ.|в„ў|В.)/g) || []).length * 4;
  const latinControls = (value.match(/[\u0000-\u001F\u007F]/g) || []).length * 10;
  const readableCyrillic = (value.match(CYRILLIC_RE) || []).length;

  return brokenCount + suspiciousPairs + latinControls - readableCyrillic * 0.35;
}

function shouldTryDecode(value: string): boolean {
  return MOJIBAKE_RE.test(value);
}

/**
 * Syrve sometimes gives us strings where the whole mojibake was repaired,
 * but the UTF-8 bytes for capital Russian "И" (D0 98) were already replaced
 * with the Unicode replacement character before we received the text.
 *
 * Example after normal repair:
 *   "�?зготовлен из натурального бамбука"
 * should be:
 *   "Изготовлен из натурального бамбука"
 *
 * This function is intentionally conservative: it only fixes artifacts that are
 * very likely to be capital "И" in Russian text, instead of replacing every "�".
 */
export function repairRussianCapitalIArtifacts(value: string): string {
  return value
    // Most common artifact from the current Syrve export: "�?зготовлен" -> "Изготовлен".
    .replace(/�\?(?=[А-Яа-яЁёІіЇїЄєҐґ])/g, "И")
    // In some browsers/DB clients the question mark is swallowed: "�зготовлен" -> "Изготовлен".
    .replace(/�(?=[зЗнНмМхХсСтТкК])/g, "И");
}

export function fixMojibakeString(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  if (!shouldTryDecode(trimmed)) {
    return repairRussianCapitalIArtifacts(trimmed);
  }

  let best = trimmed;
  let bestScore = mojibakeScore(best);

  for (let i = 0; i < 2; i += 1) {
    const candidate = decodeCp1251Mojibake(best).trim();
    const candidateScore = mojibakeScore(candidate);

    if (!candidate || candidate === best || candidateScore >= bestScore) {
      break;
    }

    best = candidate;
    bestScore = candidateScore;
  }

  return repairRussianCapitalIArtifacts(best);
}

export function fixRequiredMojibakeString(value: string | null | undefined): string {
  return fixMojibakeString(value) || "";
}
