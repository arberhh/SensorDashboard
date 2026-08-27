---
name: label-pr
description: Use whenever creating a pull request for this repo (SensorDashboard). Every PR must carry exactly one of the repo's type labels (feat/fix/refactor/docs/chore/test) so the change type is clear at a glance.
---

# Label every PR by type

This repo uses six labels to classify what kind of change a PR is.
Every PR must have exactly one of them applied before it's considered
ready — an unlabeled PR is an incomplete PR, not a formatting nit to
skip.

| Label | Use when the PR is... |
|---|---|
| `feat` | a new feature or capability |
| `fix` | a bug fix |
| `refactor` | a code change with no behavior change |
| `docs` | documentation only |
| `chore` | tooling, deps, config, maintenance |
| `test` | adding or fixing tests |

## Process

1. **Determine the type from the actual diff**, not from the PR
   title alone. Read `git diff` / `git log` for the commits going
   into the PR and judge what the change actually does. If a PR
   mixes types (e.g. a feature plus incidental refactor), pick the
   label matching the PR's primary intent — don't guess from
   surface-level file names.

2. **Apply the label at creation time**:
   ```
   gh pr create --title "..." --body "..." --label <label>
   ```
   If the PR already exists, add it after the fact:
   ```
   gh pr edit <PR#> --add-label <label>
   ```

3. **One label, not several.** These are mutually exclusive
   classifications of change type — don't stack `feat` and `refactor`
   on the same PR. If a PR genuinely doesn't fit one type, that's a
   sign it should probably be split, not multi-labeled.

4. **If a label from this set doesn't exist in the repo yet**
   (`gh label list`), create it before applying — don't silently
   fall back to a GitHub default label like `enhancement` or `bug`
   instead.

## Non-negotiable

Never open a PR without one of these six labels attached. If you're
genuinely unsure which type fits, ask rather than guessing — the
label is read by reviewers to triage at a glance, so a wrong label
is worse than a delayed one.
