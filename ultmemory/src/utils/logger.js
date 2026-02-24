/**
 * UltMemory Logger
 * 简单的日志工具
 */

export class Logger {
  constructor(module = 'UltMemory') {
    this.module = module;
    this.level = process.env.LOG_LEVEL || 'INFO';
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.module}]`;

    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  debug(message, data) {
    if (this.level === 'DEBUG') {
      this.log('DEBUG', message, data);
    }
  }

  success(message, data) {
    this.log('SUCCESS', message, data);
  }
}

export const logger = new Logger();
