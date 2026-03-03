#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/version.sh <patch|minor|major|semver>
# Examples:
#   ./scripts/version.sh patch
#   ./scripts/version.sh minor
#   ./scripts/version.sh 2.1.0

VERSION_INPUT="${1:?Usage: $0 <patch|minor|major|semver>}"

# Bump the root version without creating a git commit/tag yet
npm version "${VERSION_INPUT}" --no-git-tag-version --allow-same-version --no-commit-hooks

# Read the new version from root package.json
NEW_VERSION=$(node -p "require('./package.json').version")
echo "New version: ${NEW_VERSION}"

# Sync version to all workspace package.json files
for pkg in $(find apps packages -name 'package.json' -not -path '*/node_modules/*' -not -path '*/build/*' -not -path '*/dist/*' -not -path '*/.expo/*' -not -path '*/Pods/*'); do
  current=$(node -p "require('./${pkg}').version")
  if [ "${current}" != "0.0.0" ]; then
    echo "Updating ${pkg}: ${current} -> ${NEW_VERSION}"
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('${pkg}', 'utf8'));
      pkg.version = '${NEW_VERSION}';
      fs.writeFileSync('${pkg}', JSON.stringify(pkg, null, 2) + '\n');
    "
  else
    echo "Skipping ${pkg} (version 0.0.0)"
  fi
done

echo "Done! All packages updated to ${NEW_VERSION}."
