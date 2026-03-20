# Maintainer prompt: audit “graph building vs chat” documentation & UX

Use this checklist when reviewing changes that touch **README**, **docs-site**, or **CLI commands** related to portraits, extraction, interview, or chat.

## Questions to answer (evidence: code + docs)

1. **Where can users add chunks?** List every path: `extract`, `interview`, `import`, manual JSON, `db push`, etc. Confirm each path **writes** or only **reads** the portrait.

2. **Does `chat` mutate the portrait?** Expected: **no** — only RAG over existing chunks. Confirm in `apps/cli/src/commands/chat.ts` and CloneEngine usage.

3. **Does `interview` merge chunks?** Expected: **yes** after session — confirm in `apps/cli/src/commands/interview.ts` (post-session `extractChunks` + `savePortraitJSON`).

4. **Is the Quick Start story honest?** If README shows `init` → `extract` → `chat`, is it clear that **interview** is the alternative for **guided graph growth** through dialogue?

5. **Diagram vs reality:** Does the “How It Works” diagram mention interview + extract as inputs to the portrait, and chat/red-team as **downstream** consumers?

6. **Embeddings:** After adding chunks, is `embed` documented where relevant?

## If something is missing

- Add or update **README** subsection: “Building the graph vs talking to the clone.”
- Add or cross-link **docs-site** guide: `guides/portrait-lifecycle.md`.
- Optionally add a **one-line tip** in `chat` startup pointing to `athanor interview`.

## Regression checks

```bash
pnpm --filter @athanor/cli build
pnpm --filter @athanor/cli test
pnpm lint
```
