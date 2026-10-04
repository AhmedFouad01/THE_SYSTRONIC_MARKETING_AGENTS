# Reference Retrieval Prototype

This is a deterministic **reference prototype**, not production code.

Purpose:
- prove hard filtering before ranking;
- prove project isolation;
- prove state-scope separation;
- prove superseded/secret rejection;
- provide a benchmarkable base before adding embeddings.

Run:

```bash
cd reference_implementation
python -m unittest discover -s tests -v
```

The prototype deliberately has no database, vector store, provider SDK or network dependency.
