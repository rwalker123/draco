# Photo Gallery Implementation Prompt Sequence

Use these prompts sequentially to implement the photo gallery plan. Each step should conclude with passing tests and a commit-ready state.

1. **Create Submission Data Model**
   - Prompt: “Add database schema changes for photo submissions (Prisma models, migrations), plus server-side TypeScript types. Do not wire them into runtime logic yet. Run `npm run lint --workspaces`.”
   - Expected outcome: new schema definitions and generated client, no behavior change.

2. **Introduce Repository Layer**
   - Prompt: “Implement repository/service helpers to create, fetch, approve, and deny submission records, including storage path helpers and validation. Cover with unit tests (`npm run backend:test`). Do not expose via API yet.”
   - Expected outcome: backend logic with tests, but unused externally.

3. **Add Submission Upload Endpoints**
   - Prompt: “Expose REST endpoints for account/team photo submissions, leveraging existing upload pipeline for resizing and temp storage. Return staged submission records. Add integration tests or contract tests. Run backend test suite.”
   - Expected outcome: POST endpoints live, but approvals not wired.

4. **Add Moderation Endpoints**
   - Prompt: “Implement GET listing for pending submissions and POST approve/deny endpoints with permission guards, album quota checks, and asset promotion/deletion. Send placeholder events for email notifications. Ensure tests cover success and failure paths.”
   - Expected outcome: moderation API complete, emails still stubbed.

5. **Implement Email Notifications**
   - Prompt: “Extend mailer utilities to send submission received/approved/denied emails using existing template patterns. Hook into submission and moderation flows, and add unit tests for message composition. Run backend tests.”
   - Expected outcome: emails triggered with reusable helpers.

6. **Account UI Updates**
   - Prompt: “Add pending submissions panel to the account home page: fetch moderation data, render cards with approve/deny actions, handle denial reason modal, refresh on success. Update existing gallery component to hide panel for non-moderators. Run frontend tests (`npm run frontend:test`).”
   - Expected outcome: account moderators can review submissions in UI.

7. **Team UI Updates**
   - Prompt: “Mirror the pending submissions panel on team pages, scoped to the active team season. Ensure role checks (team admin/photo admin) and reuse shared components where possible. Update tests.”
   - Expected outcome: team-level moderation interface working.

8. **Submitter Upload Experience**
   - Prompt: “Extend upload forms for authenticated contacts: allow selecting target account album or current team, submit via new endpoints, and show success/pending states. Enforce title/caption limits client-side. Cover with tests.”
   - Expected outcome: contacts can submit photos without admin rights.

9. **Error Handling & Telemetry**
   - Prompt: “Add frontend error banners and backend logging/metrics for submission failures, quota violations, and email errors. Ensure no regressions by rerunning full workspace lint and tests.”
   - Expected outcome: robust observability and UX feedback.

10. **Cleanup & Documentation**
    - Prompt: “Update developer docs with API examples, workflow notes, and deployment considerations. Double-check migrations and tests. Prepare final change summary.”
    - Expected outcome: documentation aligned; repository ready for release.
