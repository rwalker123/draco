#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG_PATH = path.join(__dirname, 'load-test.config.json');
const EXAMPLE_CONFIG_PATH = path.join(__dirname, 'load-test.config.example.json');
const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_MAX_CONCURRENCY = 50;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_LOG_INTERVAL_SECONDS = 30;
const MIN_INTERVAL_MS = 5;
const DAYS_IN_WEEK = 7;

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  // Allow inline allowlist comments for detect-secrets without breaking JSON parsing.
  const sanitized = raw.replace(/\s*\/\/\s*pragma: allowlist secret/g, '');

  return JSON.parse(sanitized);
}

function resolveConfigPath(cliPath) {
  if (cliPath) {
    return cliPath;
  }

  if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
    return DEFAULT_CONFIG_PATH;
  }

  return EXAMPLE_CONFIG_PATH;
}

function parseArgs(argv) {
  const args = {};

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case '--config':
        if (!next || next.startsWith('--')) {
          throw new Error('--config requires a value');
        }
        args.configPath = next;
        i += 1;
        break;
      case '--duration':
        if (!next || Number.isNaN(Number(next))) {
          throw new Error('--duration requires a numeric value');
        }
        args.durationMinutes = Number(next);
        i += 1;
        break;
      case '--base-url':
        if (!next || next.startsWith('--')) {
          throw new Error('--base-url requires a value');
        }
        args.baseUrl = next;
        i += 1;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--max-requests':
        if (!next || Number.isNaN(Number(next))) {
          throw new Error('--max-requests requires a numeric value');
        }
        args.maxRequests = Number(next);
        i += 1;
        break;
      case '--member-count':
        if (!next || Number.isNaN(Number(next))) {
          throw new Error('--member-count requires a numeric value');
        }
        args.memberCount = Number(next);
        i += 1;
        break;
      case '--help':
        args.help = true;
        break;
      default:
        break;
    }
  }

  return args;
}

function printHelp() {
  console.log('Usage: node scripts/load-test-driver.js [--config <path>] [--duration <minutes>]');
  console.log('       [--base-url <url>] [--member-count <number>] [--dry-run] [--max-requests <count>]');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/load-test-driver.js --config scripts/load-test.config.example.json --duration 15 --dry-run');
}

function validateHourlyProfile(profile) {
  if (!Array.isArray(profile) || profile.length !== 24) {
    throw new Error('hourlyVisitProfile must contain 24 numeric entries (visits per member per hour).');
  }

  profile.forEach((value, hour) => {
    if (Number.isNaN(Number(value)) || Number(value) < 0) {
      throw new Error(`hourlyVisitProfile contains an invalid value at hour ${hour}.`);
    }
  });
}

function validatePages(pages) {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('pages must be a non-empty array of paths and weights.');
  }

  pages.forEach((page, index) => {
    if (!page.path) {
      throw new Error(`pages[${index}] is missing a path value.`);
    }

    const weight = Number(page.weight ?? 1);
    if (Number.isNaN(weight) || weight <= 0) {
      throw new Error(`pages[${index}] has an invalid weight; expected a positive number.`);
    }
  });
}

function resolveAccountId(rawConfig) {
  const accountId = rawConfig.accountId ?? 1;

  if (Number.isNaN(Number(accountId)) || Number(accountId) <= 0) {
    throw new Error('accountId must be a positive number.');
  }

  return Number(accountId);
}

function resolveSeasonId(rawConfig) {
  const seasonId = rawConfig.seasonId ?? 1;

  if (Number.isNaN(Number(seasonId)) || Number(seasonId) <= 0) {
    throw new Error('seasonId must be a positive number.');
  }

  return Number(seasonId);
}

function resolveTeamSeasonId(rawConfig) {
  const teamSeasonId = rawConfig.teamSeasonId ?? 1;

  if (Number.isNaN(Number(teamSeasonId)) || Number(teamSeasonId) <= 0) {
    throw new Error('teamSeasonId must be a positive number.');
  }

  return Number(teamSeasonId);
}

