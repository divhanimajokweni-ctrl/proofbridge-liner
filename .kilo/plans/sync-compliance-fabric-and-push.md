# Plan: Sync compliance-fabric and push UI changes

Goal
- Sync local `compliance-fabric` with `origin/compliance-fabric`
- Keep UI updates from the previous step
- Commit and push the result

Steps
1. Inspect divergence with `git status`, `git branch -vv`, `git remote -v`, and `git log --oneline --decorate --graph --all -n 20`
2. Pull `origin/compliance-fabric` using a merge (default), preserving local UI edits
3. If any merge conflicts arise, resolve only the changed files already touched:
   - `app/page.tsx`
   - `public/vvv/proofbridge.html`
   - `public/proofbridge.html`
4. Stage changes with `git add` for the above files
5. Commit with a concise message following current repo style
6. Push `compliance-fabric` to `origin` with `git push origin compliance-fabric`

Notes
- Do not touch other components
- Do not force-push unless absolutely required; warn first if needed