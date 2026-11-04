# AI Assistant Implementation Handoff

This guide preserves the original AI assistant handoff and adds the newer Ask AI prompt flow, guided release planner, guided revert planner, and visual updates. It is intended to help a developer continue the work without losing the earlier implementation notes.

## Files

- `src/components/AIAssistant.jsx` contains local prompt analysis, response rendering, Markdown tables, simulated tool activity, human approval, handoff drafts, stop behavior, quick starts, and the guided release and revert planners.
- `src/components/Sidebar.jsx` contains the drag-resizable assistant panel and compact Ask AI controls.
- `src/index.css` contains page and sidebar panel styling, messages, composer, activity, approval, handoff, Markdown, stop, resize, planner, and glass-card visual treatments.
- `AI_ASSISTANT_WORKFLOW.patch` is the unified patch artifact for the assistant workflow and UI changes in the preceding implementation commit.

## Original reuse guide

### Repository answers and release context

`analyzePrompt(...)` maps a question to the bundled dashboard data. It handles revert planning first, then repository-name lookups, readiness, version drift, change governance, and the general overview. Repository lookups report PROD, non-PROD, and HF versions where available and attach a source label and repository action.

Add a new intent by adding a condition to `analyzePrompt(...)` and return an answer object with `title`, `summary`, `points`, and optional `source`, `repo`, `markdown`, or `handoff` values.

### Markdown and free-text revert planning

`MarkdownContent(...)` and `renderInlineMarkdown(...)` safely render React text for table rows, inline bold, and code. Free-text revert prompts produce a table listing every repository's current non-PROD version and proposed target. That fallback assumes the PROD version is the revert target and flags rows that are already aligned. Human review is offered before any changes; the demo does not apply a revert. The **Revert plan** quick start now uses the guided revert planner described below.

### Tool activity and approval gate

`getAgentSteps(...)` maps prompt words to activity labels. Higher impact terms such as deploy, publish, migration, delete, provision, execute, or finalize pause at the approval prompt. `describeApprovalOperation(...)` determines the action and target shown before the decision. Approval is illustrative local state only; no API call or release change is connected.

### Stop generation

While `thinkingId` is set, the composer replaces Send with Stop. `stopGeneration(...)` clears the timer, dismisses pending approval, and replaces the loading state with a stopped response.

### Human handoff draft

Revert results expose **Prepare human handoff**. The local draft carries the conversation, selected release, and version rows. Preparing it adds a confirmation to chat. No support ticket or message is sent because no service is connected.

### Resizing and original sidebar behavior

`Sidebar.jsx` tracks assistant width and constrains it to the viewport. Its invisible right-edge separator supports pointer dragging, arrow keys, Home to reset, End and double-click to expand. `index.css` defines its hit area and assistant visual treatments. The opening reflection sweep is on `.sidebar-ai-content::after` and plays when the assistant panel mounts.

## New quick-start conversation flow

The four quick-start cards are **Version drift**, **Revert plan**, **Plan your upcoming release**, and **Release readiness**. Version drift and readiness open local dashboard analysis. The release and revert shortcuts are submitted as normal user prompts: the prompt appears in the transcript, the assistant shows its existing thinking/activity window, and then it replies that it needs a few details. The user starts the guided questions with the response button. This behavior is implemented by `queuePlannerPrompt(...)` and `openPlanner(...)`.

The activity animation is a local UI preview driven by `getAgentSteps(...)` and the `thinking` message state. It does not call an external agent or model.

## Guided release planner

`ReleasePlanner(...)` branches between main and off-cycle releases.

- Main release collects a release name or version, planned date, repository scope, and acknowledgment of selected repositories with flagged version differences.
- Off-cycle release collects a repository, its dashboard PROD baseline, target version, reason, and change-order or approval reference.
- `getReleasePlanChecks(...)` validates required values and version differences before the local preview answer is prepared.
- Before a real LLM request, a backend should re-read live PROD versions, repository health, and approval/change-order state. This is marked with a `TODO(backend)` comment.

## Guided revert planner

`RevertPlanner(...)` offers two strategies:

- Restore a previously verified Foundation version from RelCur.
- Revert selected production repositories to specified old versions while keeping every unselected repository at its current PROD version.

The review step displays the RelCur manifest, reason, incident/change reference, and validation checklist. The preview simulates validation, manifest composition, and a build result before presenting a human approval gate. The demo Foundation build version is synthesized from dashboard data; it is not a real RelCur result. Approval or decline only updates local UI state and never deploys.

Before production use, backend integration should validate live PROD and last-successful RelCur data, submit the manifest, return the actual Foundation version, and enforce authorized human approval before deployment. See the `TODO(backend)` comment in `startRevertRun(...)`.

## Current visual treatment

The full-page Ask AI surface and compact sidebar use dark blue glass panels, cyan-blue-white gradient shortcut icons, subtle card glow, and a matching gradient composer border and send button. All four shortcut icon tiles use the same gradient. The sidebar retains its resize behavior and opening reflection sweep.

## Demo boundary and validation

Answers use bundled dashboard data. Tool activity, approval, and handoff are UI demonstrations only. No external model, RelCur pipeline, deployment API, ticketing integration, or release mutation is connected. Treat generated analysis, Foundation build output, and approval states as prototype UI until the related integrations exist.

The current implementation was checked with `npm run build` and `git diff --check`, and the compact Ask AI/release planner interaction was reviewed in the local app.
