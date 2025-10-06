import * as path from 'path';
import { glob } from 'glob';
import { QualityIssue } from '../types/QualityTypes.js';
import { FileUtils } from '../utils/FileUtils.js';
import { LimitsService } from './LimitsService.js';

export class FirebaseAnalysisService {
  private limitsService: LimitsService;

  constructor() {
    this.limitsService = new LimitsService();
  }

  public async analyzeFirebaseFunctions(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const functionsPath = path.join(projectPath, 'functions', 'src');
    const limits = this.limitsService.getFirebaseLimits();

    // Check Firebase folder structure first
    issues.push(...await this.checkFirebaseStructure(projectPath));

    // Check functions structure
    const functionFiles = await glob('**/*.{ts,js}', {
      cwd: functionsPath,
      ignore: ['node_modules/**', '**/*.test.*', '**/*.spec.*']
    });

    for (const file of functionFiles) {
      const filePath = path.join(functionsPath, file);
      const content = await FileUtils.readFile(filePath);
      const lines = content.split('\n');

      // Check file length (should be 300 for general files)
      if (lines.length > limits.maxLinesPerFile) {
        issues.push({
          severity: 'error',
          category: 'firebase-structure',
          file: `functions/src/${file}`,
          message: `Firebase function file exceeds ${limits.maxLinesPerFile} lines (${lines.length} lines)`,
          rule: 'firebase-max-lines'
        });
      }

      // Check individual function length (50 lines per function)
      const functionIssues = await this.checkFunctionLengths(content, `functions/src/${file}`, limits.maxLinesPerFunction);
      issues.push(...functionIssues);

      // Count exports (functions)
      const exportCount = (content.match(/export\s+(const|function)\s+\w+/g) || []).length;
      if (exportCount > limits.maxFunctionsPerFile) {
        issues.push({
          severity: 'error',
          category: 'firebase-structure',
          file: `functions/src/${file}`,
          message: `File has ${exportCount} functions, max is ${limits.maxFunctionsPerFile}`,
          rule: 'firebase-max-functions'
        });
      }

      // Check for console.log in Firebase functions
      if (content.includes('console.log')) {
        issues.push({
          severity: 'error',
          category: 'firebase-logging',
          file: `functions/src/${file}`,
          message: 'Use logger.info/error instead of console.log in Firebase Functions',
          rule: 'firebase-logger'
        });
      }
    }

    return issues;
  }

