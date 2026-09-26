## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Keep the docs current

After any change, check whether it affects the docs, and update them in the same piece of work as a separate `docs` commit. Do this without being asked.

- `docs/ARCHITECTURE.md`: routes, stores, shared modules in `apps/web/src/lib`, storage, native setup (plugins, patches, `app.json`), key flows, testing. Update its "Last updated" line.
- `docs/DECISIONS.md`: a new product or technical direction gets a numbered entry (date, decision, why, consequences); a reversed one is marked Superseded, never deleted.
- `roadmap.html`: done/next items, phases, risks; bump the version in the header and footer, and republish the roadmap artifact after pushing.
- `README.md` and `apps/mobile/README.md`: how to run, test or sign in, and what the app does.
- `CONTRIBUTING.md`: the workflow itself (checks, commit style, this table).

The full table is in `CONTRIBUTING.md` under "Keep the docs current".
