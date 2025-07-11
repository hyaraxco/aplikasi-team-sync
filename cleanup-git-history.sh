#!/bin/bash

# Git History Cleanup Script for Team Sync
# This script removes sensitive files from Git history

echo "🚨 WARNING: This will rewrite Git history!"
echo "Make sure you have:"
echo "1. Backed up your repository"
echo "2. Coordinated with your team"
echo "3. Revoked the compromised service account"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Operation cancelled."
    exit 1
fi

echo "🔄 Starting Git history cleanup..."

# Remove sensitive files from entire Git history
echo "Removing serviceAccountKey.json from history..."
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch admin-script/serviceAccountKey.json' \
--prune-empty --tag-name-filter cat -- --all

echo "Removing setClaimAdmin.js from history..."
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch admin-script/setClaimAdmin.js' \
--prune-empty --tag-name-filter cat -- --all

echo "Removing entire admin-script directory from history..."
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch -r admin-script/' \
--prune-empty --tag-name-filter cat -- --all

# Clean up the filter-branch backup
echo "Cleaning up filter-branch backup..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Git history cleanup completed!"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Review the changes: git log --oneline"
echo "2. Force push to remote: git push origin --force --all"
echo "3. Force push tags: git push origin --force --tags"
echo ""
echo "🚨 WARNING: After force pushing, all team members must:"
echo "1. Delete their local repository"
echo "2. Clone fresh from remote"
echo "3. Never use the old repository again"
