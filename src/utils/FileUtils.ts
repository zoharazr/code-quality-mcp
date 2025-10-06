import * as fs from 'fs/promises';
import * as path from 'path';

export class FileUtils {
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
