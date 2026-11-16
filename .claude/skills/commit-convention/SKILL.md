---
name: commit-convention
description: How to write commit messages and pull requests in this repo (SensorDashboard). Use whenever committing, writing a commit message, pushing, or opening or editing a pull request.
---

# Commit and PR convention

The ticket number comes from Linear. The branch name is Linear's `gitBranchName`, for example `arberihh/arb-47-scaffold-rust-service-data-model-rest`, so Linear attaches the PR to the ticket by itself.

## Commit message

```
arb-47: add the sensor model, generator and tick

- port genSensorData.js: the 20 names, sensorId with the hyphen token and
  the per-type reading ranges
- redraw each reading within ±8% of a fixed baseline and recompute
  deviationPercent, like the app's local feed
```

- **Subject:** `arb-<n>: <summary>`. Lowercase, imperative ("add", "fix", "remove"), no full stop, about 70 characters.
  - No ticket (CI, tooling, formatting): use a plain prefix, for example `ci: run static checks in parallel` or `fix tests: raise the jest timeout`.
- **Body:** a blank line, then bullets that start with `- `. Say what changed and why, not how the code reads. Wrap at about 80 characters and indent continuation lines by two spaces. Skip the body when the subject says it all.
- **No co-author trailer and no mention of Claude or any AI** in a commit message or PR description. Do not add `Co-Authored-By`. The author is the user.
- One logical change per commit. Name things by what they do, not by how they were found (no "address review", "fix typo" piles).

## Pull request

- **Title:** the same as the commit subject, for example `arb-47: scaffold the rust service`.
- **Label:** exactly one type label, see the `label-pr` skill.
- **Description:** it is shown in GitHub and mirrored in the Linear review, so write it for a reviewer who has not seen the work.

**Size the description to the change.** Write only what helps a reviewer, and leave out any section that would be empty or only repeat the diff.

| The change is                                     | Write                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A small fix, tweak, rename, config or docs change | **What** in one or two sentences. **How to test** only if it is not obvious. No diagrams.         |
| New behavior with a visible result                | **What** with a before and after table, **Changes**, **Notes** if there are gaps, **How to test** |
| A new flow, endpoint, status or tables            | The above, plus the diagram that matches (below)                                                  |

Sections, in this order, when they apply: **What**, **Diagrams**, **Changes**, **Notes**, **How to test**.

- **Notes:** only real gaps and what was not tested. Never write "no notes".
- **How to test:** only when a reviewer cannot see the check from the tests alone. Write it as a `- [ ]` checklist and check only what you ran, see the `verify-pr-testplan` skill.

**When a diagram earns its place.** Add one only if it shows something a list of bullets or the diff cannot: an order of steps across several parts, a decision with failure paths, status changes, how tables relate, or measured time or cost. One diagram per question, and never one for completeness or to restate the bullets. If no row below fits, use no diagram.

| The reviewer needs to see                                | Mermaid type                                                                                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| The journey of one request through several parts         | `sequenceDiagram` with `autonumber`, and `%%{init: {"sequence": {"mirrorActors": false}}}%%` so the boxes are not repeated at the bottom |
| Decisions and failure paths                              | `flowchart TD`                                                                                                                           |
| Status changes                                           | `stateDiagram-v2`                                                                                                                        |
| Tables and how they relate                               | `erDiagram`                                                                                                                              |
| Where time went, when speed is the point                 | `gantt`                                                                                                                                  |
| Shares of a whole, when cost is the point (tokens, cost) | `pie showData`                                                                                                                           |

Use real numbers from a real run, never invented ones. If a number is an estimate, say so. GitHub renders Mermaid; put `info` in a `mermaid` block to see its version.

## Before committing

Run the checks for the part you changed. The pre-commit hook only formats the staged files, and CI runs everything, so don't re-run the full suite as a final check.

```
# app (repo root)
npm run ts:check && npm run lint && npm run deadcode && npm run format:check
npm test

# backend
cd server && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
```

Do not commit or push unless the user asked. Do not commit generated files, and never run `npm run generate:data` just to commit (it overwrites the seed data).
