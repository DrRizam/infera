// One-off converter — parses the annotated per-region files under
// Reference/Condition References/ (gitignored, the user's richly-cited PT
// diagnosis reference — description, epidemiology, diagnostic accuracy,
// numbered citations) into a flat JS data file Explore can show even for
// conditions with no playable case yet. Condition names here match
// Reference/Condition Reference.md (the flat taxonomy behind
// src/data/conditionReference.js) exactly, word for word — that's what lets
// BodyMapExplorer pair an annotation up with its taxonomy entry by name.
//
// Source files come in two hand-written formats (varies by file, not
// worth normalizing by hand): "bold" (**Name** header, `- *Label:* text`
// bullets, numbered "N. citation" references under a "## REFERENCES"
// heading) and "plain" (bare Name header, `Label: text` lines with no
// bullet/asterisk, unnumbered one-per-line references under a bare
// "REFERENCES" line, numbered implicitly by order of appearance — the
// file's own intro text says so). Detected per file by whether "**"
// appears before the references section.
//
// Not part of the build; rerun manually if the source files change:
//   node scripts/build-condition-annotations.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, "..", "Reference", "Condition References");
const OUT = join(__dirname, "..", "src", "data", "conditionAnnotations.js");

function stripBold(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").trim();
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function citedNumbers(text) {
  const nums = new Set();
  for (const m of text.matchAll(/\[(\d+(?:,\s*\d+)*)\]/g)) {
    for (const n of m[1].split(",")) nums.add(Number(n.trim()));
  }
  return nums;
}

// Bold-format references: "N. Citation text..." — a citation's own text
// never starts a line with a bare number+period, so accumulating until the
// next "N." line is safe.
function parseNumberedReferences(block) {
  const refs = {};
  let current = null;
  for (const raw of block.split("\n")) {
    const line = raw.trim();
    const start = line.match(/^(\d+)\.\s+(.*)$/);
    if (start) {
      if (current) refs[current.n] = current.text.trim();
      current = { n: Number(start[1]), text: start[2] };
    } else if (current && line) {
      current.text += " " + line;
    }
  }
  if (current) refs[current.n] = current.text.trim();
  return refs;
}

// Plain-format references: one citation per line, no leading number —
// numbered implicitly by order of appearance. A citation line reliably
// contains a "(YYYY)" publication year; the file's own descriptive intro
// sentence doesn't, so that's what separates the two.
function parsePlainReferences(block) {
  const refs = {};
  let n = 0;
  for (const raw of block.split("\n")) {
    const line = raw.trim();
    if (!line || !/\(\d{4}\w?\)/.test(line)) continue;
    n += 1;
    refs[n] = line;
  }
  return refs;
}

function isBoldFormat(bodyPart) {
  return bodyPart.includes("**");
}

function parseBoldFormat(bodyPart) {
  const entries = [];
  let current = null;
  const flush = () => {
    if (current) entries.push(current);
  };
  for (const raw of bodyPart.split("\n")) {
    const line = raw.trim();
    // A "## …" subheading is a framing/intro section, never a condition —
    // end the current entry so its bullets don't attach to the last one.
    if (line.startsWith("## ")) {
      flush();
      current = null;
      continue;
    }
    const header = line.match(/^\*\*(.+?)\*\*(.*)$/);
    if (header && !line.startsWith("- ")) {
      flush();
      // The header can be split into several bold runs by a flag emoji, e.g.
      // "**Scaphoid fracture** 🚩 **(nonunion, AVN risk)**" — take the whole
      // line, strip bold + flag emoji, so the name matches its taxonomy
      // entry. Flags can sit anywhere on the line (inside the parens too).
      const name = stripBold(line)
        .replace(/[🚩⚕️]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
      current = {
        name,
        redFlag: line.includes("🚩"),
        comorbidity: line.includes("⚕️"),
        description: "",
        details: [],
      };
      continue;
    }
    if (!current) continue;
    if (/^-\s+\*Evidence pending\*/i.test(line)) continue;
    const detail = line.match(/^-\s+\*([^*:]+):\*\s*(.*)$/);
    if (detail) {
      const label = detail[1].trim();
      const value = stripBold(detail[2]);
      if (label.toLowerCase() === "description") current.description = value;
      else current.details.push({ label, text: value });
    }
  }
  flush();
  return entries;
}

function parsePlainFormat(bodyPart) {
  const entries = [];
  let current = null;
  const flush = () => {
    if (current) entries.push(current);
  };
  const LABEL = /^([A-Za-z][A-Za-z \/'-]{1,40}):\s+(.+)$/;
  for (const raw of bodyPart.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^Evidence pending/i.test(line)) continue;
    const detail = line.match(LABEL);
    if (detail) {
      if (!current) continue; // stray label line before any header — ignore
      const label = detail[1].trim();
      const value = stripBold(detail[2]);
      if (label.toLowerCase() === "description") current.description = value;
      else current.details.push({ label, text: value });
      continue;
    }
    // Not a label line -> a new condition header.
    flush();
    const flagMatch = line.match(/^(.*?)\s*([🚩⚕️]*)\s*$/);
    const name = stripBold((flagMatch ? flagMatch[1] : line).trim());
    const flags = flagMatch ? flagMatch[2] : "";
    current = {
      name,
      redFlag: flags.includes("🚩"),
      comorbidity: flags.includes("⚕️"),
      description: "",
      details: [],
    };
  }
  flush();
  return entries;
}

function parseFile(filePath) {
  const text = readFileSync(filePath, "utf-8");
  const refsSplit = text.split(/^\s*(?:##\s+)?REFERENCES\s*$/m);
  const bodyPart = refsSplit[0];
  const refsPart = refsSplit[1] ? refsSplit[1].split(/^---\s*$/m)[0] : "";

  const bold = isBoldFormat(bodyPart);
  // Bold-format files title with a "# Heading"; plain-format files just
  // start with the bare title as their first non-empty line.
  const section = bold
    ? (bodyPart.match(/^#\s+(.+)$/m)?.[1] || "").trim() || null
    : bodyPart.split("\n").find((l) => l.trim())?.trim() || null;

  const refs = bold ? parseNumberedReferences(refsPart) : parsePlainReferences(refsPart);
  const rawEntries = bold ? parseBoldFormat(bodyPart) : parsePlainFormat(bodyPart);

  return rawEntries
    .filter((e) => e.description || e.details.length > 0)
    // Drop file-preamble lines that aren't real conditions: "<Part N — …>",
    // the doc title, the "Status:" / "Conditions:" metadata lines.
    .filter(
      (e) =>
        !/^(Part\s|Physical Therapist'?s Master Condition Reference$|Status:|Conditions:)/i.test(
          e.name
        )
    )
    .map((e) => {
      const allCited = new Set();
      for (const d of e.details) for (const n of citedNumbers(d.text)) allCited.add(n);
      for (const n of citedNumbers(e.description || "")) allCited.add(n);
      const references = [...allCited].sort((a, b) => a - b).map((n) => refs[n]).filter(Boolean);
      return { ...e, section, slug: slugify(e.name), references };
    });
}

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith(".md") && f !== "00_INDEX.md");
const allEntries = files.flatMap((f) => parseFile(join(SRC_DIR, f)));

const out = `// Auto-generated by scripts/build-condition-annotations.mjs — do not hand-edit.
// Source: Reference/Condition References/*.md (gitignored). Rerun the
// script if the source files change.
export const CONDITION_ANNOTATIONS = ${JSON.stringify(allEntries, null, 2)};
`;

writeFileSync(OUT, out);
console.log(`wrote ${allEntries.length} annotated entries from ${files.length} files to ${OUT}`);
