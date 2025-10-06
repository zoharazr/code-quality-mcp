import { FileLimits, ReactLimits, FirebaseLimits } from '../types/QualityTypes.js';

export class LimitsService {
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
}
