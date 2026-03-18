# Quick Start: Your First Clone in 15 Minutes

This tutorial walks you through the complete Athanor workflow — from installation to chatting with a clone.

## 1. Install (2 minutes)

```bash
# Clone the repo
git clone https://github.com/anthropics/athanor.git
cd athanor

# Install dependencies
pnpm install

# Build
pnpm build
```

Set up an alias for convenience:

```bash
alias athanor="pnpm --filter @athanor/cli dev --"
```

## 2. Initialize a Portrait (1 minute)

```bash
athanor init "Jordan Rivera"
```

This creates `portrait.json` with an empty portrait for Jordan.

## 3. Import Chunks Manually (5 minutes)

Open `portrait.json` and add these chunks to the `chunks` array:

```json
[
  {
    "chunk_id": "TDM-HEUR-001",
    "author": "self",
    "cluster": "technical-decision-making",
    "type": "heuristic",
    "uniqueness": "CRITICAL",
    "source": "interview",
    "confidence": 0.93,
    "context_tags": ["architecture", "simplicity"],
    "linked_chunks": [],
    "content": "Choose the most boring technology that solves the problem. Novel tech has novel failure modes — and at 3am, you want failure modes you've seen before."
  },
  {
    "chunk_id": "TDM-ANTI-001",
    "author": "self",
    "cluster": "technical-decision-making",
    "type": "anti-pattern",
    "uniqueness": "HIGH",
    "source": "observation",
    "confidence": 0.87,
    "context_tags": ["rewrites", "risk"],
    "linked_chunks": ["TDM-HEUR-001"],
    "content": "Never do a ground-up rewrite of a working system. Every rewrite in my career has taken 3x longer than estimated and delivered 60% of the features of the thing it replaced."
  },
  {
    "chunk_id": "TL-BELI-001",
    "author": "self",
    "cluster": "team-leadership",
    "type": "belief",
    "uniqueness": "CRITICAL",
    "source": "interview",
    "confidence": 0.91,
    "context_tags": ["culture", "feedback"],
    "linked_chunks": [],
    "content": "Psychological safety isn't about being nice — it's about being honest. A team where people are polite but withhold concerns is more dangerous than one where people argue openly."
  },
  {
    "chunk_id": "EL-EMOT-001",
    "author": "self",
    "cluster": "emotional-landscape",
    "type": "emotion",
    "uniqueness": "CRITICAL",
    "source": "interview",
    "confidence": 0.78,
    "context_tags": ["frustration", "communication"],
    "linked_chunks": ["TL-BELI-001"],
    "content": "Gets visibly frustrated when people optimize for consensus over correctness. Will push back hard in meetings when the group is converging on a comfortable-but-wrong answer."
  },
  {
    "chunk_id": "PV-CONT-001",
    "author": "self",
    "cluster": "personal-values",
    "type": "contradiction",
    "uniqueness": "HIGH",
    "source": "observation",
    "confidence": 0.82,
    "context_tags": ["introversion", "leadership"],
    "linked_chunks": ["TL-BELI-001", "EL-EMOT-001"],
    "content": "Deeply introverted and drained by social interaction, yet consistently steps up to lead contentious discussions. Resolves this by treating difficult conversations as a technical skill to be practiced, not a social skill to be enjoyed."
  }
]
```

Add these relations:

```json
[
  {
    "source": "TDM-ANTI-001",
    "target": "TDM-HEUR-001",
    "type": "INSTANTIATES",
    "description": "The no-rewrites anti-pattern is a specific instance of choosing boring technology"
  },
  {
    "source": "EL-EMOT-001",
    "target": "TL-BELI-001",
    "type": "EXPRESSED_THROUGH",
    "description": "Frustration with consensus manifests as pushing for honesty over politeness"
  },
  {
    "source": "PV-CONT-001",
    "target": "TL-BELI-001",
    "type": "CONTRASTS_WITH",
    "description": "Introversion contrasts with active leadership of contentious discussions"
  }
]
```

## 4. Validate (1 minute)

```bash
athanor validate ./portrait.json
```

You should see validation pass with all checks green. If you get warnings about cluster coverage, that's expected — we only have 3 clusters.

## 5. Explore (2 minutes)

Check the stats:

```bash
athanor stats ./portrait.json
```

Export to Markdown to see a readable version:

```bash
athanor export ./portrait.json --format markdown --output portrait.md
```

Open `portrait.md` to see your chunks organized by cluster.

## 6. Ask the Clone a Question (4 minutes)

Start the Clone API:

```bash
# You'll need an API key for one of the providers
export ANTHROPIC_API_KEY=sk-ant-...

athanor serve --portrait ./portrait.json --port 3001
```

In another terminal, chat with the clone:

```bash
# Ask about their technical philosophy
curl -s -X POST http://localhost:3001/api/clone/default/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Should we rewrite our monolith in microservices?"}' | jq .

# Ask about leadership
curl -s -X POST http://localhost:3001/api/clone/default/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do you handle disagreements in your team?"}' | jq .

# Probe a contradiction
curl -s -X POST http://localhost:3001/api/clone/default/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "You seem like someone who avoids conflict. Is that fair?"}' | jq .
```

Notice how the clone's response to the contradiction question draws on the CONTRASTS_WITH relation — it can articulate its own tension between introversion and active leadership.

## What's Next?

- **Automate extraction**: Use `athanor extract` to pull chunks from text files with LLMs
- **Generate meta-chunks**: Use `athanor meta-generate` once you have 50+ chunks
- **Visualize**: Run `pnpm --filter @athanor/explorer dev` to see the force-directed graph
- **Integrate with AI tools**: Set up the MCP server for Claude Code integration

See the [full documentation](../../../docs-site/docs/intro.md) for detailed guides.
