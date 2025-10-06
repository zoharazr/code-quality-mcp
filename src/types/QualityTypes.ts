export interface QualityReport {
  projectPath: string;
  projectTypes: string[];
  score: number;
  issues: QualityIssue[];
  recommendations: string[];
  stats: QualityStats;
  analysisType?: 'fast' | 'deep';
  aiInsights?: string[];
}

export interface AnalysisOptions {
  deepAnalysis?: boolean;
  aiEnabled?: boolean;
  checkUnusedCode?: boolean;
  checkComplexity?: boolean;
  checkSecurity?: boolean;
}

export interface QualityIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  file?: string;
  line?: number;
  message: string;
  rule: string;
}

export interface QualityStats {
  totalFiles: number;
  totalLines: number;
  averageFileSize: number;
  duplicateCode: number;
  unusedCode: number;
  complexity: number;
}

export interface ProjectInfo {
  types: string[];
  isMultiProject: boolean;
  subProjects?: SubProjectInfo[];
  mainFramework?: string;
}

export interface SubProjectInfo {
  path: string;
  type: string;
  dependencies?: string[];
}

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
