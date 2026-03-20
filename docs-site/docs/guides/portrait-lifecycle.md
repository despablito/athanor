---
sidebar_position: 2
---

# Portrait lifecycle: grow the graph, then talk to the clone

Your **Portrait** is a typed knowledge graph (chunks + relations). Athanor gives you **two different ways to have a conversation**, and **several ways to add data** to that graph. This page maps them so nothing feels “missing” after `init` or `extract`.

## How chunks get into the graph

| Path | Command | What happens |
|------|---------|----------------|
| **Bulk from text** | `athanor extract <file>` | Runs the extraction pipeline (chunk → classify → link → optional meta/embed). Appends to `portrait.json`. |
| **Guided live interview** | `athanor interview` | 5-phase AI interviewer asks questions; at the end, chunks are **extracted from the transcript** and **merged** into the portrait. If `./portrait.json` is missing, the CLI **copies** the repo example to `./portrait.json` in your cwd (so you don’t edit the shipped example file). Opening questions use the **portrait you loaded** (if it already has chunks, questions build on that graph; an empty post-`init` portrait still gets broad “cold start” prompts). |
| **Import** | `athanor import <source>` | Bring in chunks from JSON or structured transcripts. |
| **Manual** | Edit JSON or follow [Your First Portrait](./first-portrait.md) | Full control, no LLM. |

### `init` + `validate` (same file by default)

- **`athanor init "Name"`** creates **`./portrait.json`** in the current directory (or `portrait.json` under `--output`). In a TTY you **choose language** interactively; otherwise use **`-l en`** / **`-l pl`** (stored as `subject.language` in JSON).
- **`athanor validate`** defaults to **`./portrait.json`**. If both **`./portrait.json`** and the older layout **`./portrait/portrait.json`** exist (e.g. monorepo dev with a stray large `portrait.json`), the CLI picks the **newer** file for the default path. Pass **`--portrait <path>`** to be explicit.

So the **“Magic Mirror” quick start** (`init` → `extract` → `chat`) is one valid path: **file-first** extraction, then you only **read** the graph in chat.

If you want **ongoing discovery**—the model probing gaps and you answering until new beliefs/heuristics land in the graph—that is **`athanor interview`**, not `chat`.

## Two conversation modes (don’t confuse them)

| Mode | Command | Writes to `portrait.json`? | Role |
|------|---------|----------------------------|------|
| **Clone chat** | `athanor chat` | **No** | Graph-aware RAG: you talk *as if* to the subject; retrieval + reply. Safe to experiment. |
| **Identity interview** | `athanor interview` | **Yes** (after session) | The system **asks you** questions; answers feed extraction → new chunks merged into the portrait. |

There is **no** `chat --grow-graph` flag today: **interview** is the supported CLI for “conversation that expands the graph.” After an interview, run `athanor embed` if you use vector search / chat with embeddings.

## Suggested flows

**Onboarding (from empty portrait)**  
1. `athanor init "My Clone"`  
2. Either `athanor extract ./notes.txt --provider …` **or** `athanor interview --provider …`  
3. `athanor embed` (if you rely on vectors)  
4. `athanor chat` to probe the clone.

**Any time later — add more material without re-init**  
- More files → `athanor extract <new-file>`  
- More depth through dialogue → `athanor interview` again (state file keeps continuity; see `--state`).

## See also

- [AI extraction](./ai-extraction.md) — pipeline details for `extract`  
- [Your First Portrait](./first-portrait.md) — manual chunks  
- [README](https://github.com/despablito/athanor#readme) — CLI table and monorepo commands  
