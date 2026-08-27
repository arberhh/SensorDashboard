---
name: label-pr
description: Use whenever creating a pull request for this repo (SensorDashboard). Every PR must carry one of the repo's type labels (feat/fix/refactor/docs/chore/test), applied by you — a second label auto-added by Linear's GitHub sync is expected and fine, but don't apply more than one yourself.
---

# Label every PR by type

This repo uses six labels to classify what kind of change a PR is.
Every PR must have one of them applied by you before it's considered
ready — an unlabeled PR is an incomplete PR, not a formatting nit to
skip. Up to two labels total is fine if the second arrived via
Linear's auto-sync (see below); you should still only ever apply one.

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

3. **Apply exactly one type label yourself — don't intentionally
   stack more.** These are mutually exclusive classifications; if a
   PR genuinely doesn't fit one type, that's a sign it should
   probably be split, not multi-labeled by you.

   In practice, PRs linked to a Linear issue (branch name matching
   the issue's `gitBranchName`) can end up with a second label —
   Linear's own GitHub sync has been observed auto-adding `feat` to
   the PR independent of anything this skill does (seen on PR #1 and
   PR #2). That's outside this skill's control and not worth fighting
   after the fact. **Two labels total is acceptable** when the second
   one arrived this way; the rule is about what *you* deliberately
   apply, not about scrubbing labels Linear adds on its own. If a PR
   ever has three or more, or two labels neither of which trace back
   to Linear's auto-add, that's a real signal something's wrong —
   fix it rather than ignore it.

4. **If a label from this set doesn't exist in the repo yet**
   (`gh label list`), create it before applying — don't silently
   fall back to a GitHub default label like `enhancement` or `bug`
   instead.

## Non-negotiable

Never open a PR without one of these six labels attached. If you're
genuinely unsure which type fits, ask rather than guessing — the
label is read by reviewers to triage at a glance, so a wrong label
is worse than a delayed one.
