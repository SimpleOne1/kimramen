import * as iconv from "iconv-lite";

const MOJIBAKE_RE = /[РСЃЌЋЉЊЏўѓєіїЁё]/;

function cp1251ToUtf8(value: string): string {
  return iconv.decode(iconv.encode(value, "cp1251"), "utf8");
}

export function fixMojibakeString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!MOJIBAKE_RE.test(trimmed)) {
    return trimmed;
  }

  let fixed = trimmed;

  for (let i = 0; i < 2; i += 1) {
    const next = cp1251ToUtf8(fixed).trim();

    if (next === fixed) {
      break;
    }

    fixed = next;

    if (!MOJIBAKE_RE.test(fixed)) {
      break;
    }
  }

  return fixed;
}

export function fixRequiredMojibakeString(value: string | null | undefined): string {
  return fixMojibakeString(value) || "";
}