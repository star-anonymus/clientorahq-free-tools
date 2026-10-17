// Small, honest password strength estimate: character-pool entropy with
// penalties for the patterns real cracking tools try first.

const COMMON = new Set(
  "123456 password 123456789 12345678 12345 qwerty 1234567 111111 123123 abc123 password1 1234 iloveyou 1q2w3e4r 000000 qwerty123 zaq12wsx dragon sunshine princess letmein 654321 monkey 27653 1qaz2wsx 123321 qwertyuiop superman asdfghjkl trustno1 welcome admin football baseball master shadow michael login starwars hello freedom whatever pakistan india passw0rd p@ssw0rd 1234567890 aa123456 charlie donald 666666 7777777 121212 qazwsx password123 admin123 batman ninja azerty solo loveme flower hottie jesus mustang access 696969 lovely 888888 654321 computer secret summer winter".split(" "),
);

const SEQS = ["abcdefghijklmnopqrstuvwxyz", "qwertyuiopasdfghjklzxcvbnm", "01234567890", "1qaz2wsx3edc4rfv"];

export interface Strength {
  bits: number;
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  crack: string;
  tips: string[];
}

const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;

export function poolSize(pw: string) {
  let n = 0;
  if (/[a-z]/.test(pw)) n += 26;
  if (/[A-Z]/.test(pw)) n += 26;
  if (/\d/.test(pw)) n += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) n += 33;
  return n;
}

/** Seconds → human time, assuming 10 billion guesses per second (offline GPU attack). */
export function crackTime(bits: number) {
  const secs = Math.pow(2, bits) / 2 / 1e10;
  if (secs < 1) return "instantly";
  const units: [number, string][] = [[60, "seconds"], [60, "minutes"], [24, "hours"], [365, "days"], [100, "years"], [10, "centuries"]];
  let v = secs;
  for (const [step, name] of units) {
    if (v < step) return `${Math.round(v)} ${name}`;
    v /= step;
  }
  return v > 1e6 ? "longer than the universe has existed" : `${Math.round(v).toLocaleString()} millennia`;
}

export function checkStrength(pw: string): Strength {
  const tips: string[] = [];
  if (!pw) return { bits: 0, score: 0, label: "—", crack: "—", tips };
  const lower = pw.toLowerCase();
  let bits = pw.length * Math.log2(Math.max(poolSize(pw), 1));

  const leet = lower.replace(/[@4]/g, "a").replace(/3/g, "e").replace(/[1!]/g, "i").replace(/0/g, "o").replace(/[$5]/g, "s");
  if (COMMON.has(lower) || COMMON.has(leet) || COMMON.has(leet.replace(/\d+$/, ""))) {
    bits = Math.min(bits, 8);
    tips.push("This is one of the most common passwords — it is guessed in the first second.");
  }
  if (/(.)\1{2,}/.test(pw)) { bits -= 8; tips.push("Avoid repeating the same character (aaa, 111)."); }
  if (SEQS.some((s) => { for (let i = 0; i + 4 <= lower.length; i++) if (s.includes(lower.slice(i, i + 4))) return true; return false; })) {
    bits -= 10;
    tips.push("Avoid keyboard or alphabet runs like abcd, qwer or 1234.");
  }
  if (/(19|20)\d{2}/.test(pw)) { bits -= 6; tips.push("Years like 1998 or 2024 are among the first things attackers try."); }
  // One word + digits + symbols (Summer2024!) is cracked as "dictionary word + suffix", not as random characters.
  // Only dictionary-length words (3–12 letters) count; long random letter runs are left alone.
  const m = /^(.{3,12}?)(\d*)([^A-Za-z0-9]*)$/.exec(pw);
  const wordy = m && /^[a-z]+$/i.test(m[1].replace(/[@4]/g, "a").replace(/3/g, "e").replace(/[1!]/g, "i").replace(/0/g, "o").replace(/[$5]/g, "s")) ? m : null;
  if (wordy) {
    bits = Math.min(bits, 17 + wordy[2].length * 3.32 + wordy[3].length * 5 + 1);
    tips.push("A single word with numbers or a symbol on the end (Summer2024!) is a pattern attackers try early. Use several random words or random characters.");
  }
  if (pw.length < 12) tips.push("Use at least 12–14 characters. Length adds the most strength.");
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw)) tips.push("Mix upper and lower case letters.");
  if (!/\d/.test(pw)) tips.push("Add a number.");
  if (!/[^a-zA-Z0-9]/.test(pw)) tips.push("Add a symbol such as # % & or *.");

  bits = Math.max(0, Math.round(bits));
  const score = (bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4) as Strength["score"];
  return { bits, score, label: LABELS[score], crack: crackTime(bits), tips: score >= 4 ? [] : tips };
}

export const SCORE_COLORS = ["#ff7a8a", "#ff9f6b", "#ffc857", "#5ee59a", "#29e6ff"];
