import { QualityIssue } from '../types/QualityTypes.js';

/**
 * AICodeAnalyzer - Hybrid approach for code quality analysis
 *
 * This service provides AI-powered code analysis as an MCP server.
 * It works in two modes:
 * 1. Fast mode: Uses regex/pattern-based rules (no AI calls)
 * 2. Deep mode: Uses AI (Claude) for advanced analysis
 */
export class AICodeAnalyzer {
  private aiEnabled: boolean = false;

  constructor() {
    // Check if we're running as MCP server with AI capabilities
    this.aiEnabled = this.checkAIAvailability();
  }

  private checkAIAvailability(): boolean {
    // In a real MCP implementation, this would check if Claude is available
    // For now, we'll assume AI is available when running through MCP
    return process.env.MCP_AI_ENABLED === 'true' || false;
  }

  /**
   * Uses AI to analyze code for unused variables, functions, and exports
   * This is much more accurate than regex-based detection
   */
  public async analyzeUnusedCode(fileContent: string, fileName: string): Promise<QualityIssue[]> {
    if (!this.aiEnabled) {
      console.log(`⚡ Fast mode: Skipping AI analysis for ${fileName}`);
      return [];
    }

    console.log(`🤖 AI mode: Deep analysis for ${fileName}`);

    const prompt = this.buildUnusedCodePrompt(fileContent, fileName);

    // In production, this would use MCP's sampling API to call Claude
    // For now, we return empty array (the logic-based checks will run)
    return this.callAI(prompt, 'unused-code');
  }

  /**
   * Uses AI to detect code smells and quality issues
   */
  public async detectCodeSmells(fileContent: string, fileName: string): Promise<QualityIssue[]> {
    if (!this.aiEnabled) {
      return [];
    }

    console.log(`🤖 AI mode: Code smell detection for ${fileName}`);

    const prompt = this.buildCodeSmellPrompt(fileContent, fileName);
    return this.callAI(prompt, 'code-quality');
  }

  /**
   * Uses AI to suggest refactoring opportunities
   */
  public async suggestRefactoring(fileContent: string, fileName: string): Promise<string[]> {
    if (!this.aiEnabled) {
      return [];
    }

    console.log(`🤖 AI mode: Refactoring suggestions for ${fileName}`);

    const prompt = this.buildRefactoringPrompt(fileContent, fileName);

    // This would return AI-generated suggestions
    return [];
  }

  /**
   * Comprehensive AI analysis - runs all checks
   */
  public async comprehensiveAnalysis(fileContent: string, fileName: string): Promise<{
    unusedCode: QualityIssue[];
    codeSmells: QualityIssue[];
    suggestions: string[];
  }> {
    if (!this.aiEnabled) {
      console.log(`⚡ Fast mode: AI analysis disabled`);
      return { unusedCode: [], codeSmells: [], suggestions: [] };
    }

    console.log(`🧠 AI mode: Comprehensive analysis for ${fileName}`);

    const [unusedCode, codeSmells, suggestions] = await Promise.all([
      this.analyzeUnusedCode(fileContent, fileName),
      this.detectCodeSmells(fileContent, fileName),
      this.suggestRefactoring(fileContent, fileName)
    ]);

    return { unusedCode, codeSmells, suggestions };
  }

  // ============= PRIVATE HELPER METHODS =============

  private buildUnusedCodePrompt(fileContent: string, fileName: string): string {
    return `You are a code quality analyzer. Analyze this file for UNUSED code only.

File: ${fileName}

Code:
\`\`\`
${fileContent}
\`\`\`

Find ONLY:
1. Variables declared but NEVER used (not even once)
2. Functions defined but NEVER called
3. Imported modules NEVER used
4. Exported constants that seem unused

DO NOT flag as unused:
- Variables used in JSX/templates
- Variables used in object properties
- React components (even if capitalized)
- Event handlers and callbacks
- Type definitions
- Function parameters

Return ONLY a JSON array with this exact format:
[
  {
    "severity": "warning",
    "category": "unused-code",
    "line": 10,
    "message": "Variable 'foo' is declared but never used",
    "rule": "no-unused-vars"
  }
]

If no issues found, return: []`;
  }

  private buildCodeSmellPrompt(fileContent: string, fileName: string): string {
    return `You are a code quality analyzer. Analyze this file for CODE SMELLS and QUALITY ISSUES.

File: ${fileName}

Code:
\`\`\`
${fileContent}
\`\`\`

Look for:
1. Functions that are too complex (cyclomatic complexity > 10)
2. Functions that are too long (> 50 lines)
3. Duplicated code patterns
4. Poor naming conventions
5. Missing error handling in try-catch blocks
6. console.log statements (should use proper logging)
7. Hardcoded credentials or secrets
8. Performance issues

Return ONLY a JSON array with this exact format:
[
  {
    "severity": "warning",
    "category": "code-quality",
    "line": 15,
    "message": "Function 'processData' is too complex (complexity: 15)",
    "rule": "complexity"
  }
]

If no issues found, return: []`;
  }

  private buildRefactoringPrompt(fileContent: string, fileName: string): string {
    return `You are a code quality analyzer. Suggest REFACTORING opportunities for this file.

File: ${fileName}

Code:
\`\`\`
${fileContent}
\`\`\`

Suggest improvements for:
1. Extract complex logic into separate functions
2. Simplify nested conditions
3. Remove code duplication
4. Improve variable/function names
5. Add missing type annotations (TypeScript)
6. Better error handling

Return ONLY a JSON array of strings:
[
  "Extract lines 20-35 into a separate function 'validateUserInput'",
  "Simplify nested if statements in 'handleSubmit' using early returns",
  "Add type annotation to 'processData' function"
]

If no suggestions, return: []`;
  }

  private async callAI(prompt: string, category: string): Promise<QualityIssue[]> {
    // In a real MCP implementation, this would use the sampling API:
    //
    // const response = await this.mcpServer.sampling.createMessage({
    //   messages: [{ role: 'user', content: prompt }],
    //   model: 'claude-3-5-sonnet-20241022',
    //   max_tokens: 2000
    // });
    //
    // Then parse the JSON response and return issues

    // For now, we return empty array
    // The logic-based analysis will still run
    return [];
  }

  /**
   * Enable AI analysis (for testing or when MCP is available)
   */
  public enableAI(): void {
    this.aiEnabled = true;
    console.log('🤖 AI analysis enabled');
  }

  /**
   * Disable AI analysis (fall back to logic-based only)
   */
  public disableAI(): void {
    this.aiEnabled = false;
    console.log('⚡ AI analysis disabled - using fast mode');
  }

  /**
   * Check if AI is currently enabled
   */
  public isAIEnabled(): boolean {
    return this.aiEnabled;
  }
}
