export class CodeAnalysisUtils {
  static findFunctions(content: string): Array<{ name: string; startLine: number; endLine: number }> {
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

  static checkLineLength(lines: string[], maxLength: number): Array<{ line: number; length: number }> {
    const violations: Array<{ line: number; length: number }> = [];
    
    lines.forEach((line, index) => {
      if (line.length > maxLength) {
        violations.push({
          line: index + 1,
          length: line.length
        });
      }
    });

    return violations;
  }

  static checkConsoleLogs(lines: string[]): Array<{ line: number; content: string }> {
    const violations: Array<{ line: number; content: string }> = [];
    
    lines.forEach((line, index) => {
      if (line.includes('console.log')) {
        violations.push({
          line: index + 1,
          content: line.trim()
        });
      }
    });

    return violations;
  }

  static checkDeepImports(lines: string[]): Array<{ line: number; import: string }> {
    const violations: Array<{ line: number; import: string }> = [];

    lines.forEach((line, index) => {
      // Check for deep relative imports (../../ or more)
      if (/from\s+['"](\.\.\/){2,}/.test(line)) {
        violations.push({
          line: index + 1,
          import: line.trim()
        });
      }
    });

    return violations;
  }

  static checkTodoComments(lines: string[]): Array<{ line: number; content: string }> {
    const violations: Array<{ line: number; content: string }> = [];
    
    lines.forEach((line, index) => {
      if (line.includes('TODO') || line.includes('FIXME')) {
        violations.push({
          line: index + 1,
          content: line.trim()
        });
      }
    });

    return violations;
  }

  static calculateComplexity(content: string): number {
    // Simple complexity calculation based on control flow statements
    const complexityKeywords = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?'
    ];

    let complexity = 1; // Base complexity

    complexityKeywords.forEach(keyword => {
      const keywordMatches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      if (keywordMatches) {
        complexity += keywordMatches.length;
      }
    });

    return complexity;
  }

  static countExports(content: string): number {
    const exportRegex = /export\s+(const|function|async\s+function|class|interface|type)\s+\w+/g;
    const matches = content.match(exportRegex);
    return matches ? matches.length : 0;
  }
}
