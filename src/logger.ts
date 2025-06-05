interface LoggerConfig {
  enabled: boolean;
  color: string;
  lastTime?: number;
}

interface Logger {
  (message: any, ...args: any[]): void;
  debug: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
  namespace: string;
  enabled: boolean;
}

class LoggerManager {
  private loggers = new Map<string, LoggerConfig>();
  private patterns: string[] = [];
  private isNode = typeof process !== 'undefined' && process.env;
  private colors = [
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4',
    '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff',
    '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1',
    '#000075', '#808080'
  ];
  
  constructor() {
    this.updatePatterns();
  }

  private updatePatterns(): void {
    let debugEnv = '';
    
    if (this.isNode) {
      debugEnv = typeof process !== 'undefined' && process.env.DEBUG || '';
    } else {
      // Browser: check localStorage and global config
      if (typeof localStorage !== 'undefined') {
        debugEnv = localStorage.getItem('DEBUG') || '';
      }
      if (typeof globalThis !== 'undefined' && (globalThis as any).DEBUG) {
        debugEnv = (globalThis as any).DEBUG;
      }
    }

    this.patterns = debugEnv.split(',').map(p => p.trim()).filter(Boolean);
    
    // Update existing loggers
    for (const [namespace, config] of this.loggers) {
      config.enabled = this.isEnabled(namespace);
    }
  }

  private isEnabled(namespace: string): boolean {
    if (this.patterns.length === 0) return false;

    for (const pattern of this.patterns) {
      if (pattern.startsWith('-')) {
        // Exclusion pattern
        const excludePattern = pattern.slice(1);
        if (this.matchPattern(namespace, excludePattern)) {
          return false;
        }
      } else {
        // Inclusion pattern
        if (this.matchPattern(namespace, pattern)) {
          return true;
        }
      }
    }

    return false;
  }

  private matchPattern(namespace: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === namespace) return true;
    
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\+/g, '\\+')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\^/g, '\\^')
      .replace(/\$/g, '\\$')
      .replace(/\|/g, '\\|');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(namespace);
  }

  private getColor(namespace: string): string {
    // Simple hash function to consistently assign colors
    let hash = 0;
    for (let i = 0; i < namespace.length; i++) {
      const char = namespace.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return this.colors[Math.abs(hash) % this.colors.length];
  }

  private formatMessage(namespace: string, level: string, message: any, args: any[]): string {
    const now = Date.now();
    const config = this.loggers.get(namespace)!;
    
    let prefix = namespace;
    let timeDiff = '';
    
    if (config.lastTime) {
      timeDiff = `+${now - config.lastTime}ms`;
    }
    config.lastTime = now;

    if (this.isNode) {
      // Node.js: Use ANSI color codes
      const colorCode = this.getAnsiColor(config.color);
      prefix = `\x1b[${colorCode}m${namespace}\x1b[0m`;
      if (timeDiff) {
        prefix += ` \x1b[90m${timeDiff}\x1b[0m`;
      }
    } else {
      // Browser: Use CSS colors
      if (timeDiff) {
        prefix += ` ${timeDiff}`;
      }
    }

    const levelPrefix = level !== 'debug' ? `[${level.toUpperCase()}]` : '';
    return `${prefix}${levelPrefix ? ' ' + levelPrefix : ''} ${message}`;
  }

  private getAnsiColor(hexColor: string): string {
    // Convert hex color to closest ANSI color code
    const colorMap: { [key: string]: string } = {
      '#e6194b': '31', // red
      '#3cb44b': '32', // green  
      '#ffe119': '33', // yellow
      '#4363d8': '34', // blue
      '#f58231': '35', // magenta
      '#911eb4': '36', // cyan
    };
    return colorMap[hexColor] || '37'; // default to white
  }

  private log(namespace: string, level: 'debug' | 'warn' | 'error', message: any, ...args: any[]): void {
    const config = this.loggers.get(namespace);
    if (!config || !config.enabled) return;

    if (typeof message === "object" || Array.isArray(message)) {
      message = JSON.stringify(message);
    }

    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === "object" || Array.isArray(args[i])) {
        args[i] = JSON.stringify(args[i]);
      }
    }

    const formattedMessage = this.formatMessage(namespace, level, message, args);
    
    if (this.isNode) {
      // Node.js: Write to stderr for debug, stdout for warn/error
      const output = level === 'debug' ? process.stderr : process.stdout;
      output.write(formattedMessage + ' ');
      if (args.length > 0) {
        output.write(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      }

      output.write("\n");
    } else {
      // Browser: Use console with CSS styling
      const styles = `color: ${config.color}; font-weight: bold;`;
      if (level === 'warn') {
        console.warn(`%c${formattedMessage}`, styles, ...args);
      } else if (level === 'error') {
        console.error(`%c${formattedMessage}`, styles, ...args);
      } else {
        console.log(`%c${formattedMessage}`, styles, ...args);
      }
    }
  }

  createLogger(namespace: string): Logger {
    if (!this.loggers.has(namespace)) {
      this.loggers.set(namespace, {
        enabled: this.isEnabled(namespace),
        color: this.getColor(namespace)
      });
    }

    const config = this.loggers.get(namespace)!;

    const logger = ((message: any, ...args: any[]) => {
      this.log(namespace, 'debug', message, ...args);
    }) as Logger;

    logger.debug = (message: any, ...args: any[]) => {
      this.log(namespace, 'debug', message, ...args);
    };

    logger.warn = (message: any, ...args: any[]) => {
      this.log(namespace, 'warn', message, ...args);
    };

    logger.error = (message: any, ...args: any[]) => {
      this.log(namespace, 'error', message, ...args);
    };

    logger.namespace = namespace;
    
    Object.defineProperty(logger, 'enabled', {
      get: () => config.enabled
    });

    return logger;
  }

  // Update patterns when environment changes
  refresh(): void {
    this.updatePatterns();
  }
}

// Singleton instance
const manager = new LoggerManager();

// Factory function to create loggers
function createLogger(namespace: string): Logger {
  return manager.createLogger(namespace);
}

// Utility to refresh patterns (useful when DEBUG env changes)
createLogger.refresh = () => manager.refresh();

export default createLogger;
export { Logger, createLogger };