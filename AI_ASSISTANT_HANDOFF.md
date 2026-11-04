# AI Assistant Implementation Handoff

This handoff summarizes the current Ask AI experience and the planner prototypes so future work can continue without reconstructing the interaction or its limits.

## Main files

- `src/components/AIAssistant.jsx` contains quick-start prompts, local prompt analysis, assistant activity, guided release and revert planners, preflight checks, preview answers, and demo approval/handoff behavior.
- `src/components/Sidebar.jsx` hosts the resizable Ask AI sidebar and its compact header controls.
- `src/index.css` styles the full-page and compact assistant, glass shortcut cards, composer, message activity, guided forms, manifests, approval states, and sidebar behavior.
- `AI_ASSISTANT_WORKFLOW.patch` records the current uncommitted source and handoff changes as a patch against the current parent commit.

## Quick starts and conversation flow

The four start cards are **Version drift**, **Revert plan**, **Plan your upcoming release**, and **Release readiness**. Version drift and readiness use the local dashboard analysis. The release and revert shortcuts are presented as ordinary user prompts first: the prompt appears in the transcript, the assistant shows its existing activity window, then responds that it needs a few details. The user explicitly starts the relevant guided questions with the response button.

The activity animation is a local UI preview driven by `getAgentSteps(...)` and the `thinking` message state. It does not call an external agent or model.

## Guided release planner

`ReleasePlanner(...)` branches between main and off-cycle releases.

- Main release collects a release name/version, planned date, repository scope, and acknowledgment of selected repositories with flagged version differences.
- Off-cycle release collects a repository, its dashboard PROD baseline, target version, reason, and change-order or approval reference.
- `getReleasePlanChecks(...)` validates required values and version differences before the local preview answer is prepared.
- Before a real LLM request, a backend should re-read live PROD versions, repository health, and approval/change-order state. This is marked with a `TODO(backend)` comment.

## Guided revert planner

`RevertPlanner(...)` offers two strategies:

- Restore a previously verified Foundation version from RelCur.
- Revert selected production repositories to specified old versions while keeping every unselected repository at its current PROD version.

The review step displays the RelCur manifest, reason, incident/change reference, and validation checklist. The preview then simulates validation, manifest composition, and a build result before presenting a human approval gate. The demo Foundation build version is synthesized from dashboard data; it is not a real RelCur result. Approval/decline only updates local UI state and never deploys.

Before production use, backend integration should validate the live PROD and last-successful RelCur data, submit the manifest, return the actual Foundation version, and enforce authorized human approval before deployment. See the `TODO(backend)` comment in `startRevertRun(...)`.

## UI and visual treatment

The Ask AI page and compact sidebar use dark blue glass panels, cyan-blue-white gradient shortcut icons, subtle card glow, and a matching gradient composer border and send button. The four shortcut icons share the Version drift color treatment. The sidebar also keeps its existing resize behavior and opening reflection sweep.

## Other assistant behavior

- `analyzePrompt(...)` maps free-text requests to bundled release and repository data.
- `MarkdownContent(...)` and `renderInlineMarkdown(...)` render simple tables, inline code, and bold text.
- `describeApprovalOperation(...)` summarizes local demo actions for the approval preview.
- `stopGeneration(...)` ends a pending local response and replaces it with a stopped state.
- Human handoff drafts are local previews; no ticket or message is sent.

## Validation and demo boundary

The current implementation was checked with `npm run build` and `git diff --check`, and the compact Ask AI/release planner interaction was reviewed in the local app. No external model, RelCur pipeline, deployment API, ticketing integration, or release mutation is connected. Treat all generated analysis, build output, and approval states as prototype UI until those integrations are implemented.
