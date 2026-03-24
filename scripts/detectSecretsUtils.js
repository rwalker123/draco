#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXCLUDE_FILES_PATTERN = 'scripts/load-test\\.config\\.example\\.json|pnpm-lock\\.yaml';

function getMacOSPythonBinPaths() {
  const libPython = path.join(process.env.HOME, 'Library', 'Python');
  if (!fs.existsSync(libPython)) return [];
  try {
    return fs.readdirSync(libPython)
      .map(ver => path.join(libPython, ver, 'bin'))
      .filter(p => fs.existsSync(p));
  } catch {
    return [];
  }
}

function findBinary(name) {
  const extraPaths = [
    `${process.env.HOME}/.local/bin`,
    ...getMacOSPythonBinPaths(),
  ];
  const searchPath = [...extraPaths, process.env.PATH].join(':');
  try {
    return execFileSync('which', [name], {
      encoding: 'utf8',
      env: { ...process.env, PATH: searchPath },
    }).trim();
  } catch {
    return null;
  }
}

module.exports = { getMacOSPythonBinPaths, findBinary, EXCLUDE_FILES_PATTERN };
