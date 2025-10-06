import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { ProjectInfo } from '../detectors/ProjectDetector.js';
import { QualityRules } from '../rules/QualityRules.js';

export interface QualityReport {
  projectPath: string;
  projectTypes: string[];
  score: number;
  issues: QualityIssue[];
  recommendations: string[];
  stats: QualityStats;
}

export interface QualityIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  file?: string;
  line?: number;
  message: string;
  rule: string;
}

export interface QualityStats {
  totalFiles: number;
  totalLines: number;
  averageFileSize: number;
  duplicateCode: number;
  unusedCode: number;
  complexity: number;
}

export class QualityAnalyzer {
  private rules: QualityRules;

  constructor() {
    this.rules = new QualityRules();
  }

  public async analyzeQuality(projectPath: string, projectInfo: ProjectInfo): Promise<QualityReport> {
    const issues: QualityIssue[] = [];
    const stats = await this.calculateStats(projectPath);

    // Apply rules based on project type
    for (const projectType of projectInfo.types) {
      const typeIssues = await this.analyzeByType(projectPath, projectType);
      issues.push(...typeIssues);
    }

    // Check for common issues across all types
    const commonIssues = await this.checkCommonIssues(projectPath);
    issues.push(...commonIssues);

    // Check multi-project specific issues
    if (projectInfo.isMultiProject && projectInfo.subProjects) {
      const multiProjectIssues = await this.checkMultiProjectIssues(projectPath, projectInfo.subProjects);
      issues.push(...multiProjectIssues);
    }

    // Calculate quality score
    const score = this.calculateScore(issues, stats);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, projectInfo);

