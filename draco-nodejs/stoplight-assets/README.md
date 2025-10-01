# @draco/stoplight-assets

Static bundle of Stoplight Elements web components and styles. These assets are generated from
`@stoplight/elements` and copied into `dist/`. The backend serves them directly without pulling
React or the full Stoplight dependency tree into the runtime workspace.

To refresh to the latest Stoplight version, run `npm install` at the repo root, then execute:

```bash
npm run update -w @draco/stoplight-assets
```

The update script re-downloads the assets from `@stoplight/elements` and overwrites the contents of
`dist/`. Commit the resulting changes along with any version bumps.
