#!/usr/bin/env bash
set -e
mkdir -p .husky
cat > .husky/pre-commit <<'EOF'
#!/usr/bin/env bash
set -e
node scripts/secret-scan-precommit.js
EOF
chmod +x .husky/pre-commit
echo 'Installed .husky/pre-commit secret scanner.'
