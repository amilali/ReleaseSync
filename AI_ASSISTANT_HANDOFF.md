# AI Assistant Implementation Handoff

This guide records the assistant work in this commit so another developer or AI can locate and reuse each feature.

## Files

- `src/components/AIAssistant.jsx` contains local prompt analysis, response rendering, Markdown tables, simulated tool activity, human approval, handoff drafts, and stop behavior.
- `src/components/Sidebar.jsx` contains the drag-resizable assistant panel.
- `src/index.css` contains panel, message, composer, activity, approval, handoff, Markdown, stop, and resize styles.

## Reuse guide

### Repository answers and release context

`analyzePrompt(...)` maps a question to the bundled dashboard data. It handles revert planning first, then repository-name lookups, readiness, version drift, change governance, and the general overview. Repository lookups report PROD, non-PROD, and HF versions where available and attach a source label and repository action.

Add a new intent by adding a condition to `analyzePrompt(...)` and return an answer object with `title`, `summary`, `points`, and optional `source`, `repo`, `markdown`, or `handoff` values.

### Markdown and revert planning

`MarkdownContent(...)` and `renderInlineMarkdown(...)` safely render React text for table rows, inline bold, and code. Revert prompts produce a table listing every repository's current non-PROD version and proposed target. The current demo assumes the PROD version is the revert target and flags rows that are already aligned. Human review is offered before any changes; the demo does not apply a revert.

### Tool activity and approval gate

`getAgentSteps(...)` maps prompt words to activity labels. Higher impact terms such as deploy, publish, migration, delete, provision, execute, or finalize pause at the approval prompt. `describeApprovalOperation(...)` determines the action and target shown before the decision. Approval is illustrative local state only; no API call or release change is connected.

### Stop generation

While `thinkingId` is set, the composer replaces Send with Stop. `stopGeneration(...)` clears the timer, dismisses pending approval, and replaces the loading state with a stopped response.

### Human handoff draft

Revert results expose **Prepare human handoff**. The local draft carries the conversation, selected release, and version rows. Preparing it adds a confirmation to chat. No support ticket or message is sent because no service is connected.

### Resizing and visual behavior

`Sidebar.jsx` tracks assistant width and constrains it to the viewport. Its invisible right-edge separator supports pointer dragging, arrow keys, Home to reset, End and double-click to expand. `index.css` defines its hit area and the assistant visual treatments. The opening reflection sweep is on `.sidebar-ai-content::after` and plays when the assistant panel mounts.

## Demo boundary

Answers use bundled dashboard data. Tool activity, approval, and handoff are UI demonstrations only. No external model, operation API, ticketing integration, or release mutation is connected.
