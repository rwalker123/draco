# API Documentation Deep Linking Implementation - DO NOT REPEAT PREVIOUS MISTAKES

## **CRITICAL REQUIREMENTS:**
1. **NEVER use `git checkout` or `git reset`** - this will destroy uncommitted changes
2. **NEVER use complex `sed` commands** that can break file syntax
3. **ALWAYS preserve existing permission changes and other modifications** in route files
4. **Work with the current state of files** - don't assume they're in any particular state

## **What to Implement:**
Update the remaining backend route files to use JSDoc deep linking instead of OpenAPI comments, following the pattern established in `accounts-player-classifieds.ts`.

## **Required Format:**
```typescript
/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/{operationId} API Documentation}
 * @see {@link file:///path/to/openapi.yaml#L{lineNumber} OpenAPI Source}
 */
```

## **Steps to Follow:**
1. **First, add `operationId` to OpenAPI spec** (`openapi.yaml`) for each endpoint that doesn't have one
2. **Use the utility function** from `src/utils/docLinks.ts` to generate correct URLs
3. **Update route files one by one** using `search_replace` with specific context
4. **Test each file** with `npm run build` and `npx eslint` before moving to the next
5. **Preserve all existing functionality** - only change the documentation comments

## **Files to Update:**
- [List the specific route files that need updating]
- [Include the operation IDs that need to be added to OpenAPI spec]

## **Previous Mistakes to Avoid:**
- ❌ Using `git checkout` (destroys uncommitted work)
- ❌ Complex `sed` commands that break syntax
- ❌ Assuming file state without reading current content
- ❌ Making bulk changes without testing individual files
- ❌ Not preserving existing permission changes and business logic

## **Testing Requirements:**
- Run `npm run build` after each file update
- Run `npx eslint` on each updated file
- Verify deep links work in Swagger UI
- Confirm no existing functionality is broken

## **Example of Successful Implementation:**
The `accounts-player-classifieds.ts` file now has:
- ✅ All OpenAPI comments replaced with JSDoc links
- ✅ Correct deep linking format: `#/PlayerClassifieds/{operationId}`
- ✅ All existing permissions and business logic preserved
- ✅ Build and linting passing successfully

## **When Ready to Continue:**
Use this guide to implement deep linking in other route files, following the established pattern and avoiding the mistakes made during the initial implementation.
