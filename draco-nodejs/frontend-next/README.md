# ezRecSports - Frontend

This is the frontend application for ezRecSports, built with [Next.js 15](https://nextjs.org) (App Router), React 19, TypeScript, and Material-UI 7.

## Architecture

📚 **[Frontend Architecture Documentation](./FRONTEND_ARCHITECTURE.md)** - Comprehensive guide to our frontend architecture patterns, principles, and best practices including:

- Dialog management patterns with self-contained components
- Type safety with shared schemas from `@draco/shared-schemas`
- Service hook patterns for API integration
- Real data update patterns (no optimistic updates)
- State management with useReducer dispatch patterns

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` – Cloudflare Turnstile site key used to render the human-verification challenge for account creation and new user registration. Leave unset in local environments to disable the challenge.
- `NEXT_PUBLIC_ENABLE_ADSENSE` – Set to `true` to render Google AdSense inventory in the account header. Keep unset/`false` locally unless you need to validate ad rendering.
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` – The `ca-pub-XXXX` publisher identifier provided by Google. Required when AdSense is enabled.
- `NEXT_PUBLIC_ADSENSE_ACCOUNT_HEADER_SLOT` – Ad slot ID used for the Account page header placement. Pair with auto-format and responsive sizing for optimal monetization.
- `ADSENSE_PUBLISHER_ID` – The `pub-XXXX` publisher ID used to expose `/ads.txt`. The handler strips an optional `ca-` prefix and adds `pub-` if missing so you can reuse the same identifier you provide to Google.
- `ADSENSE_ACCOUNT_RELATIONSHIP` – Optional relationship value for `/ads.txt`; defaults to `DIRECT`. Set to `RESELLER` only if your AdSense configuration requires it.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

<!-- Last deployed: 2025-01-16 -->
