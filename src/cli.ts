#!/usr/bin/env node

import { runCliWithExitCode } from './cli-program';

runCliWithExitCode().then((exitCode) => {
  process.exitCode = exitCode;
});
