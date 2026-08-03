// Renders a content bank into a clinician-review markdown document:
// every claim sits next to its citation, with an approve/fix/reject block
// per item. Regenerate any time — the JSON bank is the source of truth.
//
// Usage: node scripts/make-review-doc.mjs <bank-basename>
//   e.g.  node scripts/make-review-doc.mjs shoulder-batch1
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const name = process.argv[2];
if (!name) {
  console.error("Usage: node scripts/make-review-doc.mjs <bank-basename>");
  process.exit(1);
}

const bankPath = fileURLToPath(new URL(`../src/content/banks/${name}.json`, import.meta.url));
const outDir = fileURLToPath(new URL("../content-review/", import.meta.url));
const bank = JSON.parse(await readFile(bankPath, "utf8"));

const TYPE_LABEL = {
  mcq: "Multiple choice",
  rank: "Order the steps / rank",
  redflags: "Select-all (red flags)",
  interpret: "Interpret a result",
  discriminator: "Discriminate two conditions",
};

function answerBlock(item) {
  switch (item.type) {
    case "mcq":
    case "discriminator":
      return `**Correct answer:** ${item.options[item.correctIndex]}\n\n**Distractors:** ${item.options
        .filter((_, i) => i !== item.correctIndex)
        .join(" · ")}`;
    case "interpret": {
      const t = item.test;
      const stats = [
        `Sn ${t.sensitivity}%`,
        `Sp ${t.specificity}%`,
        t.lrPlus != null ? `LR+ ${t.lrPlus}` : null,
        t.lrMinus != null ? `LR− ${t.lrMinus}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `**Test data shown to learner:** ${t.name} → ${t.target} (${stats}); result: ${item.result.toUpperCase()}\n\n**Correct answer:** ${item.options[item.correctIndex]}`;
    }
    case "rank":
      return `**Correct order:**\n${item.orderedOptions.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
    case "redflags":
      return `**Flag:** ${item.findings.filter((f) => f.isRedFlag).map((f) => f.text).join(" · ")}\n\n**Don't flag:** ${item.findings.filter((f) => !f.isRedFlag).map((f) => f.text).join(" · ")}`;
    default:
      return "";
  }
}

const rows = bank.items.map((item, n) => {
  const status =
    item.verification === "contested"
      ? `⚖️ CONTESTED — ${item.contestedNote ?? "see explanation"}`
      : item.verification.toUpperCase();
  return `
---

## ${n + 1}. \`${item.id}\` — ${item.topic} (${item.category ?? "uncategorized"})

*${TYPE_LABEL[item.type] ?? item.type}* · Status: **${status}**

**Stem:** ${item.stem}

${answerBlock(item)}

**Explanation (shown after answering):** ${item.explanation}
${item.pearl ? `\n**Pearl:** ${item.pearl}\n` : ""}
> 📚 **Citation:** ${item.citation}

**Your review:**
- [ ] ✅ Approve — claim matches the source
- [ ] ✏️ Fix (note what below)
- [ ] ❌ Reject

Notes:
`;
});

const counts = {};
for (const i of bank.items) counts[i.category ?? "uncategorized"] = (counts[i.category ?? "uncategorized"] ?? 0) + 1;

const doc = `# Content review — ${name}

**Module:** ${bank.module} · **Items:** ${bank.items.length} · Generated ${new Date().toISOString().slice(0, 10)}

Category mix: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(" · ")}

**How to review:** for each item, check the citation actually supports every number and claim in the stem, options, and explanation. Tick one box, add notes for anything to fix. Items stay visibly UNVERIFIED in the app until you approve them; approved items get \`verification: "verified"\` and today's date as \`evidenceReviewedOn\`.
${rows.join("")}`;

await mkdir(outDir, { recursive: true });
const outPath = `${outDir}${name}.md`;
await writeFile(outPath, doc, "utf8");
console.log(`content-review/${name}.md — ${bank.items.length} items`);
