# Commit Signing Guide — GPG for Supply-Chain Integrity

**Goal:** Every commit on `proofbridge-liner` shows a "Verified" badge on GitHub, proving the commit came from a trusted key holder.

**Current state:** `githubCommitVerification: "unverified"` on every commit — anyone could push commits impersonating your email address. This is a supply-chain risk for a public repo.

---

## Quick setup (5 minutes)

```bash
# 1. Run the setup script (interactive — prompts for name, email, passphrase)
./scripts/setup-gpg-signing.sh
```

The script will:
1. Check if GPG is installed
2. Look for existing GPG keys (or generate a new RSA 4096-bit key)
3. Configure git to sign all commits by default (`commit.gpgsign true`)
4. Export the public key to a file (`gpg-public-key-<KEYID>.txt`)
5. Open GitHub's GPG settings page so you can paste the public key
6. Optionally configure the GPG agent to cache your passphrase for 1 hour

---

## Manual setup (if the script doesn't work for you)

### Step 1: Generate a GPG key

```bash
gpg --full-generate-key
```

At the prompts:
- **Key type:** RSA and RSA (default)
- **Key size:** 4096
- **Expiration:** 0 (no expiry) — or 2y if you prefer rotation
- **Real name:** Mihle Iviwe Majokweni
- **Email:** `hello@venturevisionubuntu.co.za` (must match a GitHub-verified email)
- **Passphrase:** choose a strong one

### Step 2: Get the key ID

```bash
gpg --list-secret-keys --keyid-format=long
```

Output looks like:
```
/home/user/.gnupg/pubring.kbx
-------------------------------
sec   rsa4096/ABCDEF1234567890 2026-08-30 [SC]
uid         [ultimate] Mihle Iviwe Majokweni <hello@venturevisionubuntu.co.za>
```

The key ID is the part after `rsa4096/` — e.g., `ABCDEF1234567890`.

### Step 3: Configure git to use the key

```bash
git config --global user.signingkey ABCDEF1234567890
git config --global commit.gpgsign true
git config --global gpg.program gpg
```

### Step 4: Add the public key to GitHub

```bash
# Export the public key
gpg --armor --export ABCDEF1234567890
```

Copy the entire output (including `-----BEGIN PGP PUBLIC KEY BLOCK-----` and `-----END PGP PUBLIC KEY BLOCK-----`).

1. Go to https://github.com/settings/gpg/new
2. Paste the key into the "Key" field
3. Click "Add GPG key"

### Step 5: Test with a signed commit

```bash
git commit -S -m "test: signed commit"
git push origin main
```

On GitHub, the commit should now show a "Verified" badge.

---

## Cache the passphrase (recommended)

Without caching, you'll be prompted for your GPG passphrase on every commit. To cache for 1 hour:

```bash
mkdir -p ~/.gnupg
cat > ~/.gnupg/gpg-agent.conf <<'EOF'
default-cache-ttl 3600
max-cache-ttl 86400
allow-preset-passphrase
EOF

# Restart the agent
gpgconf --kill gpg-agent
gpgconf --launch gpg-agent
```

On macOS, you can use the Keychain:

```bash
git config --global gpg.program gpg2
brew install pinentry-mac
echo "pinentry-program $(brew --prefix)/bin/pinentry-mac" >> ~/.gnupg/gpg-agent.conf
```

---

## Verifying commits

```bash
# Verify a single commit
git verify-commit <commit-hash>

# Verify the latest commit
git verify-commit HEAD

# Show verification info on git log
git log --show-signature -1
```

---

## Re-signing old commits (optional — advanced)

Existing commits remain unsigned. If you want to retroactively sign the entire history:

```bash
git filter-branch --commit-filter 'gpg --detach-sign --local-user "$GIT_COMMITTER_EMAIL" | git commit-tree "$@"' HEAD
```

> ⚠️ **Warning:** This rewrites history. Only do this if you're the sole contributor and no one else has cloned the repo. Force-push required: `git push --force origin main`

For most cases, **leave old commits unsigned** and only sign new ones going forward.

---

## Troubleshooting

### "gpg: signing failed: Inappropriate ioctl for device"

The GPG agent can't prompt for the passphrase. Fix:

```bash
export GPG_TTY=$(tty)
echo "export GPG_TTY=\$(tty)" >> ~/.bashrc  # or ~/.zshrc
```

### "error: gpg failed to sign the data"

Test GPG directly:

```bash
echo "test" | gpg --clearsign
```

If that fails, GPG itself has an issue. Check:

```bash
gpg --list-secret-keys --keyid-format=long
```

Make sure your key is listed with `[ultimate]` trust.

### Commits still show "unverified" on GitHub

1. **Email mismatch:** The email in your git config (`git config user.email`) must match the email on the GPG key, AND must be a verified email on your GitHub account (https://github.com/settings/emails)
2. **Key not added:** Confirm the key is in GitHub at https://github.com/settings/gpg
3. **Wrong key ID:** Run `git config --global user.signingkey` and compare to the key ID on GitHub

### On Vercel/CI — commits from CI are unsigned

If your CI workflow (`validate-deployment.yml`) makes commits, those won't be signed. Either:
- Configure CI to use a separate GPG key stored in GitHub Actions secrets, OR
- Only sign commits made by humans (CI commits stay unsigned — acceptable for automated commits)

---

## What "Verified" actually proves

A signed commit proves:
- ✅ The commit was created by someone with access to the private GPG key
- ✅ The commit content hasn't been tampered with after signing

It does NOT prove:
- ❌ The code itself is safe (signing ≠ code review)
- ❌ The private key hasn't been compromised (rotate if you suspect it)

For full supply-chain integrity, combine GPG signing with:
- Branch protection rules (require signed commits + PR review)
- Dependabot alerts
- Code review on every PR

---

## Support

- **GitHub GPG docs:** https://docs.github.com/en/authentication/managing-commit-signature-verification
- **GPG manual:** `man gpg` or https://www.gnupg.org/documentation/manuals/gnupg/
- **VVU Information Officer:** hello@venturevisionubuntu.co.za

---

*Last updated: 30 August 2026 · SANS 10112 / EIS v1.0 compliant · Zero Fabrication Rule active*
