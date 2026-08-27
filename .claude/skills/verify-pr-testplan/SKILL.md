---
name: verify-pr-testplan
description: Use whenever creating or updating a pull request for this repo (SensorDashboard) that includes a "Test plan" checklist. Instead of leaving the checklist unverified for a human, actually run the app and execute each item, then check off only what was genuinely confirmed.
---

# Verify PR test plan

A PR test plan checklist is a claim, not a formality. Don't hand the
reviewer a checklist of `- [ ]` boxes you haven't actually tried —
that just moves the verification work onto them. Do it yourself
before (or immediately after) `gh pr create`.

## Process

1. **Build, launch, and confirm the app is actually running** using
   the `run-sensordashboard` skill — it owns setup (pod install),
   launch, and how to verify via screenshot/Metro log for this
   project. Load it first; don't restate its steps here.

2. **Work through the test plan line by line.** For each item,
   perform the concrete action it describes and observe real
   output — don't infer behavior from reading the diff. Use
   `run-sensordashboard`'s verification techniques (screenshot,
   Metro log, repeated checks for duration claims) as the mechanism
   for each line item, not just for the initial launch.

3. **Update the PR body** with `gh pr edit <PR#> --body-file <file>`,
   changing `- [ ]` to `- [x]` only for items you personally
   verified this way.

4. **Never silently check a box you didn't verify.** If an item
   can't be tested (environment limitation), fails, or is genuinely
   subjective/manual, leave it unchecked and add a short comment via
   `gh pr comment` explaining why — so nothing gets silently merged
   on a false claim of verification.

5. **Report back** to the user which boxes were checked, which were
   left open and why, and flag anything that actually failed rather
   than just not-yet-tested.

## Non-negotiable

Static code reading is not evidence for a runtime test plan item.
If the checklist says "confirm X happens when running," the bar is
watching it happen — screenshot, log line, or simulator interaction
— not "the code looks like it should do that."