  private async checkFirebaseStructure(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const functionsPath = path.join(projectPath, 'functions', 'src');

    // Check if functions/src exists
    if (!await FileUtils.fileExists(functionsPath)) {
      issues.push({
        severity: 'error',
        category: 'firebase-structure',
        message: 'Missing required directory: functions/src',
        rule: 'firebase-folder-structure'
      });
      return issues; // Can't check further if main directory doesn't exist
    }

    // Required directories in functions/src
    const requiredDirs = [
      { dir: 'constants', severity: 'error' as const },
      { dir: 'function', severity: 'error' as const },
      { dir: 'functions', severity: 'error' as const }
    ];

    for (const { dir, severity } of requiredDirs) {
      const dirPath = path.join(functionsPath, dir);
      if (!await FileUtils.fileExists(dirPath)) {
        issues.push({
          severity,
          category: 'firebase-structure',
          message: `Missing required directory: functions/src/${dir}`,
          rule: 'firebase-folder-structure'
        });
      } else {
        // Check specific files in each directory
        if (dir === 'constants') {
          const indexPath = path.join(dirPath, 'index.ts');
          const securityPath = path.join(dirPath, 'security.ts');

          if (!await FileUtils.fileExists(indexPath)) {
            issues.push({
              severity: 'warning',
              category: 'firebase-structure',
              message: 'Missing functions/src/constants/index.ts',
              rule: 'firebase-constants-structure'
            });
          }

          if (!await FileUtils.fileExists(securityPath)) {
            issues.push({
              severity: 'info',
              category: 'firebase-structure',
              message: 'Missing functions/src/constants/security.ts for security constants',
              rule: 'firebase-constants-structure'
            });
          }
        }

        if (dir === 'function') {
          const indexPath = path.join(dirPath, 'index.ts');
          const securityUtilsPath = path.join(dirPath, 'securityUtils.ts');

          if (!await FileUtils.fileExists(indexPath)) {
            issues.push({
              severity: 'warning',
              category: 'firebase-structure',
              message: 'Missing functions/src/function/index.ts for utility functions',
              rule: 'firebase-utils-structure'
            });
          }

          if (!await FileUtils.fileExists(securityUtilsPath)) {
            issues.push({
              severity: 'info',
              category: 'firebase-structure',
              message: 'Missing functions/src/function/securityUtils.ts for security utilities',
              rule: 'firebase-utils-structure'
            });
          }
        }

        if (dir === 'functions') {
          // Check for proper organization by feature/domain
          const functionGroups = await glob('*/', {
            cwd: dirPath
          });

          if (functionGroups.length === 0) {
            issues.push({
              severity: 'warning',
              category: 'firebase-structure',
              message: 'Functions should be organized in feature folders (e.g., functions/family/, functions/auth/)',
              rule: 'firebase-function-organization'
            });
          } else {
            // Check each function group
            for (const group of functionGroups) {
              const groupPath = path.join(dirPath, group);
              const functionFiles = await glob('*.{ts,js}', { cwd: groupPath });

              if (functionFiles.length === 0) {
                issues.push({
                  severity: 'warning',
                  category: 'firebase-structure',
                  message: `Empty function group: functions/src/functions/${group}`,
                  rule: 'firebase-function-organization'
                });
              }

              // Check that each function file follows naming convention
              for (const file of functionFiles) {
                if (!file.match(/^[a-z][a-zA-Z]*\.(ts|js)$/)) {
                  issues.push({
                    severity: 'info',
                    category: 'firebase-naming',
                    file: `functions/src/functions/${group}/${file}`,
                    message: 'Function files should use camelCase naming (e.g., createFamily.ts)',
                    rule: 'firebase-naming-convention'
                  });
                }
              }
            }
          }

          // Check for index.ts that exports all functions
          const indexPath = path.join(dirPath, 'index.ts');
          if (!await FileUtils.fileExists(indexPath)) {
            issues.push({
              severity: 'warning',
              category: 'firebase-structure',
              message: 'Missing functions/src/functions/index.ts to export all functions',
              rule: 'firebase-exports'
            });
          }
        }
      }
    }

    // Check main index.ts file
    const mainIndexPath = path.join(functionsPath, 'index.ts');
    if (!await FileUtils.fileExists(mainIndexPath)) {
      issues.push({
        severity: 'error',
        category: 'firebase-structure',
        message: 'Missing main entry point: functions/src/index.ts',
        rule: 'firebase-entry-point'
      });
    }

    return issues;
  }

  private async checkFunctionLengths(content: string, filePath: string, maxLines: number): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const lines = content.split('\n');

    // Find function declarations
    const functionRegex = /^export\s+(const|function|async function)\s+(\w+)/gm;
    let match;
    const functions: Array<{ name: string; startLine: number; endLine?: number }> = [];

    while ((match = functionRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      functions.push({
        name: match[2],
        startLine: lineNumber
      });
    }

    // Calculate function lengths
    for (let i = 0; i < functions.length; i++) {
      const func = functions[i];
      const nextFunc = functions[i + 1];
      func.endLine = nextFunc ? nextFunc.startLine - 1 : lines.length;

      const functionLength = func.endLine - func.startLine + 1;

      if (functionLength > maxLines) {
        issues.push({
          severity: 'error',
          category: 'firebase-function-length',
          file: filePath,
          line: func.startLine,
          message: `Function '${func.name}' exceeds ${maxLines} lines (${functionLength} lines)`,
          rule: 'firebase-function-max-lines'
        });
      }
    }

    return issues;
  }
}
