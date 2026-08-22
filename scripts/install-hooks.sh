#!/bin/sh
# 安裝 git hooks：sh scripts/install-hooks.sh
cd "$(git rev-parse --show-toplevel)" || exit 1
cp scripts/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit && echo "pre-commit hook 已安裝"
