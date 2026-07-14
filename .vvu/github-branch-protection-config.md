# VVU Trust Chain v3.1 - GitHub Branch Protection Configuration

## Manual Configuration Steps

### Step 1: Configure Branch Protection for `main`

**URL:** https://github.com/divhanimajokweni-ctrl/proofbridge-liner/settings/branches

#### Branch protection rules:

1. **Require a pull request before merging** ✅
   - [x] Require approvals: `1`
   - [x] Dismiss stale pull request approvals when new commits are pushed

2. **Require status checks to pass before merging** ✅
   - [x] Search for: `Deploy Verification Gate`
   - [x] Select: `Deploy Verification Gate`
   - [x] Require branches to be up to date before merging

3. **Require linear history** ⏭️ (Optional but recommended)
   - [ ] Prevent merge commits with multiple base branches

4. **Require signed commits** ⏭️ (Recommended for maximum security)
   - [ ] Require all commits to be signed with GPG

5. **Include administrators** ✅
   - [x] Include administrators in the above requirements

6. **Restrict who can push to matching branches** ✅
   - [x] Restrict push access to specific users/teams
   - [x] Only allow: `@divhanimajokweni`

7. **Block force pushes** ✅
   - [x] Do not allow force pushes
   - [x] Do not allow deletions

### Step 2: Enforce CODEOWNERS

**URL:** https://github.com/divhanimajokweni-ctrl/proofbridge-liner/settings/branches

For branch `main`:
- [x] Require a review from Code Owners

The `.github/CODEOWNERS` file already specifies:
```
# VVU CI/CD Trust Chain — protected paths
.github/workflows/   @divhanimajokweni
scripts/             @divhanimajokweni
.manifest.json       @divhanimajokweni
.manifest.json.sig   @divhanimajokweni
SECURITY.md          @divhanimajokweni

# Default owners for everything
* @mino
```

### Step 3: Configure Repository Variables (Optional)

**URL:** https://github.com/divhanimajokweni-ctrl/proofbridge-liner/settings/variables/actions

Add variable:
- **Name:** `PROD_HEALTH_URL`
- **Value:** `https://venturevisionubuntu.co.za/api/health` (or your custom endpoint)

### Step 4: Verify Configuration

After configuration, test with:

```bash
# Test branch protection
gh api repos/divhanimajokweni-ctrl/proofbridge-liner/branches/main/protection

# Test CODEOWNERS enforcement
gh api repos/divhanimajokweni-ctrl/proofbridge-liner/contents/.github/CODEOWNERS
```

### Step 5: Test the Configuration

1. **Create a test PR without CODEOWNERS approval:**
   - Modify a file in `.github/workflows/`
   - Create PR from a different user
   - **Expected:** PR cannot be merged without @divhanimajokweni review

2. **Create a test PR with fabricated DEPLOY_LOG.md:**
   - Add false deployment claims to DEPLOY_LOG.md
   - Create PR to main
   - **Expected:** Deploy Verification Gate workflow blocks merge

3. **Create a test PR with valid changes:**
   - Make a real change
   - Wait for CI to pass
   - Update DEPLOY_LOG.md with actual results
   - **Expected:** PR can be merged after CODEOWNERS approval

## GitHub CLI Commands (for reference)

Note: These commands require authentication and may be restricted in some environments.

```bash
# Get current branch protection
gh api repos/OWNER/REPO/branches/main/protection

# Update branch protection (requires admin access)
gh api repos/OWNER/REPO/branches/main/protection \
  -X PUT \
  -f required_status_checks='{"strict":true,"contexts":["Deploy Verification Gate"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":1}' \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

## Verification Checklist

| Task | Status | Notes |
|------|--------|-------|
| Branch protection configured | ⏳ | Manual step required |
| CODEOWNERS enforcement enabled | ⏳ | Manual step required |
| Status checks configured | ⏳ | Deploy Verification Gate required |
| Force pushes blocked | ⏳ | Manual step required |
| Deletions blocked | ⏳ | Manual step required |
| Administrator enforcement | ⏳ | Manual step required |

## Troubleshooting

### Issue: Branch protection not saving
- Ensure you have admin access to the repository
- Check that no other branch protection rules conflict
- Clear browser cache and retry

### Issue: CODEOWNERS not enforced
- Verify CODEOWNERS file is in `.github/` directory
- Check file syntax (no tabs, proper formatting)
- Ensure branch protection has "Require a review from Code Owners" enabled

### Issue: Status check not found
- Verify workflow name matches exactly: `Deploy Verification Gate`
- Check that workflow exists in `.github/workflows/`
- Ensure workflow has run at least once

## Contact

For assistance with GitHub configuration, contact:
- Repository Owner: @divhanimajokweni
- GitHub Support: https://support.github.com
