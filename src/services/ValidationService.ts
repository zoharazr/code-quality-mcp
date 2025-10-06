import { ADVANCED_COMPONENT_STRUCTURE, FORBIDDEN_PATTERNS } from '../constants/QualityConstants.js';

export class ValidationService {
  public validateComponentStructure(files: string[]): string[] {
    const violations: string[] = [];
    const requiredFiles = ADVANCED_COMPONENT_STRUCTURE.files;

    for (const required of requiredFiles) {
      if (!files.some(f => f.endsWith(required))) {
        violations.push(`Missing required file: ${required}`);
      }
    }

    return violations;
  }

  public isDeepImport(importPath: string): boolean {
    return FORBIDDEN_PATTERNS.imports.some(pattern => importPath.includes(pattern));
  }

  public hasConsoleLog(content: string): boolean {
    return FORBIDDEN_PATTERNS.console.some(pattern => content.includes(pattern));
  }

  public hasTodoComments(content: string): boolean {
    return FORBIDDEN_PATTERNS.comments.some(pattern => content.includes(pattern));
  }

  public hasDebugCode(content: string): boolean {
    return FORBIDDEN_PATTERNS.debugCode.some(pattern => content.includes(pattern));
  }

  public hasHardcodedValues(content: string): boolean {
    return FORBIDDEN_PATTERNS.hardcodedValues.some(pattern => content.includes(pattern));
  }

  public getQualityLevel(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'needs improvement';
    return 'poor';
  }
}