    return {
      projectPath,
      projectTypes: projectInfo.types,
      score,
      issues,
      recommendations,
      stats
    };
  }

  private async analyzeByType(projectPath: string, projectType: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    switch (projectType) {
      case 'react':
      case 'react-native':
        issues.push(...await this.analyzeReactProject(projectPath, projectType));
        break;
      case 'nodejs':
      case 'nextjs':
      case 'nest':
        issues.push(...await this.analyzeNodeProject(projectPath, projectType));
        break;
      case 'firebase-functions':
        issues.push(...await this.analyzeFirebaseFunctions(projectPath));
        break;
      case 'java':
        issues.push(...await this.analyzeJavaProject(projectPath));
        break;
      case 'dotnet':
        issues.push(...await this.analyzeDotNetProject(projectPath));
        break;
      case 'angular':
        issues.push(...await this.analyzeAngularProject(projectPath));
        break;
      case 'aws-amplify':
        issues.push(...await this.analyzeAmplifyProject(projectPath));
        break;
    }

    return issues;
  }

  private async analyzeReactProject(projectPath: string, variant: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const limits = this.rules.getReactLimits(variant);

    // Check component structure first
    issues.push(...await this.checkReactComponentStructure(projectPath));

    // Check component files
    const componentFiles = await glob('src/**/*.{tsx,jsx}', {
      cwd: projectPath,
      ignore: ['node_modules/**', '**/*.test.*', '**/*.spec.*']
    });

    for (const file of componentFiles) {
      const filePath = path.join(projectPath, file);
      const content = await this.readFile(filePath);
      const lines = content.split('\n');

      // Check file length
      if (lines.length > limits.maxLines) {
        issues.push({
          severity: 'warning',
          category: 'file-size',
          file,
          message: `File exceeds ${limits.maxLines} lines (${lines.length} lines)`,
          rule: 'max-file-lines'
        });
      }

      // Check for console.log
      lines.forEach((line, index) => {
        if (line.includes('console.log')) {
          issues.push({
            severity: 'error',
            category: 'code-quality',
            file,
            line: index + 1,
            message: 'Console.log found - use logger instead',
            rule: 'no-console'
          });
        }
      });

      // Check for relative imports
      const relativeImportRegex = /from\s+['"](\.\.\/){2,}/g;
      lines.forEach((line, index) => {
        if (relativeImportRegex.test(line)) {
          issues.push({
            severity: 'warning',
            category: 'imports',
            file,
            line: index + 1,
            message: 'Deep relative import found - use path aliases',
            rule: 'no-deep-imports'
          });
        }
      });

      // Check line length (new for 2025)
      const maxLineLength = limits.maxLineLength || 120;
      lines.forEach((line, index) => {
        if (line.length > maxLineLength) {
          issues.push({
            severity: 'info',
            category: 'code-style',
            file,
            line: index + 1,
            message: `Line exceeds ${maxLineLength} characters (${line.length} chars)`,
            rule: 'max-line-length'
          });
        }
      });

      // Check function length in React components (new for 2025)
      const functionRegex = /^(export\s+)?(const|function|async\s+function)\s+(\w+)/gm;
      const functions = this.findFunctions(content);

      functions.forEach(func => {
        const funcLength = func.endLine - func.startLine + 1;
        const maxFunctionLines = limits.maxFunctionLines || 30;

        if (funcLength > maxFunctionLines) {
          issues.push({
            severity: 'warning',
            category: 'function-length',
            file,
            line: func.startLine,
            message: `Function '${func.name}' exceeds ${maxFunctionLines} lines (${funcLength} lines)`,
            rule: 'max-function-lines'
          });
        }
      });
    }

    return issues;
  }

  private findFunctions(content: string): Array<{ name: string; startLine: number; endLine: number }> {
    const lines = content.split('\n');
    const functions: Array<{ name: string; startLine: number; endLine: number }> = [];
    const functionRegex = /^(export\s+)?(const|function|async\s+function)\s+(\w+)/;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(functionRegex);
      if (match) {
        const funcName = match[3];
        let braceCount = 0;
        let started = false;
        let endLine = i;

        // Find the end of the function by counting braces
        for (let j = i; j < lines.length; j++) {
          const line = lines[j];
          for (const char of line) {
            if (char === '{') {
              braceCount++;
              started = true;
            } else if (char === '}') {
              braceCount--;
              if (started && braceCount === 0) {
                endLine = j;
                break;
              }
            }
          }
          if (started && braceCount === 0) break;
        }

        functions.push({
          name: funcName,
          startLine: i + 1,
          endLine: endLine + 1
        });
      }
    }

    return functions;
  }

  private async checkReactComponentStructure(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check for proper React project organization (2025 standards)
    const requiredFolders = [
      { path: 'src/components', description: 'Reusable UI components' },
      { path: 'src/pages', description: 'Page components', optional: true },
      { path: 'src/features', description: 'Feature-based modules', optional: true },
      { path: 'src/hooks', description: 'Custom React hooks' },
      { path: 'src/services', description: 'API and business logic' },
      { path: 'src/utils', description: 'Helper functions' },
      { path: 'src/types', description: 'TypeScript types/interfaces' },
      { path: 'src/assets', description: 'Images, fonts, icons' },
      { path: 'src/styles', description: 'Global styles', optional: true },
      { path: 'src/context', description: 'React Context providers', optional: true },
      { path: 'src/store', description: 'State management (Redux/Zustand)', optional: true }
    ];

    // Check for required folders
    for (const folder of requiredFolders) {
      const folderPath = path.join(projectPath, folder.path);
      if (!await this.fileExists(folderPath)) {
        if (!folder.optional) {
          issues.push({
            severity: 'warning',
            category: 'react-organization',
            message: `Missing required folder: ${folder.path} - ${folder.description}`,
            rule: 'react-folder-structure'
          });
        }
      }
    }

    // Find all component directories
    const componentDirs = await glob('src/components/*/', {
      cwd: projectPath
    });

    for (const dir of componentDirs) {
      const componentPath = path.join(projectPath, dir);
      const componentName = path.basename(dir);

      // Required files for each component
      const requiredFiles = [
        { file: 'index.tsx', optional: false },
        { file: 'index.jsx', optional: true }, // Alternative to .tsx
        { file: 'types.ts', optional: false },
        { file: 'styles.ts', optional: false },
        { file: 'const.ts', optional: false }
      ];

      // Required folders for complex components
      const requiredFolders = [
        { folder: 'hooks', optional: false },
        { folder: 'components', optional: true },
        { folder: 'services', optional: true },
        { folder: 'handlers', optional: true }
      ];

      // Check for main component file (either tsx or jsx)
      const hasIndexTsx = await this.fileExists(path.join(componentPath, 'index.tsx'));
      const hasIndexJsx = await this.fileExists(path.join(componentPath, 'index.jsx'));

      if (!hasIndexTsx && !hasIndexJsx) {
        issues.push({
          severity: 'error',
          category: 'react-structure',
          file: dir,
          message: `Component ${componentName} missing required file: index.tsx or index.jsx`,
          rule: 'react-component-structure'
        });
      }

      // Check other required files
      for (const { file, optional } of requiredFiles) {
        if (file === 'index.tsx' || file === 'index.jsx') continue; // Already checked

        if (!optional && !await this.fileExists(path.join(componentPath, file))) {
          issues.push({
            severity: 'warning',
            category: 'react-structure',
            file: dir,
            message: `Component ${componentName} missing required file: ${file}`,
            rule: 'react-component-structure'
          });
        }
      }

      // Check for hooks folder and proper hook structure
      const hooksPath = path.join(componentPath, 'hooks');
      if (await this.fileExists(hooksPath)) {
        const expectedHooks = [
          `use${componentName}State.ts`,
          `use${componentName}Logic.ts`,
          `use${componentName}Effects.ts`
        ];

        for (const hookFile of expectedHooks) {
          if (!await this.fileExists(path.join(hooksPath, hookFile))) {
            issues.push({
              severity: 'info',
              category: 'react-structure',
              file: path.join(dir, 'hooks'),
              message: `Missing recommended hook file: ${hookFile}`,
              rule: 'react-hooks-structure'
            });
          }
        }
      } else {
        // Only warn about missing hooks folder for larger components
        const componentFiles = await glob(`${dir}/**/*.{tsx,jsx,ts,js}`, {
          cwd: projectPath
        });

        if (componentFiles.length > 3) {
          issues.push({
            severity: 'warning',
            category: 'react-structure',
            file: dir,
            message: `Complex component ${componentName} should have a hooks/ folder`,
            rule: 'react-component-structure'
          });
        }
      }

      // Check for sub-components structure
      const componentsPath = path.join(componentPath, 'components');
      if (await this.fileExists(componentsPath)) {
        const subComponents = await glob('*/', {
          cwd: componentsPath
        });

        for (const subComp of subComponents) {
          const subCompPath = path.join(componentsPath, subComp);
          const hasIndex = await this.fileExists(path.join(subCompPath, 'index.tsx')) ||
                          await this.fileExists(path.join(subCompPath, 'index.jsx'));

          if (!hasIndex) {
            issues.push({
              severity: 'warning',
              category: 'react-structure',
              file: path.join(dir, 'components', subComp),
              message: `Sub-component missing index.tsx or index.jsx`,
              rule: 'react-subcomponent-structure'
            });
          }
        }
      }
    }

    return issues;
  }

  private async analyzeNodeProject(projectPath: string, variant: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check Node.js project organization (2025 standards)
    issues.push(...await this.checkNodeProjectStructure(projectPath, variant));

    // Check for unused dependencies
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await this.readFile(packageJsonPath));

      // Basic check for common unused packages
      const commonUnused = ['lodash', 'moment', 'axios'];
      const deps = Object.keys(packageJson.dependencies || {});

      for (const dep of commonUnused) {
        if (deps.includes(dep)) {
          const searchPattern = `**/*.{js,ts,jsx,tsx}`;
          const files = await glob(searchPattern, { cwd: projectPath, ignore: ['node_modules/**'] });
          let isUsed = false;

          for (const file of files.slice(0, 10)) { // Check first 10 files for performance
            const content = await this.readFile(path.join(projectPath, file));
            if (content.includes(dep)) {
              isUsed = true;
              break;
            }
          }

          if (!isUsed) {
            issues.push({
              severity: 'info',
              category: 'dependencies',
              message: `Potentially unused dependency: ${dep}`,
              rule: 'unused-dependency'
            });
          }
        }
      }
    }

    return issues;
  }

  private async checkNodeProjectStructure(projectPath: string, variant: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Define required folders based on variant
    let requiredFolders: Array<{ path: string; description: string; optional?: boolean }> = [];

    if (variant === 'nextjs' || variant === 'nextjs-app-router') {
      // Next.js specific structure
      requiredFolders = [
        { path: 'app', description: 'App Router (Next.js 13+)', optional: true },
        { path: 'pages', description: 'Pages Router', optional: true },
        { path: 'components', description: 'React components' },
        { path: 'lib', description: 'Library/utility functions' },
        { path: 'public', description: 'Static assets' },
        { path: 'styles', description: 'CSS/SCSS files', optional: true }
      ];
    } else if (variant === 'nestjs') {
      // Nest.js specific structure
      requiredFolders = [
        { path: 'src/modules', description: 'Feature modules' },
        { path: 'src/controllers', description: 'HTTP controllers', optional: true },
        { path: 'src/services', description: 'Business logic services', optional: true },
        { path: 'src/entities', description: 'Database entities', optional: true },
        { path: 'src/dto', description: 'Data Transfer Objects' },
        { path: 'src/guards', description: 'Authentication guards', optional: true },
        { path: 'src/interceptors', description: 'Request interceptors', optional: true },
        { path: 'src/pipes', description: 'Validation pipes', optional: true },
        { path: 'src/config', description: 'Configuration files' }
      ];
    } else {
      // Standard Node.js/Express structure
      requiredFolders = [
        { path: 'src/routes', description: 'API routes/endpoints' },
        { path: 'src/controllers', description: 'Route controllers' },
        { path: 'src/services', description: 'Business logic layer' },
        { path: 'src/models', description: 'Data models/schemas' },
        { path: 'src/middleware', description: 'Express middleware' },
        { path: 'src/utils', description: 'Utility functions' },
        { path: 'src/config', description: 'Configuration files' },
        { path: 'src/validators', description: 'Input validation', optional: true },
        { path: 'src/database', description: 'Database connection/queries', optional: true }
      ];
    }

    // Check for required folders
    for (const folder of requiredFolders) {
      const folderPath = path.join(projectPath, folder.path);
      if (!await this.fileExists(folderPath)) {
        if (!folder.optional) {
          issues.push({
            severity: 'warning',
            category: 'node-organization',
            message: `Missing required folder: ${folder.path} - ${folder.description}`,
            rule: 'node-folder-structure'
          });
        }
      }
    }

    // Check for separation of concerns
    if (variant !== 'nextjs' && variant !== 'nextjs-app-router') {
      // Check if business logic is mixed with routes
      const routeFiles = await glob('src/routes/**/*.{js,ts}', {
        cwd: projectPath,
        ignore: ['**/*.test.*', '**/*.spec.*']
      });

      for (const file of routeFiles.slice(0, 5)) { // Check first 5 files
        const content = await this.readFile(path.join(projectPath, file));

        // Check for database queries in routes
        if (content.includes('SELECT ') || content.includes('INSERT INTO') ||
            content.includes('UPDATE ') || content.includes('DELETE FROM') ||
            content.includes('.find(') || content.includes('.save(') ||
            content.includes('.create(') || content.includes('.update(')) {
          issues.push({
            severity: 'error',
            category: 'separation-of-concerns',
            file,
            message: 'Database operations should be in service/repository layer, not in routes',
            rule: 'node-separation-of-concerns'
          });
          break; // One example is enough
        }
      }
    }

    return issues;
  }

  private async analyzeFirebaseFunctions(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const functionsPath = path.join(projectPath, 'functions', 'src');
    const limits = this.rules.getFirebaseLimits();

    // Check Firebase folder structure first
    issues.push(...await this.checkFirebaseStructure(projectPath));

    // Check functions structure
    const functionFiles = await glob('**/*.{ts,js}', {
      cwd: functionsPath,
      ignore: ['node_modules/**', '**/*.test.*', '**/*.spec.*']
    });

    for (const file of functionFiles) {
      const filePath = path.join(functionsPath, file);
      const content = await this.readFile(filePath);
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

      // Check individual function length (100 lines per function)
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
    if (!await this.fileExists(functionsPath)) {
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
      if (!await this.fileExists(dirPath)) {
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

          if (!await this.fileExists(indexPath)) {
            issues.push({
              severity: 'warning',
              category: 'firebase-structure',
              message: 'Missing functions/src/constants/index.ts',
              rule: 'firebase-constants-structure'
            });
          }

          if (!await this.fileExists(securityPath)) {
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

          if (!await this.fileExists(indexPath)) {
            issues.push({
              severity: 'warning',
              category: 'firebase-structure',
              message: 'Missing functions/src/function/index.ts for utility functions',
              rule: 'firebase-utils-structure'
            });
          }

          if (!await this.fileExists(securityUtilsPath)) {
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
          if (!await this.fileExists(indexPath)) {
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
    if (!await this.fileExists(mainIndexPath)) {
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

  private async analyzeJavaProject(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check Java/Spring Boot project organization (2025 standards)
    issues.push(...await this.checkJavaProjectStructure(projectPath));

    // Check for Java specific issues
    const javaFiles = await glob('**/*.java', {
      cwd: projectPath,
      ignore: ['target/**', 'build/**']
    });

    for (const file of javaFiles) {
      const filePath = path.join(projectPath, file);
      const content = await this.readFile(filePath);
      const lines = content.split('\n');

      // Check for System.out.println
      lines.forEach((line, index) => {
        if (line.includes('System.out.println')) {
          issues.push({
            severity: 'warning',
            category: 'java-logging',
            file,
            line: index + 1,
            message: 'Use proper logging framework instead of System.out.println',
            rule: 'java-no-sysout'
          });
        }
      });
    }

    return issues;
  }

  private async checkJavaProjectStructure(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Standard Spring Boot package structure (Layer-based or Feature-based)
    const basePackagePath = await this.findJavaBasePackage(projectPath);

    if (basePackagePath) {
      // Layer-based structure (traditional Spring Boot)
      const layerBasedFolders = [
        { path: 'controller', description: 'REST controllers' },
        { path: 'service', description: 'Business logic services' },
        { path: 'repository', description: 'Data access layer' },
        { path: 'model', description: 'Domain models/entities', altNames: ['entity', 'domain'] },
        { path: 'dto', description: 'Data Transfer Objects' },
        { path: 'config', description: 'Configuration classes' },
        { path: 'exception', description: 'Custom exceptions', optional: true },
        { path: 'util', description: 'Utility classes', optional: true },
        { path: 'mapper', description: 'Object mappers', optional: true }
      ];

      let hasLayerBased = false;
      let hasFeatureBased = false;

      // Check for layer-based structure
      for (const folder of layerBasedFolders) {
        let folderFound = false;
        const mainPath = path.join(basePackagePath, folder.path);

        if (await this.fileExists(mainPath)) {
          folderFound = true;
          hasLayerBased = true;
        } else if (folder.altNames) {
          // Check alternative names
          for (const altName of folder.altNames) {
            const altPath = path.join(basePackagePath, altName);
            if (await this.fileExists(altPath)) {
              folderFound = true;
              hasLayerBased = true;
              break;
            }
          }
        }

        if (!folderFound && !folder.optional && hasLayerBased) {
          issues.push({
            severity: 'warning',
            category: 'java-organization',
            message: `Missing package in layer-based structure: ${folder.path} - ${folder.description}`,
            rule: 'spring-boot-structure'
          });
        }
      }

      // Check for feature-based structure (alternative to layer-based)
      const featureDirs = await glob('*/', {
        cwd: basePackagePath
      });

      // If we find directories with both controller and service files, it's feature-based
      for (const dir of featureDirs) {
        const featurePath = path.join(basePackagePath, dir);
        const hasController = await glob('*Controller.java', { cwd: featurePath }).then(files => files.length > 0);
        const hasService = await glob('*Service.java', { cwd: featurePath }).then(files => files.length > 0);

        if (hasController && hasService) {
          hasFeatureBased = true;
          break;
        }
      }

      // If neither structure is found, report an issue
      if (!hasLayerBased && !hasFeatureBased) {
        issues.push({
          severity: 'error',
          category: 'java-organization',
          message: 'No clear package structure found. Use either layer-based or feature-based organization',
          rule: 'spring-boot-structure'
        });
      }
    }

    return issues;
  }

  private async findJavaBasePackage(projectPath: string): Promise<string | null> {
    // Find the main application class (with @SpringBootApplication)
    const mainClassFiles = await glob('**/src/main/java/**/*Application.java', {
      cwd: projectPath
    });

    if (mainClassFiles.length > 0) {
      const mainClassPath = path.dirname(path.join(projectPath, mainClassFiles[0]));
      return mainClassPath;
    }

    // Fallback: look for standard Maven/Gradle structure
    const srcMainJava = path.join(projectPath, 'src', 'main', 'java');
    if (await this.fileExists(srcMainJava)) {
      // Find the first package directory
      const packages = await glob('*/*/', {
        cwd: srcMainJava
      });

      if (packages.length > 0) {
        return path.join(srcMainJava, packages[0]);
      }
    }

    return null;
  }

  private async analyzeDotNetProject(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check .NET Clean Architecture organization (2025 standards)
    issues.push(...await this.checkDotNetProjectStructure(projectPath));

    // Check for .NET specific issues
    const csFiles = await glob('**/*.cs', {
      cwd: projectPath,
      ignore: ['bin/**', 'obj/**']
    });

    for (const file of csFiles) {
      const filePath = path.join(projectPath, file);
      const content = await this.readFile(filePath);
      const lines = content.split('\n');

      // Check for Console.WriteLine in non-console apps
      if (!file.includes('Program.cs')) {
        lines.forEach((line, index) => {
          if (line.includes('Console.WriteLine')) {
            issues.push({
              severity: 'warning',
              category: 'dotnet-logging',
              file,
              line: index + 1,
              message: 'Use ILogger instead of Console.WriteLine',
              rule: 'dotnet-no-console'
            });
          }
        });
      }
    }

    return issues;
  }

  private async checkDotNetProjectStructure(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check for Clean Architecture layers (2025 standards)
    const cleanArchitectureLayers = [
      {
        name: 'Domain',
        description: 'Core business logic and entities',
        folders: ['Entities', 'ValueObjects', 'Enums', 'Exceptions', 'Interfaces']
      },
      {
        name: 'Application',
        description: 'Application business rules',
        folders: ['Services', 'Interfaces', 'DTOs', 'Mappings', 'Validators']
      },
      {
        name: 'Infrastructure',
        description: 'External concerns',
        folders: ['Data', 'Repositories', 'Services', 'Identity']
      },
      {
        name: 'Presentation',
        altNames: ['WebAPI', 'API', 'Web'],
        description: 'User interface layer',
        folders: ['Controllers', 'ViewModels', 'Filters', 'Middleware']
      }
    ];

    // Check if solution follows Clean Architecture
    let hasCleanArchitecture = false;
    const solutionFiles = await glob('*.sln', { cwd: projectPath });

    if (solutionFiles.length > 0) {
      // Check for Clean Architecture project structure
      for (const layer of cleanArchitectureLayers) {
        const layerPath = path.join(projectPath, layer.name);
        let layerFound = await this.fileExists(layerPath);

        // Check alternative names
        if (!layerFound && layer.altNames) {
          for (const altName of layer.altNames) {
            const altPath = path.join(projectPath, altName);
            if (await this.fileExists(altPath)) {
              layerFound = true;
              break;
            }
          }
        }

        if (layerFound) {
          hasCleanArchitecture = true;

          // Check for required folders within each layer
          for (const folder of layer.folders) {
            const folderPath = path.join(projectPath, layer.name, folder);
            if (!await this.fileExists(folderPath)) {
              issues.push({
                severity: 'info',
                category: 'dotnet-organization',
                message: `Missing folder in ${layer.name} layer: ${folder}`,
                rule: 'clean-architecture-structure'
              });
            }
          }
        }
      }
    }

    // If not Clean Architecture, check for standard MVC/API structure
    if (!hasCleanArchitecture) {
      const standardFolders = [
        { path: 'Controllers', description: 'API/MVC controllers' },
        { path: 'Models', description: 'Data models', altNames: ['Entities'] },
        { path: 'Services', description: 'Business logic services' },
        { path: 'Data', description: 'Data context and migrations', optional: true },
        { path: 'Repositories', description: 'Repository pattern', optional: true },
        { path: 'DTOs', description: 'Data Transfer Objects', optional: true },
        { path: 'ViewModels', description: 'View models for MVC', optional: true },
        { path: 'Helpers', description: 'Helper utilities', optional: true },
        { path: 'Middleware', description: 'Custom middleware', optional: true }
      ];

      for (const folder of standardFolders) {
        let folderFound = false;
        const mainPath = path.join(projectPath, folder.path);

        if (await this.fileExists(mainPath)) {
          folderFound = true;
        } else if (folder.altNames) {
          for (const altName of folder.altNames) {
            const altPath = path.join(projectPath, altName);
            if (await this.fileExists(altPath)) {
              folderFound = true;
              break;
            }
          }
        }

        if (!folderFound && !folder.optional) {
          issues.push({
            severity: 'warning',
            category: 'dotnet-organization',
            message: `Missing folder: ${folder.path} - ${folder.description}`,
            rule: 'dotnet-folder-structure'
          });
        }
      }
    }

    return issues;
  }

  private async analyzeAngularProject(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check Angular project organization (2025 standards - Feature modules)
    issues.push(...await this.checkAngularProjectStructure(projectPath));

    // Check Angular specific patterns
    const componentFiles = await glob('src/**/*.component.ts', {
      cwd: projectPath,
      ignore: ['node_modules/**']
    });

    for (const file of componentFiles) {
      const filePath = path.join(projectPath, file);
      const content = await this.readFile(filePath);

      // Check for direct DOM manipulation
      if (content.includes('document.getElementById') || content.includes('document.querySelector')) {
        issues.push({
          severity: 'error',
          category: 'angular-patterns',
          file,
          message: 'Direct DOM manipulation detected - use Angular APIs',
          rule: 'angular-no-dom'
        });
      }
    }

    return issues;
  }

  private async checkAngularProjectStructure(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Angular 17+ structure with feature modules (2025 standards)
    const requiredFolders = [
      { path: 'src/app/core', description: 'Core module (singletons, guards, interceptors)' },
      { path: 'src/app/shared', description: 'Shared module (components, directives, pipes)' },
      { path: 'src/app/features', description: 'Feature modules', altNames: ['modules'] },
      { path: 'src/assets', description: 'Static assets (images, fonts)' },
      { path: 'src/environments', description: 'Environment configurations' },
      { path: 'src/styles', description: 'Global styles', optional: true }
    ];

    // Check for required folders
    for (const folder of requiredFolders) {
      let folderFound = false;
      const mainPath = path.join(projectPath, folder.path);

      if (await this.fileExists(mainPath)) {
        folderFound = true;
      } else if (folder.altNames) {
        for (const altName of folder.altNames) {
          const altPath = path.join(projectPath, 'src', 'app', altName);
          if (await this.fileExists(altPath)) {
            folderFound = true;
            break;
          }
        }
      }

      if (!folderFound && !folder.optional) {
        issues.push({
          severity: 'warning',
          category: 'angular-organization',
          message: `Missing folder: ${folder.path} - ${folder.description}`,
          rule: 'angular-folder-structure'
        });
      }
    }

    // Check core module structure
    const corePath = path.join(projectPath, 'src', 'app', 'core');
    if (await this.fileExists(corePath)) {
      const coreSubfolders = [
        { path: 'services', description: 'Singleton services' },
        { path: 'guards', description: 'Route guards', optional: true },
        { path: 'interceptors', description: 'HTTP interceptors', optional: true },
        { path: 'models', description: 'Core models/interfaces', optional: true }
      ];

      for (const subfolder of coreSubfolders) {
        const subfolderPath = path.join(corePath, subfolder.path);
        if (!await this.fileExists(subfolderPath) && !subfolder.optional) {
          issues.push({
            severity: 'info',
            category: 'angular-organization',
            message: `Missing core subfolder: core/${subfolder.path} - ${subfolder.description}`,
            rule: 'angular-core-structure'
          });
        }
      }
    }

    // Check shared module structure
    const sharedPath = path.join(projectPath, 'src', 'app', 'shared');
    if (await this.fileExists(sharedPath)) {
      const sharedSubfolders = [
        { path: 'components', description: 'Shared components' },
        { path: 'directives', description: 'Custom directives', optional: true },
        { path: 'pipes', description: 'Custom pipes', optional: true },
        { path: 'models', description: 'Shared models/interfaces', optional: true }
      ];

      for (const subfolder of sharedSubfolders) {
        const subfolderPath = path.join(sharedPath, subfolder.path);
        if (!await this.fileExists(subfolderPath) && !subfolder.optional) {
          issues.push({
            severity: 'info',
            category: 'angular-organization',
            message: `Missing shared subfolder: shared/${subfolder.path} - ${subfolder.description}`,
            rule: 'angular-shared-structure'
          });
        }
      }
    }

    // Check for feature modules
    const featuresPath = path.join(projectPath, 'src', 'app', 'features');
    const modulesPath = path.join(projectPath, 'src', 'app', 'modules');
    const hasFeatures = await this.fileExists(featuresPath) || await this.fileExists(modulesPath);

    if (hasFeatures) {
      const actualPath = await this.fileExists(featuresPath) ? featuresPath : modulesPath;
      const featureDirs = await glob('*/', {
        cwd: actualPath
      });

      // Each feature should have its own module structure
      for (const feature of featureDirs) {
        const featurePath = path.join(actualPath, feature);
        const expectedFiles = [
          { file: `${feature.replace(/\/$/, '')}.module.ts`, description: 'Feature module', optional: true }, // Optional for standalone components
          { file: `${feature.replace(/\/$/, '')}-routing.module.ts`, description: 'Feature routing', optional: true }
        ];

        // Check for components, services, etc. in each feature
        const featureStructure = [
          { path: 'components', description: 'Feature components' },
          { path: 'services', description: 'Feature services', optional: true },
          { path: 'pages', description: 'Feature pages/containers', optional: true }
        ];

        for (const struct of featureStructure) {
          const structPath = path.join(featurePath, struct.path);
          if (!await this.fileExists(structPath) && !struct.optional) {
            issues.push({
              severity: 'info',
              category: 'angular-organization',
              message: `Feature ${feature} missing folder: ${struct.path} - ${struct.description}`,
              rule: 'angular-feature-structure'
            });
          }
        }
      }
    }

    return issues;
  }

  private async analyzeAmplifyProject(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check for Amplify configuration
    const amplifyPath = path.join(projectPath, 'amplify');
    if (await this.fileExists(amplifyPath)) {
      // Check for hardcoded credentials
      const configFiles = await glob('amplify/**/*.{json,js,ts}', {
        cwd: projectPath
      });

      for (const file of configFiles) {
        const content = await this.readFile(path.join(projectPath, file));
        if (content.includes('accessKeyId') || content.includes('secretAccessKey')) {
          issues.push({
            severity: 'error',
            category: 'security',
            file,
            message: 'Possible hardcoded AWS credentials detected',
            rule: 'amplify-no-credentials'
          });
        }
      }
    }

    return issues;
  }

  private async checkCommonIssues(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check for TODO comments
    const allFiles = await glob('**/*.{js,ts,jsx,tsx,java,cs}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'build/**', 'dist/**', 'target/**']
    });

    for (const file of allFiles.slice(0, 50)) { // Limit for performance
      const content = await this.readFile(path.join(projectPath, file));
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.includes('TODO') || line.includes('FIXME')) {
          issues.push({
            severity: 'info',
            category: 'maintenance',
            file,
            line: index + 1,
            message: 'TODO/FIXME comment found',
            rule: 'no-todo'
          });
        }
      });
    }

    return issues;
  }

  private async checkMultiProjectIssues(projectPath: string, subProjects: any[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check for duplicate dependencies across sub-projects
    const allDeps = new Map<string, string[]>();

    for (const subProject of subProjects) {
      const packageJsonPath = path.join(projectPath, subProject.path, 'package.json');
      if (await this.fileExists(packageJsonPath)) {
        const packageJson = JSON.parse(await this.readFile(packageJsonPath));
        const deps = Object.keys(packageJson.dependencies || {});

        deps.forEach(dep => {
          if (!allDeps.has(dep)) {
            allDeps.set(dep, []);
          }
          allDeps.get(dep)!.push(subProject.path);
        });
      }
    }

    // Report duplicates
    allDeps.forEach((projects, dep) => {
      if (projects.length > 1) {
        issues.push({
          severity: 'info',
          category: 'multi-project',
          message: `Dependency "${dep}" is duplicated in: ${projects.join(', ')}`,
          rule: 'duplicate-dependency'
        });
      }
    });

    return issues;
  }

  private async calculateStats(projectPath: string): Promise<QualityStats> {
    const allFiles = await glob('**/*.{js,ts,jsx,tsx,java,cs}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'build/**', 'dist/**', 'target/**']
    });

    let totalLines = 0;
    let totalFiles = allFiles.length;

    for (const file of allFiles.slice(0, 100)) { // Sample for performance
      const content = await this.readFile(path.join(projectPath, file));
      totalLines += content.split('\n').length;
    }

    return {
      totalFiles,
      totalLines,
      averageFileSize: totalFiles > 0 ? Math.round(totalLines / Math.min(allFiles.length, 100)) : 0,
      duplicateCode: 0, // Would need more complex analysis
      unusedCode: 0,    // Would need more complex analysis
      complexity: 0     // Would need more complex analysis
    };
  }

  private calculateScore(issues: QualityIssue[], stats: QualityStats): number {
    let score = 100;

    // Deduct points based on issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'error':
          score -= 5;
          break;
        case 'warning':
          score -= 2;
          break;
        case 'info':
          score -= 0.5;
          break;
      }
    });

    // Ensure score doesn't go below 0
    return Math.max(0, Math.round(score));
  }

  private generateRecommendations(issues: QualityIssue[], projectInfo: ProjectInfo): string[] {
    const recommendations: string[] = [];
    const issueCategories = new Set(issues.map(i => i.category));

    if (issueCategories.has('file-size')) {
      recommendations.push('Consider breaking down large files into smaller, more focused modules');
    }

    if (issueCategories.has('imports')) {
      recommendations.push('Set up path aliases in tsconfig.json to avoid deep relative imports');
    }

    if (issueCategories.has('firebase-structure')) {
      recommendations.push('Split Firebase functions into separate files (max 5 functions per file)');
    }

    if (issueCategories.has('code-quality')) {
      recommendations.push('Replace console.log with proper logging framework');
    }

    if (projectInfo.isMultiProject) {
      recommendations.push('Consider using a monorepo tool like Lerna or Nx for better dependency management');
    }

    return recommendations;
  }

  public async getRecommendations(projectPath: string, projectInfo: ProjectInfo, language: string): Promise<any> {
    const report = await this.analyzeQuality(projectPath, projectInfo);

    if (language === 'he') {
      return {
        score: report.score,
        projectTypes: projectInfo.types,
        recommendations: this.translateToHebrew(report.recommendations),
        topIssues: report.issues.slice(0, 5).map(issue => ({
          ...issue,
          message: this.translateIssueToHebrew(issue)
        }))
      };
    }

    return {
      score: report.score,
      projectTypes: projectInfo.types,
      recommendations: report.recommendations,
      topIssues: report.issues.slice(0, 5)
    };
  }

  private translateToHebrew(recommendations: string[]): string[] {
    const translations: { [key: string]: string } = {
      'Consider breaking down large files into smaller, more focused modules': 'מומלץ לפרק קבצים גדולים למודולים קטנים וממוקדים יותר',
      'Set up path aliases in tsconfig.json to avoid deep relative imports': 'הגדר path aliases ב-tsconfig.json כדי להימנע מייבואים יחסיים עמוקים',
      'Split Firebase functions into separate files (max 5 functions per file)': 'פצל Firebase functions לקבצים נפרדים (מקסימום 5 פונקציות לקובץ)',
      'Replace console.log with proper logging framework': 'החלף console.log במערכת לוגים מתאימה',
      'Consider using a monorepo tool like Lerna or Nx for better dependency management': 'שקול להשתמש בכלי monorepo כמו Lerna או Nx לניהול תלויות טוב יותר'
    };

    return recommendations.map(rec => translations[rec] || rec);
  }

  private translateIssueToHebrew(issue: QualityIssue): string {
    const translations: { [key: string]: string } = {
      'Console.log found - use logger instead': 'נמצא console.log - השתמש ב-logger במקום',
      'Deep relative import found - use path aliases': 'נמצא ייבוא יחסי עמוק - השתמש ב-path aliases',
      'TODO/FIXME comment found': 'נמצאה הערת TODO/FIXME'
    };

    return translations[issue.message] || issue.message;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return '';
    }
  }
}