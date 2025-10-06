import * as fs from 'fs/promises';
import * as path from 'path';

export class FileUtils {
  // Folders to always ignore
  static readonly IGNORE_PATTERNS = [
    'node_modules',
    '.git',
    '.next',
    '.nuxt',
    'dist',
    'build',
    'coverage',
    '.cache',
    '.temp',
    '.tmp',
    'tmp',
    '.vscode',
    '.idea',
    '__pycache__',
    '.pytest_cache',
    'vendor',
    'Pods',
    '.DS_Store'
  ];

  // React Native specific - native code that shouldn't be scanned
  static readonly REACT_NATIVE_IGNORE = [
    'android/app/build',
    'android/gradle',
    'android/gradlew',
    'android/gradlew.bat',
    'ios/Pods',
    'ios/build',
    'ios/*.xcworkspace',
    'ios/*.xcodeproj/xcuserdata',
    'ios/*.xcodeproj/project.xcworkspace'
  ];

  // Next.js specific
  static readonly NEXTJS_IGNORE = [
    '.next',
    'out',
    '.vercel'
  ];

  // General build/generated folders
  static readonly BUILD_IGNORE = [
    'dist',
    'build',
    'out',
    'target',
    'bin',
    'obj',
    '.output'
  ];

  static shouldIgnorePath(filePath: string, projectType?: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const pathParts = normalizedPath.split('/');

    // Check general ignore patterns
    for (const pattern of FileUtils.IGNORE_PATTERNS) {
      if (pathParts.includes(pattern)) {
        return true;
      }
    }

    // Check build folders
    for (const pattern of FileUtils.BUILD_IGNORE) {
      if (pathParts.includes(pattern)) {
        return true;
      }
    }

    // Project-specific ignores
    if (projectType === 'react-native') {
      // Allow only src/, app/, components/, screens/, etc. in android/ios
      if (normalizedPath.includes('android/') || normalizedPath.includes('ios/')) {
        // Skip if it's in gradle, build, Pods, etc.
        if (
          normalizedPath.includes('/build') ||
          normalizedPath.includes('/gradle') ||
          normalizedPath.includes('/Pods') ||
          normalizedPath.includes('.xcworkspace') ||
          normalizedPath.includes('xcuserdata') ||
          normalizedPath.includes('DerivedData')
        ) {
          return true;
        }

        // Only allow custom Java/Kotlin/Swift code we wrote
        const allowedExtensions = ['.java', '.kt', '.swift', '.m', '.h'];
        const ext = path.extname(normalizedPath);

        // If it's in MainActivity, AppDelegate, or custom modules - allow
        if (
          normalizedPath.includes('MainActivity') ||
          normalizedPath.includes('AppDelegate') ||
          normalizedPath.includes('modules/')
        ) {
          return false; // Don't ignore - this is custom code
        }

        // Everything else in android/ios - ignore
        return true;
      }
    }

    if (projectType === 'nextjs') {
      for (const pattern of FileUtils.NEXTJS_IGNORE) {
        if (pathParts.includes(pattern)) {
          return true;
        }
      }
    }

    return false;
  }

  static async getAllFiles(dirPath: string, projectType?: string): Promise<string[]> {
    const files: string[] = [];

    async function traverse(currentPath: string) {
      // Check if should ignore this path
      if (FileUtils.shouldIgnorePath(currentPath, projectType)) {
        return;
      }

      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (FileUtils.shouldIgnorePath(fullPath, projectType)) {
          continue;
        }

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (entry.isFile()) {
          // Only include source code files
          const ext = path.extname(entry.name);
          const sourceExtensions = [
            '.js', '.jsx', '.ts', '.tsx',
            '.java', '.kt', '.swift', '.m', '.h',
            '.py', '.rb', '.go', '.rs',
            '.vue', '.svelte'
          ];

          if (sourceExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }

    await traverse(dirPath);
    return files;
  }
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return '';
    }
  }

  static async readJsonFile(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  static getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  static getFileName(filePath: string): string {
    return path.basename(filePath);
  }

  static getDirectoryName(filePath: string): string {
    return path.dirname(filePath);
  }

  static joinPaths(...paths: string[]): string {
    return path.join(...paths);
  }

  static isDirectory(filePath: string): boolean {
    return path.extname(filePath) === '';
  }
}
