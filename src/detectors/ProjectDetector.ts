import * as path from 'path';
import { glob } from 'glob';
import { FileUtils } from '../utils/FileUtils.js';
import { ProjectInfo, SubProjectInfo } from '../types/QualityTypes.js';

export { ProjectInfo, SubProjectInfo };

export class ProjectDetector {

  public async detectProject(projectPath: string, deep: boolean = true): Promise<ProjectInfo> {
    const detectedTypes = new Set<string>();
    const subProjects: SubProjectInfo[] = [];

    // Check for package.json (Node.js based projects)
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await FileUtils.fileExists(packageJsonPath)) {
      const packageJson = await FileUtils.readJsonFile(packageJsonPath);
      if (packageJson) {
        await this.detectNodeProject(packageJson, detectedTypes);
      }
    }

    // Check for React Native
    if (await FileUtils.fileExists(path.join(projectPath, 'app.json')) ||
        await FileUtils.fileExists(path.join(projectPath, 'metro.config.js'))) {
      detectedTypes.add('react-native');
    }

    // Check for Java/Spring
    if (await FileUtils.fileExists(path.join(projectPath, 'pom.xml')) ||
        await FileUtils.fileExists(path.join(projectPath, 'build.gradle'))) {
      detectedTypes.add('java');
    }

    // Check for .NET Core
    const csprojFiles = await glob('**/*.csproj', { cwd: projectPath, ignore: ['node_modules/**'] });
    if (csprojFiles.length > 0) {
      detectedTypes.add('dotnet');
    }

    // Check for Angular
    if (await FileUtils.fileExists(path.join(projectPath, 'angular.json'))) {
      detectedTypes.add('angular');
    }

    // Check for Firebase Functions
    const functionsPath = path.join(projectPath, 'functions');
    if (await FileUtils.fileExists(functionsPath)) {
      const functionsPackageJson = await FileUtils.readJsonFile(path.join(functionsPath, 'package.json'));
      if (functionsPackageJson?.dependencies?.['firebase-functions']) {
        detectedTypes.add('firebase-functions');
        subProjects.push({
          path: 'functions',
          type: 'firebase-functions',
          dependencies: Object.keys(functionsPackageJson.dependencies || {})
        });
      }
    }

    // Check for AWS Amplify
    if (await FileUtils.fileExists(path.join(projectPath, 'amplify'))) {
      detectedTypes.add('aws-amplify');
    }

    // Deep scan for nested projects
    if (deep) {
      await this.detectNestedProjects(projectPath, subProjects);
    }

    // Determine main framework
    const mainFramework = this.determineMainFramework(Array.from(detectedTypes));

    return {
      types: Array.from(detectedTypes),
      isMultiProject: detectedTypes.size > 1 || subProjects.length > 0,
      subProjects: subProjects.length > 0 ? subProjects : undefined,
      mainFramework
    };
  }

  private async detectNodeProject(packageJson: any, detectedTypes: Set<string>): Promise<void> {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // React
    if (deps['react'] && !deps['react-native']) {
      detectedTypes.add('react');
    }

    // Next.js (Updated for 2025 - Next.js 14+)
    if (deps['next']) {
      detectedTypes.add('nextjs');
      // Check for App Router (Next.js 13+)
      if (packageJson.scripts?.dev?.includes('next dev') ||
          packageJson.scripts?.build?.includes('next build')) {
        detectedTypes.add('nextjs-app-router');
      }
    }

    // Nest.js (Enhanced detection for 2025)
    if (deps['@nestjs/core'] || deps['@nestjs/common']) {
      detectedTypes.add('nestjs');
      // Check for microservices
      if (deps['@nestjs/microservices']) {
        detectedTypes.add('nestjs-microservices');
      }
    }

    // Express/Fastify/Koa/Hapi
    if (deps['express'] || deps['fastify'] || deps['koa'] || deps['hapi']) {
      detectedTypes.add('nodejs');
    }

    // Basic Node.js project (if no specific framework detected but has Node.js dependencies)
    if (detectedTypes.size === 0 && (deps['@types/node'] || deps['typescript'] || deps['tsx'])) {
      detectedTypes.add('nodejs');
    }

    // Vue.js
    if (deps['vue'] || deps['nuxt']) {
      detectedTypes.add('vue');
    }

    // Svelte/SvelteKit
    if (deps['svelte'] || deps['@sveltejs/kit']) {
      detectedTypes.add('svelte');
    }

    // Remix
    if (deps['@remix-run/react'] || deps['@remix-run/node']) {
      detectedTypes.add('remix');
    }

    // Astro
    if (deps['astro']) {
      detectedTypes.add('astro');
    }
  }

  private async detectNestedProjects(projectPath: string, subProjects: SubProjectInfo[]): Promise<void> {
    const directories = ['client', 'server', 'frontend', 'backend', 'api', 'web', 'mobile', 'apps/*', 'packages/*'];

    for (const dir of directories) {
      const matches = await glob(dir, { cwd: projectPath });

      for (const match of matches) {
        const subPath = path.join(projectPath, match);
        const subPackageJson = await FileUtils.readJsonFile(path.join(subPath, 'package.json'));

        if (subPackageJson) {
          const subTypes = new Set<string>();
          await this.detectNodeProject(subPackageJson, subTypes);

          if (subTypes.size > 0) {
            subProjects.push({
              path: match,
              type: Array.from(subTypes)[0],
              dependencies: Object.keys(subPackageJson.dependencies || {})
            });
          }
        }
      }
    }
  }

  private determineMainFramework(types: string[]): string | undefined {
    // Priority order for main framework (Updated for 2025)
    const priority = [
      'nextjs-app-router',  // Next.js 14+ with App Router
      'nextjs',
      'nestjs-microservices',  // Nest.js with microservices
      'nestjs',
      'remix',
      'react-native',
      'angular',
      'vue',
      'svelte',
      'astro',
      'react',
      'nodejs',
      'dotnet',
      'java',
      'firebase-functions',
      'aws-amplify'
    ];

    for (const framework of priority) {
      if (types.includes(framework)) {
        return framework;
      }
    }

    return types[0];
  }
}