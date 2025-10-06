import * as path from 'path';
import { glob } from 'glob';
import { QualityIssue, ProjectInfo } from '../types/QualityTypes.js';
import { FileUtils } from '../utils/FileUtils.js';
import { CodeAnalysisUtils } from '../utils/CodeAnalysisUtils.js';
import { LimitsService } from './LimitsService.js';

export class ReactAnalysisService {
  private limitsService: LimitsService;

  constructor() {
    this.limitsService = new LimitsService();
  }

  public async analyzeReactProject(projectPath: string, variant: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const limits = this.limitsService.getReactLimits(variant);

    // Check component structure first
    issues.push(...await this.checkReactComponentStructure(projectPath));

    // Check component files
    const componentFiles = await glob('src/**/*.{tsx,jsx}', {
      cwd: projectPath,
      ignore: ['node_modules/**', '**/*.test.*', '**/*.spec.*']
    });

    for (const file of componentFiles) {
      const filePath = path.join(projectPath, file);
      const content = await FileUtils.readFile(filePath);
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
      const consoleViolations = CodeAnalysisUtils.checkConsoleLogs(lines);
      consoleViolations.forEach(violation => {
        issues.push({
          severity: 'error',
          category: 'code-quality',
          file,
          line: violation.line,
          message: 'Console.log found - use logger instead',
          rule: 'no-console'
        });
      });

      // Check for relative imports
      const importViolations = CodeAnalysisUtils.checkDeepImports(lines);
      importViolations.forEach(violation => {
        issues.push({
          severity: 'warning',
          category: 'imports',
          file,
          line: violation.line,
          message: 'Deep relative import found - use path aliases',
          rule: 'no-deep-imports'
        });
      });

      // Check line length
      const maxLineLength = limits.maxLineLength || 120;
      const lineLengthViolations = CodeAnalysisUtils.checkLineLength(lines, maxLineLength);
      lineLengthViolations.forEach(violation => {
        issues.push({
          severity: 'info',
          category: 'code-style',
          file,
          line: violation.line,
          message: `Line exceeds ${maxLineLength} characters (${violation.length} chars)`,
          rule: 'max-line-length'
        });
      });

      // Check function length in React components
      const functions = CodeAnalysisUtils.findFunctions(content);
      const maxFunctionLines = limits.maxFunctionLines || 30;

      functions.forEach(func => {
        const funcLength = func.endLine - func.startLine + 1;

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
      if (!await FileUtils.fileExists(folderPath)) {
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

      // Check for main component file (either tsx or jsx)
      const hasIndexTsx = await FileUtils.fileExists(path.join(componentPath, 'index.tsx'));
      const hasIndexJsx = await FileUtils.fileExists(path.join(componentPath, 'index.jsx'));

      if (!hasIndexTsx && !hasIndexJsx) {
        issues.push({
          severity: 'error',
          category: 'react-structure',
          file: dir,
          message: `Component ${componentName} missing required file: index.tsx or index.jsx`,
          rule: 'react-component-structure'
        });
      }

      // Check for hooks folder and proper hook structure
      const hooksPath = path.join(componentPath, 'hooks');
      if (await FileUtils.fileExists(hooksPath)) {
        const expectedHooks = [
          `use${componentName}State.ts`,
          `use${componentName}Logic.ts`,
          `use${componentName}Effects.ts`
        ];

        for (const hookFile of expectedHooks) {
          if (!await FileUtils.fileExists(path.join(hooksPath, hookFile))) {
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
    }

    return issues;
  }
}
