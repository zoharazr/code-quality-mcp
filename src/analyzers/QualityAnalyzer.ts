import * as path from 'path';
import { glob } from 'glob';
import { ProjectInfo } from '../detectors/ProjectDetector.js';
import { QualityReport, QualityIssue, QualityStats, AnalysisOptions } from '../types/QualityTypes.js';
import { FileUtils } from '../utils/FileUtils.js';
import { CodeAnalysisUtils } from '../utils/CodeAnalysisUtils.js';
import { ReactAnalysisService } from '../services/ReactAnalysisService.js';
import { FirebaseAnalysisService } from '../services/FirebaseAnalysisService.js';
import { AICodeAnalyzer } from '../services/AICodeAnalyzer.js';

export class QualityAnalyzer {
  private reactAnalysisService: ReactAnalysisService;
  private firebaseAnalysisService: FirebaseAnalysisService;
  private aiAnalyzer: AICodeAnalyzer;

  // Smart ignore patterns - expanded for all project types
  private readonly IGNORE_PATTERNS = [
    'node_modules/**',
    '.git/**',
    'build/**',
    'dist/**',
    'out/**',
    'target/**',
    'bin/**',
    'obj/**',
    'coverage/**',
    '.next/**',
    '.nuxt/**',
    '.cache/**',
    '.vercel/**',
    'vendor/**',
    'Pods/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.min.js',
    '**/*.bundle.js',
    'examples/**',  // Documentation/example files - intentionally have unused vars
    // React Native specific
    'android/gradle/**',
    'android/build/**',
    'android/app/build/**',
    'ios/Pods/**',
    'ios/build/**',
    'ios/*.xcworkspace/**',
    'ios/*.xcodeproj/xcuserdata/**',
    'ios/*.xcodeproj/project.xcworkspace/**'
  ];

  constructor() {
    this.reactAnalysisService = new ReactAnalysisService();
    this.firebaseAnalysisService = new FirebaseAnalysisService();
    this.aiAnalyzer = new AICodeAnalyzer();
  }

  private getIgnorePatternsForProject(projectTypes: string[]): string[] {
    const patterns = [...this.IGNORE_PATTERNS];

    if (projectTypes.includes('react-native')) {
      // For React Native, be more aggressive with android/ios ignoring
      patterns.push(
        'android/**/*.gradle',
        'android/gradlew*',
        'ios/Podfile.lock'
      );
    }

    return patterns;
  }