function resolveCredentials(rawConfig) {
  const usernameEnvVar = rawConfig.usernameEnvVar ?? rawConfig.auth?.usernameEnvVar;
  const passwordEnvVar = rawConfig.passwordEnvVar ?? rawConfig.auth?.passwordEnvVar;

  if (!usernameEnvVar && !passwordEnvVar) {
    return null;
  }

  if (!usernameEnvVar || !passwordEnvVar) {
    throw new Error('Both usernameEnvVar and passwordEnvVar are required when configuring credentials.');
  }

  const missing = [usernameEnvVar, passwordEnvVar].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for credentials: ${missing.join(', ')}`);
  }

  return {
    username: process.env[usernameEnvVar],
    password: process.env[passwordEnvVar],
    usernameEnvVar,
    passwordEnvVar,
  };
}

function resolvePagePath(pathTemplate, ids) {
  return pathTemplate
    .replace(/\{accountId\}/g, ids.accountId)
    .replace(/\{seasonId\}/g, ids.seasonId)
    .replace(/\{teamSeasonId\}/g, ids.teamSeasonId);
}

function normalizeDayOfWeekMultipliers(rawMultipliers) {
  if (rawMultipliers === undefined) {
    return Array(DAYS_IN_WEEK).fill(1);
  }

  if (!Array.isArray(rawMultipliers) || rawMultipliers.length !== DAYS_IN_WEEK) {
    throw new Error('dayOfWeekMultipliers must contain 7 numeric entries (Sunday through Saturday).');
  }

  return rawMultipliers.map((value, index) => {
    const numeric = Number(value);

    if (Number.isNaN(numeric) || numeric <= 0) {
      throw new Error(`dayOfWeekMultipliers contains an invalid value at index ${index}; expected a positive number.`);
    }

    return numeric;
  });
}

function normalizeConfig(rawConfig, overrides) {
  const accountId = resolveAccountId(rawConfig);
  const seasonId = resolveSeasonId(rawConfig);
  const teamSeasonId = resolveTeamSeasonId(rawConfig);
  const credentials = resolveCredentials(rawConfig);

  const config = {
    ...rawConfig,
    baseUrl: overrides.baseUrl || rawConfig.baseUrl,
    durationMinutes:
      overrides.durationMinutes ?? rawConfig.durationMinutes ?? DEFAULT_DURATION_MINUTES,
    dryRun: overrides.dryRun ?? rawConfig.dryRun ?? false,
    maxRequests: overrides.maxRequests ?? rawConfig.maxRequests,
    memberCount: overrides.memberCount ?? rawConfig.memberCount ?? 1200,
    maxConcurrentRequests:
      rawConfig.maxConcurrentRequests ?? DEFAULT_MAX_CONCURRENCY,
    requestTimeoutMs: rawConfig.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS,
    logSummaryEverySeconds: rawConfig.logSummaryEverySeconds ?? DEFAULT_LOG_INTERVAL_SECONDS,
    accountId,
    seasonId,
    teamSeasonId,
    credentials,
  };

  if (!config.baseUrl) {
    throw new Error('A baseUrl is required (e.g., http://localhost:3000).');
  }

  if (Number.isNaN(Number(config.memberCount)) || Number(config.memberCount) <= 0) {
    throw new Error('memberCount must be a positive number.');
  }

  validateHourlyProfile(config.hourlyVisitProfile);
  validatePages(config.pages);

  return {
    ...config,
    memberCount: Number(config.memberCount),
    durationMinutes: Number(config.durationMinutes),
    maxConcurrentRequests: Number(config.maxConcurrentRequests),
    requestTimeoutMs: Number(config.requestTimeoutMs),
    logSummaryEverySeconds: Number(config.logSummaryEverySeconds),
    dayOfWeekMultipliers: normalizeDayOfWeekMultipliers(config.dayOfWeekMultipliers),
    pages: config.pages.map((page) => ({
      ...page,
      resolvedPath: resolvePagePath(page.path, { accountId, seasonId, teamSeasonId }),
    })),
  };
}

function pickWeightedPage(pages) {
  const totalWeight = pages.reduce((sum, page) => sum + Number(page.weight ?? 1), 0);
  const target = Math.random() * totalWeight;
  let running = 0;

  for (const page of pages) {
    running += Number(page.weight ?? 1);
    if (target <= running) {
      return page;
    }
  }

  return pages[pages.length - 1];
}

function requestsPerMinute(config, now) {
  const perMemberPerHour = Number(config.hourlyVisitProfile[now.getHours()]);
  const dayMultiplier = config.dayOfWeekMultipliers[now.getDay()] ?? 1;

  return (perMemberPerHour * dayMultiplier * config.memberCount) / 60;
}

function sampleIntervalMs(ratePerMinute) {
  if (ratePerMinute <= 0) {
    return null;
  }

  const lambda = ratePerMinute / 60000;
  const uniform = Math.random();
  return Math.max(MIN_INTERVAL_MS, -Math.log(1 - uniform) / lambda);
}

function millisToNextHour(nowMs) {
  const now = new Date(nowMs);
  const nextHour = new Date(now);
  // Move to the top of the next hour while zeroing smaller units.
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  return nextHour.getTime() - nowMs;
}

async function runRequest(config, state, page) {
  const url = new URL(page.resolvedPath || page.path, config.baseUrl).toString();
  const started = Date.now();
  const method = page.method || 'GET';

  if (config.dryRun) {
    const simulatedLatency = 50 + Math.random() * 150;
    await new Promise((resolve) => setTimeout(resolve, simulatedLatency));
    state.stats.totalLatencyMs += simulatedLatency;
    state.stats.completed += 1;
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const headers = {
      ...(config.headers || {}),
      ...(page.headers || {}),
    };

    if (config.credentials && !headers.Authorization) {
      const token = Buffer.from(
        `${config.credentials.username}:${config.credentials.password}`,
      ).toString('base64');
      headers.Authorization = `Basic ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
    });

    const latency = Date.now() - started;
    state.stats.totalLatencyMs += latency;

    if (!response.ok) {
      let responseBody = '';
      try {
        responseBody = await response.text();
      } catch (bodyError) {
        responseBody = `<<failed to read response body: ${
          bodyError instanceof Error ? bodyError.message : String(bodyError)
        }>>`;
      }

      const trimmedBody =
        responseBody && responseBody.length > 500
          ? `${responseBody.slice(0, 500)}...`
          : responseBody;

      console.error(
        `[${new Date().toISOString()}] Request failed ${method} ${url} -> ${
          response.status
        } ${response.statusText}${
          trimmedBody ? ` body="${trimmedBody.replace(/\s+/g, ' ').trim()}"` : ''
        }`,
      );
      state.stats.failed += 1;
    } else {
      state.stats.completed += 1;
    }
  } catch (error) {
    const reason =
      error && error.name === 'AbortError'
        ? 'timeout'
        : error instanceof Error
          ? error.message
          : String(error);
    console.error(
      `[${new Date().toISOString()}] Request error ${method} ${url} -> ${reason}`,
    );
    state.stats.failed += 1;
  } finally {
    clearTimeout(timeout);
  }
}

