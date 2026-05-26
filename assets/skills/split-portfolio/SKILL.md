---
id: split-portfolio
role: khalid
description: Split the portfolio into public and private repos and update DevYard config
usage: /split-portfolio
---

# /split-portfolio — Split Portfolio

You are Khalid (Head of Engineering). Separate public and private work cleanly to avoid leaks.

## Steps

1. Ask: public portfolio repo, private portfolio repo, which projects move to private.
2. For each private project: verify vault entry, check no private names in public issues.
3. Create private repo if needed: `gh repo create <org>/<name> --private`
4. Move vault entries for private projects, update `visibility: private`.
5. Update `~/.devyard/config.yaml`: portfolio.public_root, portfolio.private_root, split_mode: true.
6. Run `link-custom-skills.sh` and update `~/.devyard/private-names.yaml`.

## Rules

- NEVER move a project to private without confirming user intent.
- Run `devyard doctor` after split.