  /**
   * HYBRID ANALYSIS - Combines logic-based (fast) and AI-powered (deep) analysis
   *
   * @param projectPath - Path to the project
   * @param projectInfo - Project information
   * @param options - Analysis options (controls AI usage)
   */
  public async analyzeQuality(
    projectPath: string,
    projectInfo: ProjectInfo,
    options: AnalysisOptions = {}
  ): Promise<QualityReport> {
    const issues: QualityIssue[] = [];
    const stats = await this.calculateStats(projectPath);
    const aiInsights: string[] = [];

    // Determine analysis mode
    const useDeepAnalysis = options.deepAnalysis || options.aiEnabled || false;
    const analysisType = useDeepAnalysis ? 'deep' : 'fast';

    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔍 Quality Analysis Mode: ${analysisType.toUpperCase()}`);
    console.log(`${'='.repeat(50)}\n`);

    if (useDeepAnalysis) {
      this.aiAnalyzer.enableAI();
      console.log('🤖 AI-powered deep analysis enabled');
      console.log('⚡ Logic-based fast checks also running\n');
    } else {
      this.aiAnalyzer.disableAI();
      console.log('⚡ Fast mode - logic-based analysis only\n');
    }

    // ==== FAST CHECKS (Always run - logic-based) ====

    // Apply rules based on project type
    for (const projectType of projectInfo.types) {
      const typeIssues = await this.analyzeByType(projectPath, projectType);
      issues.push(...typeIssues);
    }

    // Check for common issues across all types
    const commonIssues = await this.checkCommonIssues(projectPath);
    issues.push(...commonIssues);

    // Check for Hebrew comments (logic-based)
    const hebrewCommentIssues = await this.checkHebrewComments(projectPath);
    issues.push(...hebrewCommentIssues);

    // Check for missing error logging (logic-based)
    const missingLoggingIssues = await this.checkMissingErrorLogging(projectPath);
    issues.push(...missingLoggingIssues);

    // Check multi-project specific issues
    if (projectInfo.isMultiProject && projectInfo.subProjects) {
      const multiProjectIssues = await this.checkMultiProjectIssues(projectPath, projectInfo.subProjects);
      issues.push(...multiProjectIssues);
    }

    // ==== CONDITIONAL CHECKS (Based on options) ====

    // Unused code check (can be disabled)
    if (options.checkUnusedCode !== false) {
      const unusedCodeIssues = await this.checkUnusedCode(projectPath, useDeepAnalysis);
      issues.push(...unusedCodeIssues);
    }

    // ==== DEEP ANALYSIS (Only if enabled) ====

    if (useDeepAnalysis) {
      console.log('\n🧠 Running AI-powered deep analysis...');
      const deepAnalysisResults = await this.runDeepAnalysis(projectPath, options);
      issues.push(...deepAnalysisResults.issues);
      aiInsights.push(...deepAnalysisResults.insights);
      console.log(`✅ AI analysis complete - found ${deepAnalysisResults.issues.length} additional issues\n`);
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
      stats,
      analysisType,
      aiInsights: aiInsights.length > 0 ? aiInsights : undefined
    };
  }

  /**
   * Run deep AI-powered analysis
   */
  private async runDeepAnalysis(
    projectPath: string,
    options: AnalysisOptions
  ): Promise<{ issues: QualityIssue[]; insights: string[] }> {
    const issues: QualityIssue[] = [];
    const insights: string[] = [];
    const ignorePatterns = this.IGNORE_PATTERNS;

    const allFiles = await glob('**/*.{js,ts,jsx,tsx}', {
      cwd: projectPath,
      ignore: ignorePatterns
    });

    // Analyze a sample of files with AI (limit to avoid costs)
    const filesToAnalyze = allFiles.slice(0, 10);

    for (const file of filesToAnalyze) {
      const content = await FileUtils.readFile(path.join(projectPath, file));

      // Run comprehensive AI analysis
      const aiResults = await this.aiAnalyzer.comprehensiveAnalysis(content, file);

      // Add AI-discovered issues
      issues.push(...aiResults.unusedCode);
      issues.push(...aiResults.codeSmells);

      // Add AI suggestions as insights
      if (aiResults.suggestions.length > 0) {
        insights.push(`${file}:`);
        insights.push(...aiResults.suggestions);
      }
    }

    return { issues, insights };
  }

  private async analyzeByType(projectPath: string, projectType: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    switch (projectType) {
      case 'react':
      case 'react-native':
        issues.push(...await this.reactAnalysisService.analyzeReactProject(projectPath, projectType));
        break;
      case 'nodejs':
      case 'nextjs':
      case 'nest':
        issues.push(...await this.analyzeNodeProject(projectPath, projectType));
        break;
      case 'firebase-functions':
        issues.push(...await this.firebaseAnalysisService.analyzeFirebaseFunctions(projectPath));
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




  private async analyzeNodeProject(projectPath: string, variant: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const ignorePatterns = this.IGNORE_PATTERNS;

    // Check Node.js project organization (2025 standards)

    // Check for unused dependencies
    const packageJsonPath = path.join(projectPath, 'package.json');
      if (await FileUtils.fileExists(packageJsonPath)) {
        const packageJson = await FileUtils.readJsonFile(packageJsonPath);

      // Basic check for common unused packages
      const commonUnused = ['lodash', 'moment', 'axios'];
      const deps = Object.keys(packageJson.dependencies || {});

      for (const dep of commonUnused) {
        if (deps.includes(dep)) {
          const searchPattern = `**/*.{js,ts,jsx,tsx}`;
          const files = await glob(searchPattern, { cwd: projectPath, ignore: ['node_modules/**'] });
          let isUsed = false;

          for (const file of files.slice(0, 10)) { // Check first 10 files for performance
            const content = await FileUtils.readFile(path.join(projectPath, file));
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




  private async analyzeJavaProject(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const ignorePatterns = this.IGNORE_PATTERNS;

    // Check for Java specific issues
    const javaFiles = await glob('**/*.java', {
        cwd: projectPath,
      ignore: ignorePatterns
    });

    for (const file of javaFiles) {
      const filePath = path.join(projectPath, file);
      const content = await FileUtils.readFile(filePath);
      const lines = content.split('\n');

      // Check for System.out.println
      lines.forEach((line: string, index: number) => {
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


  private async analyzeDotNetProject(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const ignorePatterns = this.IGNORE_PATTERNS;

    // Check for .NET specific issues
    const csFiles = await glob('**/*.cs', {
        cwd: projectPath,
      ignore: ignorePatterns
    });

    for (const file of csFiles) {
      const filePath = path.join(projectPath, file);
      const content = await FileUtils.readFile(filePath);
      const lines = content.split('\n');

      // Check for Console.WriteLine in non-console apps
      if (!file.includes('Program.cs')) {
        lines.forEach((line: string, index: number) => {
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


  private async analyzeAngularProject(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const ignorePatterns = this.IGNORE_PATTERNS;

    // Check Angular specific patterns
    const componentFiles = await glob('src/**/*.component.ts', {
      cwd: projectPath,
      ignore: ignorePatterns
    });

    for (const file of componentFiles) {
      const filePath = path.join(projectPath, file);
      const content = await FileUtils.readFile(filePath);

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


  private async analyzeAmplifyProject(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const ignorePatterns = this.IGNORE_PATTERNS;

    // Check for Amplify configuration
    const amplifyPath = path.join(projectPath, 'amplify');
    if (await FileUtils.fileExists(amplifyPath)) {
      // Check for hardcoded credentials
      const configFiles = await glob('amplify/**/*.{json,js,ts}', {
        cwd: projectPath
      });

      for (const file of configFiles) {
        const content = await FileUtils.readFile(path.join(projectPath, file));
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
    const ignorePatterns = this.IGNORE_PATTERNS;

    // Check for TODO comments
    const allFiles = await glob('**/*.{js,ts,jsx,tsx,java,cs}', {
      cwd: projectPath,
      ignore: ignorePatterns
    });

    for (const file of allFiles.slice(0, 50)) { // Limit for performance
      const content = await FileUtils.readFile(path.join(projectPath, file));
      const lines = content.split('\n');

      const todoViolations = CodeAnalysisUtils.checkTodoComments(lines);
      todoViolations.forEach(violation => {
        // Skip TODO/FIXME in code quality analysis files (they're part of the logic)
        if (this.isCodeQualityAnalysisFile(file)) {
          return;
        }
        
        // Skip TODO/FIXME that are part of checking logic (even in other files)
        const lineContent = lines[violation.line - 1];
        if (this.isTodoCheckLogic(content, lineContent)) {
          return;
        }
        
            issues.push({
              severity: 'info',
          category: 'maintenance',
          file,
          line: violation.line,
          message: 'TODO/FIXME comment found',
          rule: 'no-todo'
        });
      });
    }

    return issues;
  }

  private async checkUnusedCode(projectPath: string, useAI: boolean = false): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const ignorePatterns = this.IGNORE_PATTERNS;

    /**
     * NEW APPROACH: Since we're an MCP server running through Claude,
     * we should leverage AI for code analysis instead of regex patterns.
     * This would eliminate false positives and provide better insights.
     *
     * For now, we use a simplified approach that:
     * 1. Only checks for truly unused local variables (appear only once)
     * 2. Checks exported constants in constant files for usage across the project
     *
     * In production, we should call: this.aiAnalyzer.analyzeUnusedCode(content, file)
     */

    // Check for unused imports and variables
    const allFiles = await glob('**/*.{js,ts,jsx,tsx}', {
      cwd: projectPath,
      ignore: ignorePatterns
    });

    for (const file of allFiles.slice(0, 50)) { // Limit for performance
      const filePath = path.join(projectPath, file);

      // Skip files marked with @skip-quality-check
      if (await this.shouldSkipFile(filePath)) {
        continue;
      }

      const content = await FileUtils.readFile(filePath);

      // Simple approach: check if declared variables appear more than once in the file
      const issues_in_file = this.findUnusedVariablesSimple(content, file);
      issues.push(...issues_in_file);

      // Special check for exported constants that are never imported
      if (file.includes('constants') || file.includes('Constants')) {
        const exportedConstants = this.findExportedConstants(content);
        for (const constant of exportedConstants) {
          const isUsedAnywhere = await this.isConstantUsedInProject(constant, projectPath, file);
          if (!isUsedAnywhere) {
            issues.push({
              severity: 'warning',
              category: 'unused-code',
              file,
              line: this.getLineNumber(content, constant),
              message: `Exported constant '${constant}' is never imported or used`,
              rule: 'no-unused-exports'
            });
          }
        }
      }
    }

    return issues;
  }

  private findUnusedVariablesSimple(content: string, file: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const lines = content.split('\n');

    // Remove comments and strings for analysis
    const cleanContent = content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/'[^']*'/g, '""')
      .replace(/"[^"]*"/g, '""')
      .replace(/`[^`]*`/g, '""');

    // Find local variable declarations (not exported, not function parameters)
    const varDeclarations: Array<{ name: string; line: number }> = [];
    lines.forEach((line, index) => {
      // Skip exported variables
      if (line.includes('export')) return;

      // Find const/let/var declarations
      const match = line.match(/^\s*(?:const|let|var)\s+(\w+)\s*=/);
      if (match) {
        const varName = match[1];
        varDeclarations.push({
          name: varName,
          line: index + 1
        });
      }
    });

    // Check if each variable is used more than once
    for (const variable of varDeclarations) {
      // Count occurrences (should be at least 2: declaration + usage)
      const regex = new RegExp(`\\b${variable.name}\\b`, 'g');
      const matches = cleanContent.match(regex);
      const occurrences = matches ? matches.length : 0;

      // If only appears once (just the declaration), it's unused
      if (occurrences === 1) {
        // Double-check it's not a special case (like a React component or a function)
        const lineContent = lines[variable.line - 1];

        // Skip if it's a React component (starts with capital letter)
        if (/^[A-Z]/.test(variable.name)) continue;

        // Skip if it's assigned a function that might be exported later
        if (lineContent.includes('=>') || lineContent.includes('function')) continue;

        // Skip if it's used in a return statement elsewhere
        if (cleanContent.includes(`return ${variable.name}`) ||
            cleanContent.includes(`return { ${variable.name}`) ||
            cleanContent.includes(`{${variable.name}}`) ||
            cleanContent.includes(`${variable.name}:`)) continue;

        issues.push({
          severity: 'warning',
          category: 'unused-code',
          file,
          line: variable.line,
          message: `Variable '${variable.name}' is declared but never used`,
          rule: 'no-unused-vars'
        });
      }
    }

    return issues;
  }

  private findExportedConstants(content: string): string[] {
    const constants: string[] = [];
    const regex = /export\s+const\s+(\w+)\s*=/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      constants.push(match[1]);
    }

    return constants;
  }

  private async isConstantUsedInProject(constantName: string, projectPath: string, declaringFile: string): Promise<boolean> {
    const ignorePatterns = this.IGNORE_PATTERNS;
    const allFiles = await glob('**/*.{js,ts,jsx,tsx}', {
      cwd: projectPath,
      ignore: ignorePatterns
    });

    for (const file of allFiles) {
      // Skip the file where the constant is declared
      if (file === declaringFile) continue;

      const content = await FileUtils.readFile(path.join(projectPath, file));

      // Check if the constant is imported or used
      if (content.includes(constantName)) {
        // Make sure it's actually imported/used, not just mentioned in a comment
        const cleanContent = content
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '');

        if (cleanContent.includes(constantName)) {
          return true;
        }
      }
    }

    return false;
  }

  private getLineNumber(content: string, searchTerm: string): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchTerm)) {
        return i + 1;
      }
    }
    return 0;
  }

  // All deprecated functions removed - using AI-based approach instead

  private isKeyword(name: string): boolean {
    const keywords = [
      'const', 'let', 'var', 'function', 'if', 'else', 'for', 'while', 'return',
      'import', 'export', 'from', 'as', 'default', 'class', 'extends', 'implements',
      'interface', 'type', 'enum', 'namespace', 'module', 'declare', 'public',
      'private', 'protected', 'static', 'readonly', 'abstract', 'async', 'await',
      'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'typeof',
      'instanceof', 'in', 'of', 'true', 'false', 'null', 'undefined'
    ];
    return keywords.includes(name);
  }

  private isCommonPattern(name: string): boolean {
    const patterns = [
      'console', 'window', 'document', 'process', 'global', 'module', 'exports',
      'require', 'Buffer', 'Array', 'Object', 'String', 'Number', 'Boolean',
      'Date', 'RegExp', 'Error', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet'
    ];
    return patterns.includes(name);
  }


  private isCodeQualityAnalysisFile(filePath: string): boolean {
    // Files that are part of the code quality analysis logic
    // Note: We still check these files for unused code, but skip TODO/FIXME detection
    const analysisFiles = [
      'src/utils/CodeAnalysisUtils.ts',
      'src/analyzers/QualityAnalyzer.ts',
      'src/services/ValidationService.ts',
      'src/services/ReactAnalysisService.ts',
      'src/services/FirebaseAnalysisService.ts'
    ];

    return analysisFiles.some(analysisFile => filePath.includes(analysisFile));
  }

  private async shouldSkipFile(filePath: string): Promise<boolean> {
    // Check if file has @skip-quality-check marker
    try {
      const content = await FileUtils.readFile(filePath);
      return content.includes('@skip-quality-check');
    } catch {
      return false;
    }
  }

  private async checkHebrewComments(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const ignorePatterns = this.IGNORE_PATTERNS;

    // Check for Hebrew comments
    const allFiles = await glob('**/*.{js,ts,jsx,tsx,java,cs}', {
      cwd: projectPath,
      ignore: ignorePatterns
    });

    for (const file of allFiles.slice(0, 30)) { // Limit for performance
      const content = await FileUtils.readFile(path.join(projectPath, file));
      const lines = content.split('\n');

        lines.forEach((line, index) => {
        // Check for Hebrew characters in comments
        if (this.containsHebrew(line) && this.isCommentLine(line)) {
        issues.push({
              severity: 'warning',
            category: 'code-style',
          file,
              line: index + 1,
            message: 'Hebrew comment found - use English for better maintainability',
            rule: 'no-hebrew-comments'
        });
      }
        });
    }

    return issues;
  }

  private async checkMissingErrorLogging(projectPath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const ignorePatterns = this.IGNORE_PATTERNS;

    // Check for missing error logging in catch blocks
    const allFiles = await glob('**/*.{js,ts,jsx,tsx,java,cs}', {
      cwd: projectPath,
      ignore: ignorePatterns
    });

    for (const file of allFiles.slice(0, 30)) { // Limit for performance
      const content = await FileUtils.readFile(path.join(projectPath, file));
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for catch blocks (skip comment lines)
        if (!this.isCommentLine(line) && line.includes('catch') && (line.includes('{') || lines[i + 1]?.includes('{'))) {
          const catchBlock = this.getCatchBlock(lines, i);
          
          // Check if catch block has proper error logging
          if (!this.hasErrorLogging(catchBlock)) {
        issues.push({
          severity: 'warning',
              category: 'error-handling',
              file,
              line: i + 1,
              message: 'Catch block missing error logging - add logger.error() or console.error()',
              rule: 'catch-must-log'
        });
      }
    }
      }
    }

    return issues;
  }

  private containsHebrew(text: string): boolean {
    // Hebrew Unicode range: U+0590-U+05FF
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text);
  }

  private isCommentLine(line: string): boolean {
    const trimmedLine = line.trim();
    return trimmedLine.startsWith('//') || 
           trimmedLine.startsWith('/*') || 
           trimmedLine.startsWith('*') ||
           trimmedLine.startsWith('#');
  }

  private getCatchBlock(lines: string[], startIndex: number): string {
    let catchBlock = '';
    let braceCount = 0;
    let foundOpeningBrace = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      catchBlock += line + '\n';

      // Count braces to find the end of catch block
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundOpeningBrace = true;
        } else if (char === '}') {
          braceCount--;
          if (foundOpeningBrace && braceCount === 0) {
            return catchBlock;
          }
        }
      }
    }

    return catchBlock;
  }

  private hasErrorLogging(catchBlock: string): boolean {
    const loggingPatterns = [
      'logger.error',
      'console.error',
      'console.log',
      'log.error',
      'winston.error',
      'pino.error',
      'debug',
      'trace'
    ];

    // Check if it's a proper error handling (returning error to client)
    const properErrorHandling = [
      'return',
      'throw',
      'response',
      'res.status',
      'isError: true',
      'error:',
      'message:'
    ];

    // If it has logging patterns, it's good
    if (loggingPatterns.some(pattern => 
      catchBlock.toLowerCase().includes(pattern.toLowerCase())
    )) {
      return true;
    }

    // If it's returning error to client (like MCP server), it's also good
    if (properErrorHandling.some(pattern => 
      catchBlock.toLowerCase().includes(pattern.toLowerCase())
    )) {
      return true;
    }

    return false;
  }

  private isTodoCheckLogic(content: string, line: string): boolean {
    // Check if this line is part of TODO/FIXME checking logic
    const todoCheckPatterns = [
      'TODO',
      'FIXME',
      'HACK',
      'XXX',
      'checkTodoComments',
      'checkCommonIssues',
      'FORBIDDEN_PATTERNS',
      'comments:',
      'line.includes(',
      'violations.push',
      'message: \'TODO/FIXME comment found\'',
      'rule: \'no-todo\''
    ];
    
    // If the line contains TODO/FIXME but also contains logic patterns, it's likely part of checking logic
    const hasLogicPatterns = todoCheckPatterns.some(pattern => 
      line.includes(pattern) && (
        line.includes('includes(') || 
        line.includes('push(') || 
        line.includes('message:') ||
        line.includes('rule:') ||
        line.includes('[') ||
        line.includes(']')
      )
    );
    
    return hasLogicPatterns;
  }

  private async checkMultiProjectIssues(projectPath: string, subProjects: any[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check for duplicate dependencies across sub-projects
    const allDeps = new Map<string, string[]>();

    for (const subProject of subProjects) {
      const packageJsonPath = path.join(projectPath, subProject.path, 'package.json');
      if (await FileUtils.fileExists(packageJsonPath)) {
        const packageJson = await FileUtils.readJsonFile(packageJsonPath);
        if (packageJson) {
        const deps = Object.keys(packageJson.dependencies || {});

        deps.forEach(dep => {
          if (!allDeps.has(dep)) {
            allDeps.set(dep, []);
          }
          allDeps.get(dep)!.push(subProject.path);
        });
        }
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
    const ignorePatterns = this.IGNORE_PATTERNS;
    const allFiles = await glob('**/*.{js,ts,jsx,tsx,java,cs}', {
      cwd: projectPath,
      ignore: ignorePatterns
    });

    let totalLines = 0;
    let totalFiles = allFiles.length;

    for (const file of allFiles.slice(0, 100)) { // Sample for performance
      const content = await FileUtils.readFile(path.join(projectPath, file));
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

  public async getRecommendations(projectPath: string, projectInfo: ProjectInfo): Promise<any> {
    const report = await this.analyzeQuality(projectPath, projectInfo);

    return {
      score: report.score,
      projectTypes: projectInfo.types,
      recommendations: report.recommendations,
      topIssues: report.issues.slice(0, 5)
    };
  }


}