function logProgress(config, state) {
  const totalRequests = state.stats.completed + state.stats.failed;
  const avgLatency = totalRequests ? Math.round(state.stats.totalLatencyMs / totalRequests) : 0;

  console.log(
    [
      `[${new Date().toISOString()}]`,
      `in-flight=${state.inFlight}`,
      `pending=${state.pending.length}`,
      `scheduled=${state.stats.scheduled}`,
      `done=${state.stats.completed}`,
      `failed=${state.stats.failed}`,
      `avgLatency=${avgLatency}ms`,
      `currentRate=${state.currentRatePerMinute.toFixed(2)}rpm`,
    ].join(' '),
  );
}

function summarize(config, state) {
  const finishedRequests = state.stats.completed + state.stats.failed;
  const durationMs = Date.now() - state.startedAt.getTime();
  const avgLatency = finishedRequests
    ? Math.round(state.stats.totalLatencyMs / finishedRequests)
    : 0;

  console.log('\nLoad test complete');
  console.log(` Duration: ${(durationMs / 60000).toFixed(2)} minutes`);
  console.log(` Requests scheduled: ${state.stats.scheduled}`);
  console.log(` Finished: ${finishedRequests}`);
  console.log(` Completed: ${state.stats.completed}`);
  console.log(` Failed: ${state.stats.failed}`);
  console.log(` Avg latency: ${avgLatency} ms`);
  console.log(` Member count modeled: ${config.memberCount}`);
  console.log(` Max concurrency: ${config.maxConcurrentRequests}`);
  console.log(` Base URL: ${config.baseUrl}`);
}

