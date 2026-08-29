# Outreach Templates (Scaffold)

These are scaffold files with section headers and [PLACEHOLDER] markers.
Content is drafted per-recipient at release time — no pre-written copy is
committed. The outreach engine reads from recipients.yaml and uses these
scaffolds as structural guides only.

## Files

- `investor-email.md` — scaffold for Stage 2 personalized investor emails
- `municipal-email.md` — scaffold for Stage 2 personalized municipal emails
- `blog-post.md` — scaffold for Stage 1 engineering blog posts
- `social-post.md` — scaffold for Stage 3 concise social posts
- `press-pitch.md` — scaffold for Stage 3 journalist pitches

## Variables

At draft time, replace these variables with values from the published evidence:
- `{{commit_hash}}` — the frozen commit hash from frozen-build.json
- `{{validation_index}}` — the final Validation Index score
- `{{evidence_url}}` — the GitHub Release URL
- `{{evidence_sha256}}` — the SHA-256 of VVU-72H-VALIDATION.zip
- `{{pass_fail}}` — PASS or FAIL
- `{{recipient_name}}` — the recipient's name (personalized only)
