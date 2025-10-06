import { LimitsService } from '../services/LimitsService.js';
import { ValidationService } from '../services/ValidationService.js';
import { StructureService } from '../services/StructureService.js';
import { PATH_ALIASES, ADVANCED_COMPONENT_STRUCTURE } from '../constants/QualityConstants.js';

export class QualityRules {
  private limitsService: LimitsService;
  private validationService: ValidationService;
  private structureService: StructureService;

  constructor() {
    this.limitsService = new LimitsService();
    this.validationService = new ValidationService();
    this.structureService = new StructureService();
  }

  public getReactLimits(variant: string = 'react') {
    return this.limitsService.getReactLimits(variant);
  }

  public getFirebaseLimits() {
    return this.limitsService.getFirebaseLimits();
  }

  public getServerLimits(framework: string = 'nodejs') {
    return this.limitsService.getServerLimits(framework);
  }

  public getJavaLimits() {
    return this.limitsService.getJavaLimits();
  }

  public getDotNetLimits() {
    return this.limitsService.getDotNetLimits();
  }

  public getAngularLimits() {
    return this.limitsService.getAngularLimits();
  }

  public getAdvancedComponentStructure() {
    return ADVANCED_COMPONENT_STRUCTURE;
  }

  public getPathAliases() {
    return PATH_ALIASES;
  }

  public getQualityLevel(score: number): string {
    return this.validationService.getQualityLevel(score);
  }

  public validateComponentStructure(files: string[]): string[] {
    return this.validationService.validateComponentStructure(files);
  }

  public isDeepImport(importPath: string): boolean {
    return this.validationService.isDeepImport(importPath);
  }

  public hasConsoleLog(content: string): boolean {
    return this.validationService.hasConsoleLog(content);
  }

  public hasTodoComments(content: string): boolean {
    return this.validationService.hasTodoComments(content);
  }

  public hasDebugCode(content: string): boolean {
    return this.validationService.hasDebugCode(content);
  }

  public hasHardcodedValues(content: string): boolean {
    return this.validationService.hasHardcodedValues(content);
  }

  public getRecommendedStructure(projectType: string): any {
    return this.structureService.getRecommendedStructure(projectType);
  }
}