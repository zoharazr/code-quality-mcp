export interface FileLimits {
  maxLines: number;
  maxComplexity: number;
  maxParameters: number;
  maxLineLength?: number;
  maxMethodsPerClass?: number;
}

export interface ReactLimits extends FileLimits {
  componentMaxLines: number;
  maxFunctionLines?: number;
}

export interface FirebaseLimits {
  maxFunctionsPerFile: number;
  maxLinesPerFunction: number;
  maxLinesPerFile: number;
  maxComplexity: number;
  maxParameters: number;
}

export class QualityRules {
  // Client-side limits (React/React Native) - Updated for 2025
  private clientLimits: ReactLimits = {
    maxLines: 300,           // Updated from 200 to 300 based on 2025 standards
    maxComplexity: 10,
    maxParameters: 4,
    componentMaxLines: 200,  // Updated from 100 to 200 for modern React
    maxFunctionLines: 30,    // New: max lines per function
    maxLineLength: 120       // New: max characters per line
  };

  // Firebase Functions specific limits - Updated for 2025
  private firebaseLimits: FirebaseLimits = {
    maxFunctionsPerFile: 5,
    maxLinesPerFunction: 50,  // Updated from 100 to 50 for better maintainability
    maxLinesPerFile: 300,
    maxComplexity: 10,
    maxParameters: 4
  };

  // Server-side limits (Node.js, Next.js, Nest.js) - Updated for 2025
  private serverLimits: FileLimits = {
    maxLines: 500,           // Updated from 300 to 500 based on 2025 standards
    maxComplexity: 15,
    maxParameters: 5,
    maxLineLength: 120,      // New: max characters per line
    maxMethodsPerClass: 30   // New: max methods per class
  };

  // Advanced component structure (AuthModal pattern)
  private advancedComponentStructure = {
    files: ['index.tsx', 'types.ts', 'styles.ts', 'const.ts'],
    folders: ['hooks/', 'components/', 'services/', 'handlers/'],
    limits: {
      'index.tsx': 100,
      'hooks/': 50,
      'services/': 100,
      'handlers/': 30,
      'components/': 80
    }
  };

  // Path aliases configuration
  private pathAliases = {
    '@/': 'src/',
    '@/assets/': 'assets/',
    '@/components/': 'src/components/',
    '@/screens/': 'src/screens/',
    '@/services/': 'src/services/',
    '@/utils/': 'src/utils/',
    '@/constants/': 'src/constants/',
    '@/types/': 'src/types/',
    '@/hooks/': 'src/hooks/',
    '@/data/': 'src/data/',
    '@/locales/': 'src/locales/'
  };

  // Forbidden patterns
  private forbiddenPatterns = {
    console: ['console.log', 'console.debug', 'console.warn'],
    imports: ['../../', '../../../'],
    comments: ['TODO', 'FIXME', 'HACK', 'XXX'],
    debugCode: ['debugger', 'alert('],
    hardcodedValues: ['localhost:', '127.0.0.1', 'password:', 'secret:']
  };

  // Quality thresholds
  private qualityThresholds = {
    excellent: 90,
    good: 75,
    acceptable: 60,
    poor: 40
  };

  public getReactLimits(variant: string = 'react'): ReactLimits {
    // React Native might have slightly different limits
    if (variant === 'react-native') {
      return {
        ...this.clientLimits,
        maxLines: 250 // Slightly more lenient for React Native
      };
    }
    return this.clientLimits;
  }

  public getFirebaseLimits(): FirebaseLimits {
    return this.firebaseLimits;
  }

  public getServerLimits(framework: string = 'nodejs'): FileLimits {
    // Different frameworks might have different limits
    switch (framework) {
      case 'nextjs':
        return {
          ...this.serverLimits,
          maxLines: 250 // API routes should be shorter
        };
      case 'nest':
        return {
          ...this.serverLimits,
          maxLines: 350 // NestJS decorators add lines
        };
      default:
        return this.serverLimits;
    }
  }

  public getJavaLimits(): FileLimits {
    return {
      maxLines: 1000,          // Updated based on 2025 standards (500-1000)
      maxComplexity: 15,       // Reduced from 20 for better maintainability
      maxParameters: 6,
      maxLineLength: 100,      // Google Java standard
      maxMethodsPerClass: 30   // Rule of 30
    };
  }

  public getDotNetLimits(): FileLimits {
    return {
      maxLines: 500,           // Updated from 400 to 500 based on 2025 standards
      maxComplexity: 15,
      maxParameters: 5,
      maxLineLength: 120,      // C# standard for 2025
      maxMethodsPerClass: 30   // Clean Architecture recommendation
    };
  }

  public getAngularLimits(): FileLimits {
    return {
      maxLines: 350,           // Updated from 250 to 350 based on 2025 standards
      maxComplexity: 12,
      maxParameters: 4,
      maxLineLength: 120,      // ESLint standard for Angular
      maxMethodsPerClass: 20   // Component methods limit
    };
  }

  public getAdvancedComponentStructure() {
    return this.advancedComponentStructure;
  }

  public getPathAliases() {
    return this.pathAliases;
  }

  public getForbiddenPatterns() {
    return this.forbiddenPatterns;
  }

  public getQualityLevel(score: number): string {
    if (score >= this.qualityThresholds.excellent) return 'מצוין';
    if (score >= this.qualityThresholds.good) return 'טוב';
    if (score >= this.qualityThresholds.acceptable) return 'סביר';
    if (score >= this.qualityThresholds.poor) return 'דורש שיפור';
    return 'גרוע';
  }

  public validateComponentStructure(files: string[]): string[] {
    const violations: string[] = [];
    const requiredFiles = this.advancedComponentStructure.files;

    for (const required of requiredFiles) {
      if (!files.some(f => f.endsWith(required))) {
        violations.push(`Missing required file: ${required}`);
      }
    }

    return violations;
  }

  public isDeepImport(importPath: string): boolean {
    return this.forbiddenPatterns.imports.some(pattern => importPath.includes(pattern));
  }

  public hasConsoleLog(content: string): boolean {
    return this.forbiddenPatterns.console.some(pattern => content.includes(pattern));
  }

  public hasTodoComments(content: string): boolean {
    return this.forbiddenPatterns.comments.some(pattern => content.includes(pattern));
  }

  public hasDebugCode(content: string): boolean {
    return this.forbiddenPatterns.debugCode.some(pattern => content.includes(pattern));
  }

  public hasHardcodedValues(content: string): boolean {
    return this.forbiddenPatterns.hardcodedValues.some(pattern => content.includes(pattern));
  }

  public getRecommendedStructure(projectType: string): any {
    switch (projectType) {
      case 'firebase-functions':
        return {
          structure: `
functions/src/
├── constants/
│   ├── index.ts
│   └── security.ts
├── function/
│   ├── index.ts
│   └── securityUtils.ts
├── functions/
│   ├── example/
│   │   ├── create.ts
│   │   ├── join.ts
│   │   └── update.ts
│   ├── members/
│   │   ├── approve.ts
│   │   └── regenerate.ts
│   └── index.ts
└── index.ts`,
          rules: this.firebaseLimits
        };

      case 'react':
      case 'react-native':
        return {
          structure: `
src/
├── components/
│   └── ComponentName/
│       ├── index.tsx
│       ├── types.ts
│       ├── styles.ts
│       ├── const.ts
│       ├── hooks/
│       ├── components/
│       └── handlers/
├── screens/
├── services/
├── utils/
├── constants/
└── types/`,
          rules: this.getReactLimits(projectType)
        };

      default:
        return null;
    }
  }
}