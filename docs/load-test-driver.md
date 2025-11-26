# Load Test Driver

This script simulates members visiting the site with a configurable hourly load profile. It is intended to help estimate peak-season traffic and the resulting Railway usage.

## Files
- `scripts/load-test-driver.js` — orchestrates arrival scheduling, concurrency limiting, and request execution.
- `scripts/load-test.config.example.json` — a sample profile modeled around 1,200 members with heavier daytime traffic.

## Configuration
Update the JSON config (copy the example to `scripts/load-test.config.json` to keep a personal version):

| Field | Purpose |
| --- | --- |
| `baseUrl` | The target host (e.g., `http://localhost:3000` for local, production URL for real load). |
| `memberCount` | Number of modeled members. Arrival rates scale with this number. |
| `durationMinutes` | How long to keep scheduling requests. In-flight work is allowed to finish afterward. |
| `maxConcurrentRequests` | Upper bound for simultaneous requests to avoid overwhelming the service. |
| `requestTimeoutMs` | Abort threshold for a single request. |
| `logSummaryEverySeconds` | Progress log cadence. |
| `dryRun` | When true, simulate latency without calling the site (useful for verifying settings). |
| `accountId` | ID substituted into page paths containing `{accountId}` placeholders (e.g., `/account/{accountId}/home`). |
| `usernameEnvVar` / `passwordEnvVar` | Environment variable names that contain credentials; when provided the driver adds a Basic auth header. |
| `hourlyVisitProfile` | 24-element array of visits **per member per hour**; the script converts this into requests per minute for the active hour. |
| `dayOfWeekMultipliers` (optional) | Seven weights (Sunday → Saturday) to reflect weekday vs. weekend traffic; defaults to all 1s. |
| `pages` | Weighted list of paths (and optional `method`/`headers`) to visit; `{accountId}` placeholders are resolved from the config. |
| `maxRequests` (optional) | Cap on the total number of requests to enqueue for short smoke runs. |
| `memberCount` CLI override | Use `--member-count <number>` to adjust the modeled population without editing the JSON. |

## Running the driver
```
# Dry run with the sample profile for 5 minutes
node scripts/load-test-driver.js --config scripts/load-test.config.example.json --duration 5 --dry-run

# Point at a live environment (remove --dry-run) and cap total requests
node scripts/load-test-driver.js --config scripts/load-test.config.example.json --base-url https://your.site --member-count 1400 --max-requests 500
```

Progress logs include in-flight and pending counts plus the current hourly rate. The final summary shows how many requests were scheduled, finished, and failed, along with average latency and the concurrency cap used.

### Offseason profile based on recent page views

The sample JSON now mirrors the provided offseason table (about 991 page views over a week, ~141/day across ~1,200 members):

- `hourlyVisitProfile` sums to ~0.12 visits per member per day (≈144 requests/day for 1,200 members) and skews toward daytime hours.
- `dayOfWeekMultipliers` translate the table into Sunday-first weights: `[0.738, 0.957, 1.135, 0.986, 1.298, 1.085, 0.794]`.

Use `--duration` to cover a representative window (e.g., a 24-hour dry run locally) and adjust the multipliers upward to model peak-season growth while preserving the weekday/weekend shape.

## Estimating Railway costs
Railway bills per-second for usage; use the totals from the summary to estimate runtime:
1. Record `Finished`, `Avg latency`, and the duration of the run.
2. Multiply `Finished` by `Avg latency` to approximate aggregate service time (in milliseconds) consumed by requests.
3. Convert to compute-seconds (`aggregateMs / 1000`) and scale to an hour/day using the hourly profile to gauge peak-season costs relative to the current ~$5/month offseason baseline.

Run the script against staging first, then carefully ramp `maxConcurrentRequests` and the hourly profile before pointing at production.
