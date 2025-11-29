import chalk from 'chalk';
import type { LogLevel } from '../types';

const LOG_LEVELS: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  error(...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(chalk.red('[nuxt-css-obfuscator]'), ...args);
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(chalk.yellow('[nuxt-css-obfuscator]'), ...args);
    }
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(chalk.blue('[nuxt-css-obfuscator]'), ...args);
    }
  }

  success(...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(chalk.green('[nuxt-css-obfuscator]'), ...args);
    }
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(chalk.gray('[nuxt-css-obfuscator]'), ...args);
    }
  }
}

export const logger = new Logger();
