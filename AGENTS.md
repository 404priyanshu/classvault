# AGENTS.md

## Agent Workflow

Use CodeGraph first for repo exploration.

Start with `codegraph_status` when tracing architecture, finding files, or understanding flows. Use `codegraph_files`, `codegraph_search`, `codegraph_explore`, `codegraph_callers`, `codegraph_callees`, and `codegraph_impact` before broad filesystem exploration.

Avoid broad `grep`, `find`, `ls`, `cat`, or random file reads unless CodeGraph is insufficient.

Use RTF before editing: read the exact target files after CodeGraph identifies them. Do not edit based only on search results or assumptions.

Before modifying code, state:
1. relevant files found
2. planned change
3. checks to run

Prefer minimal, targeted edits.

Keep responses concise and technically complete. Avoid filler.

For large explanations, summarize first, then provide details only when asked.
