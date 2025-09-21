# AI Code Review Workflows

## GPT-5 Codex Review
- GitHub action: `.github/workflows/gpt5-codex-review.yml`
- Secrets required:
  - `OPENAI_API_KEY`: OpenAI API key with access to the GPT-5 Codex model
- Action events: pull request (opened, synchronize, reopened, ready_for_review) and manual `workflow_dispatch`
- Behavior: Fetches the PR diff (truncated to 60k characters), calls OpenAI `responses` API, and posts the response as a PR comment with actionable feedback.
- Failure handling: Missing secrets or API errors fail the job with a descriptive message.

### Setup
1. `gh secret set OPENAI_API_KEY --body "$OPENAI_API_KEY"` (or configure via repository settings UI).
2. Trigger via manual dispatch (`Actions` → `GPT-5 Codex Code Review` → `Run workflow`) to validate.
3. For sanity check, open a test PR and ensure the bot comment appears.

## Claude Code Review (Paused)
- GitHub action: `.github/workflows/claude-code-review.yml`
- Automatic triggers are commented out; run manually via `workflow_dispatch` if needed.
- Preserved configuration for potential reactivation.

