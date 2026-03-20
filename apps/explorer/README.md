# @athanor/explorer

Interactive web UI for visualizing Athanor identity portraits. Built with Next.js, React, D3.js, and Tailwind CSS.

## Features

- **Force-directed graph** — D3.js visualization of chunks and relations
- **Cluster map** — Distribution of chunks across clusters
- **Stats dashboard** — Portrait metrics and completeness scoring
- **Chunk detail panel** — Selected chunk info with relations
- **Filtering** — Search, cluster, and type filters

## Usage

```bash
# Set the portrait path
export ATHANOR_PORTRAIT_PATH=./portrait.json

# Start dev server
pnpm --filter @athanor/explorer dev

# Open http://localhost:3000
```

## License

MIT