function runLoadTest(rawConfig, overrides) {
  const config = normalizeConfig(rawConfig, overrides);
  const endAtMs = Date.now() + config.durationMinutes * 60000;

  const state = {
    startedAt: new Date(),
    inFlight: 0,
    pending: [],
    stoppedScheduling: false,
    currentRatePerMinute: 0,
    stats: {
      scheduled: 0,
      completed: 0,
      failed: 0,
      totalLatencyMs: 0,
    },
  };

  const logInterval = setInterval(
    () => logProgress(config, state),
    config.logSummaryEverySeconds * 1000,
  );

  const stopScheduling = () => {
    state.stoppedScheduling = true;
  };

  const maybeFinish = () => {
    if (!state.stoppedScheduling) {
      return;
    }

    if (state.inFlight === 0 && state.pending.length === 0) {
      clearInterval(logInterval);
      summarize(config, state);
      process.exit(0);
    }
  };

  const launchFromQueue = () => {
    if (state.inFlight >= config.maxConcurrentRequests) {
      return;
    }

    const page = state.pending.shift();
    if (!page) {
      return;
    }

    state.inFlight += 1;

    runRequest(config, state, page)
      .catch(() => {})
      .finally(() => {
        state.inFlight -= 1;
        launchFromQueue();
        maybeFinish();
      });
  };

  const scheduleArrival = () => {
    if (state.stoppedScheduling) {
      return;
    }

    const nowMs = Date.now();
    if (config.maxRequests && state.stats.scheduled >= config.maxRequests) {
      stopScheduling();
      maybeFinish();
      return;
    }

    if (nowMs >= endAtMs) {
      stopScheduling();
      maybeFinish();
      return;
    }

    const currentRate = requestsPerMinute(config, new Date(nowMs));
    state.currentRatePerMinute = currentRate;

    const delay = sampleIntervalMs(currentRate);
    if (delay === null) {
      const waitMs = Math.min(millisToNextHour(nowMs), config.logSummaryEverySeconds * 1000);
      setTimeout(scheduleArrival, waitMs);
      return;
    }

    const remainingWindowMs = Math.max(endAtMs - nowMs, 0);
    const nextDelay = Math.min(delay, remainingWindowMs);

    setTimeout(() => {
      if (Date.now() >= endAtMs) {
        stopScheduling();
        maybeFinish();
        return;
      }

      state.pending.push(pickWeightedPage(config.pages));
      state.stats.scheduled += 1;
      launchFromQueue();
      scheduleArrival();
    }, nextDelay);
  };

  scheduleArrival();
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const configPath = resolveConfigPath(args.configPath);
  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    process.exit(1);
  }

  const rawConfig = loadJson(configPath);

  try {
    runLoadTest(rawConfig, args);
  } catch (error) {
    console.error(`Unable to start load test: ${error.message}`);
    process.exit(1);
  }
}

main();
