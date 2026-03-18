---
sidebar_position: 3
---

# Build Your Self-Portrait

This guide walks you through building a portrait of yourself from existing conversations, documents, and other artifacts.

## Gather Your Sources

Athanor can extract chunks from any text. Good sources include:

- **Chat logs** — Slack/Discord conversations where you explain your reasoning
- **Emails** — Especially ones where you're persuading or teaching
- **Meeting notes** — Decision discussions, architecture reviews
- **Blog posts or documents** — Your writing on topics you care about
- **Code reviews** — PR comments where you explain your preferences
- **Interviews** — Transcripts of you being interviewed or interviewing others

The best sources are ones where you're *explaining why*, not just stating facts.

## Initialize Your Portrait

```bash
athanor init "Your Name"
```

## Extract from Each Source

Process each source file through the extractor:

```bash
# From a chat export
athanor extract ./slack-export.txt \
  --provider anthropic \
  --api-key $ANTHROPIC_API_KEY \
  --subject "Your Name" \
  --source chat \
  --portrait ./portrait.json

# From a document
athanor extract ./blog-post.md \
  --provider anthropic \
  --api-key $ANTHROPIC_API_KEY \
  --subject "Your Name" \
  --source document \
  --portrait ./portrait.json

# From interview transcript
athanor extract ./interview.txt \
  --provider anthropic \
  --api-key $ANTHROPIC_API_KEY \
  --subject "Your Name" \
  --source interview \
  --portrait ./portrait.json
```

Each extraction run:
1. **Chunks** the text into candidate identity fragments
2. **Classifies** candidates against the existing portrait (deduplicating)
3. **Merges** accepted chunks into the portrait

## Detect Relations

After extracting from multiple sources, run relation detection:

```bash
athanor extract --detect-relations \
  --provider anthropic \
  --api-key $ANTHROPIC_API_KEY \
  --portrait ./portrait.json
```

This analyzes all chunks and proposes relations between them (INSTANTIATES, CONTRASTS_WITH, etc.).

## Generate Meta-Chunks

Once you have a substantial portrait (50+ chunks), generate meta-chunks:

```bash
athanor meta-generate \
  --provider anthropic \
  --api-key $ANTHROPIC_API_KEY \
  --portrait ./portrait.json
```

Meta-chunks capture cross-cutting patterns — recurring themes and tendencies that span multiple clusters.

## Review and Refine

```bash
# Check stats
athanor stats ./portrait.json

# Validate
athanor validate ./portrait.json

# Explore interactively
athanor explore --portrait ./portrait.json
```

Look for:
- **Low confidence chunks** — Review and either boost confidence or remove
- **Missing clusters** — Add sources that cover gaps
- **Too few CRITICAL chunks** — Bump uniqueness on your most distinctive traits
- **Orphan chunks** — Chunks with no relations may need connections

## Tips for a Good Self-Portrait

1. **Prioritize non-obvious knowledge** — Skip generic advice. Focus on what makes *you* different.
2. **Include contradictions** — Real people have genuine tensions. Don't smooth them out.
3. **Capture emotional patterns** — Your emotional responses to situations are as important as your rational frameworks.
4. **Use multiple source types** — A portrait built only from blog posts will miss how you communicate informally.
5. **Iterate** — Start with 30–50 chunks, test the clone, then fill gaps based on where it falls short.
