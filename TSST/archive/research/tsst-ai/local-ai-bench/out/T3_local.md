1. **--stat summary**:  
   - **Insertions**: 54 lines (new functions `_split_inline`, `edit_runtime`, `save_runtime`).  
   - **Deletions**: 8 lines (old `HEADER` constant and direct file-write logic in `cmd_limit`/`cmd_verify`).  

2. **Behavioural changes**:  
   - **New functions**:  
     - `_split_inline(rest)`: Parses key-value pairs with inline comments, handling quoted values (e.g., `"value   # comment"`).  
     - `edit_runtime(text, runtime, updates)`: Edits a specific runtime block in a config file, preserving comments, spacing, and other runtimes.  
     - `save_runtime(runtime, updates)`: Writes updated runtime data back to the file using `edit_runtime`.  
     - **Hunks**:  
       - `@@ -503,6 +503,52 @@ def cmd_cancel(a):` (adds new functions).  
       - `@@ -520,8 +566,7 @@ def cmd_limit(a):` (replaces direct file writes with `save_runtime`).  
       - `@@ -552,18 +597,12 @@ def cmd_verify(a):` (same as above).  

   - **Old `HEADER` constant removed** (lines 80–84).  

3. **Risks**:  
   - **Backwards compatibility**: The `save_runtime` function replaces direct file writes, which could break scripts relying on the old `HEADER` format. However, the new logic preserves existing comments and structure, reducing risk.  
   - **Error handling**: `_split_inline` uses `json.JSONDecoder().raw_decode` with a `try-except` block, which may fail on malformed quoted values.  
   - **Testing**: The new functions are not unit-tested in the diff (no test updates shown).  

**Summary**: The diff introduces precise runtime config editing via `edit_runtime`/`save_runtime`, replacing old file-write logic. This improves maintainability but requires validation of edge cases in `_split_inline`.
