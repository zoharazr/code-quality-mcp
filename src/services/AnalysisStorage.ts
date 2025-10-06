import { QualityIssue, QualityReport } from '../types/QualityTypes.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface SmartSummary {
  score: number;
  totalIssues: number;
  criticalCount: number;
  estimatedFixTime: string;
  topProblems: ProblemCategory[];
  topFiles: FileHotspot[];
}

interface ProblemCategory {
  category: string;
  count: number;
  percentage: number;
}

interface FileHotspot {
  file: string;
  issueCount: number;
  severity: string;
}

interface QuickWin {
  title: string;
  description: string;
  effort: string;
  impact: string;
  scoreGain: number;
  filesAffected: number;
}

interface TrendData {
  previousScore?: number;
  currentScore: number;
  scoreChange?: number;
  previousIssueCount?: number;
  currentIssueCount: number;
  issueChange?: number;
  improvingAreas: CategoryTrend[];
  degradingAreas: CategoryTrend[];
  timestamp: Date;
}

interface CategoryTrend {
  category: string;
  before: number;
  after: number;
  change: number;
}

export class AnalysisStorage {
  private storageDir: string;

  constructor() {
    this.storageDir = path.join(process.cwd(), '.code-quality-cache');
    this.ensureStorageDir();
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private getProjectHash(projectPath: string): string {
    return crypto.createHash('md5').update(projectPath).digest('hex').substring(0, 8);
  }

  public async saveAnalysis(projectPath: string, report: QualityReport): Promise<void> {
    const hash = this.getProjectHash(projectPath);
    const filename = `analysis_${hash}.json`;
    const filepath = path.join(this.storageDir, filename);

    const data = {
      projectPath,
      timestamp: new Date().toISOString(),
      report
    };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }

  public async getLatestAnalysis(projectPath: string): Promise<QualityReport | null> {
    const hash = this.getProjectHash(projectPath);
    const filename = `analysis_${hash}.json`;
    const filepath = path.join(this.storageDir, filename);

    if (!fs.existsSync(filepath)) {
      return null;
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(content);
    return data.report;
  }

  public generateSmartSummary(report: QualityReport): SmartSummary {
    // Group issues by category
    const categoryMap = new Map<string, number>();
    report.issues.forEach((issue: QualityIssue) => {
      const count = categoryMap.get(issue.category) || 0;
      categoryMap.set(issue.category, count + 1);
    });

    // Top problems
    const topProblems: ProblemCategory[] = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / report.issues.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // File hotspots
    const fileMap = new Map<string, QualityIssue[]>();
    report.issues.forEach((issue: QualityIssue) => {
      if (issue.file) {
        const issues = fileMap.get(issue.file) || [];
        issues.push(issue);
        fileMap.set(issue.file, issues);
      }
    });

    const topFiles: FileHotspot[] = Array.from(fileMap.entries())
      .map(([file, issues]) => {
        const hasError = issues.some((i: QualityIssue) => i.severity === 'error');
        return {
          file: path.basename(file),
          issueCount: issues.length,
          severity: hasError ? 'critical' : 'warning'
        };
      })
      .sort((a, b) => b.issueCount - a.issueCount)
      .slice(0, 5);

    // Critical count
    const criticalCount = report.issues.filter((i: QualityIssue) => i.severity === 'error').length;

    // Estimate fix time
    const estimatedFixTime = this.estimateFixTime(report.issues);

    return {
      score: report.score,
      totalIssues: report.issues.length,
      criticalCount,
      estimatedFixTime,
      topProblems,
      topFiles
    };
  }

  public generateQuickWins(report: QualityReport): QuickWin[] {
    const wins: QuickWin[] = [];

    // Group issues by rule
    const ruleMap = new Map<string, QualityIssue[]>();
    report.issues.forEach((issue: QualityIssue) => {
      const issues = ruleMap.get(issue.rule) || [];
      issues.push(issue);
      ruleMap.set(issue.rule, issues);
    });

    // Find patterns with many instances
    ruleMap.forEach((issues, rule) => {
      if (issues.length >= 5) {
        const files = new Set(issues.map((i: QualityIssue) => i.file).filter(Boolean));

        if (rule === 'no-unused-vars') {
          wins.push({
            title: `Remove ${issues.length} unused variables`,
            description: `Clean up unused code across ${files.size} files`,
            effort: `${issues.length * 2} minutes`,
            impact: 'Medium',
            scoreGain: Math.min(15, issues.length),
            filesAffected: files.size
          });
        } else if (rule === 'no-console') {
          wins.push({
            title: `Remove ${issues.length} console statements`,
            description: `Replace with proper logging`,
            effort: `${issues.length} minutes`,
            impact: 'Low',
            scoreGain: Math.min(8, issues.length / 2),
            filesAffected: files.size
          });
        } else if (rule === 'no-hebrew-comments') {
          wins.push({
            title: `Translate ${issues.length} Hebrew comments`,
            description: `Improve code maintainability`,
            effort: `${issues.length * 3} minutes`,
            impact: 'Low',
            scoreGain: Math.min(5, issues.length / 3),
            filesAffected: files.size
          });
        } else if (rule === 'no-todo-comments') {
          wins.push({
            title: `Address ${issues.length} TODO comments`,
            description: `Complete pending tasks or create tickets`,
            effort: `${issues.length * 5} minutes`,
            impact: 'Medium',
            scoreGain: Math.min(10, issues.length / 2),
            filesAffected: files.size
          });
        }
      }
    });

    // Sort by ROI (score gain / effort)
    return wins
      .sort((a, b) => {
        const effortA = parseInt(a.effort);
        const effortB = parseInt(b.effort);
        return (b.scoreGain / effortB) - (a.scoreGain / effortA);
      })
      .slice(0, 5);
  }

  public async generateTrends(projectPath: string, currentReport: QualityReport): Promise<TrendData> {
    const previousReport = await this.getLatestAnalysis(projectPath);

    const trends: TrendData = {
      currentScore: currentReport.score,
      currentIssueCount: currentReport.issues.length,
      improvingAreas: [],
      degradingAreas: [],
      timestamp: new Date()
    };

    if (!previousReport) {
      return trends;
    }

    trends.previousScore = previousReport.score;
    trends.scoreChange = currentReport.score - previousReport.score;
    trends.previousIssueCount = previousReport.issues.length;
    trends.issueChange = currentReport.issues.length - previousReport.issues.length;

    // Compare by category
    const prevCategories = this.countByCategory(previousReport.issues);
    const currCategories = this.countByCategory(currentReport.issues);

    // Find improvements
    prevCategories.forEach((prevCount, category) => {
      const currCount = currCategories.get(category) || 0;
      if (currCount < prevCount) {
        trends.improvingAreas.push({
          category,
          before: prevCount,
          after: currCount,
          change: currCount - prevCount
        });
      }
    });

    // Find degradations
    currCategories.forEach((currCount, category) => {
      const prevCount = prevCategories.get(category) || 0;
      if (currCount > prevCount) {
        trends.degradingAreas.push({
          category,
          before: prevCount,
          after: currCount,
          change: currCount - prevCount
        });
      }
    });

    return trends;
  }

  private countByCategory(issues: QualityIssue[]): Map<string, number> {
    const map = new Map<string, number>();
    issues.forEach((issue: QualityIssue) => {
      map.set(issue.category, (map.get(issue.category) || 0) + 1);
    });
    return map;
  }

  private estimateFixTime(issues: QualityIssue[]): string {
    const timePerSeverity: Record<string, number> = {
      'error': 15,
      'warning': 5,
      'info': 2
    };

    let totalMinutes = 0;
    issues.forEach((issue: QualityIssue) => {
      totalMinutes += timePerSeverity[issue.severity] || 5;
    });

    if (totalMinutes < 60) return `${totalMinutes} minutes`;
    if (totalMinutes < 480) return `${Math.round(totalMinutes / 60)} hours`;
    return `${Math.round(totalMinutes / 480)} days`;
  }

  public formatSmartSummary(summary: SmartSummary): string {
    let output = '📊 Code Quality Summary\n';
    output += '='.repeat(50) + '\n\n';
    output += `🎯 Score: ${summary.score}/100\n`;
    output += `📈 Total Issues: ${summary.totalIssues}\n`;
    output += `🔴 Critical: ${summary.criticalCount}\n`;
    output += `⏱️  Estimated Fix Time: ${summary.estimatedFixTime}\n\n`;

    if (summary.topProblems.length > 0) {
      output += '🔥 Top Problem Categories:\n';
      summary.topProblems.forEach((p: ProblemCategory) => {
        output += `  • ${p.category}: ${p.count} (${p.percentage}%)\n`;
      });
      output += '\n';
    }

    if (summary.topFiles.length > 0) {
      output += '📁 Files Needing Attention:\n';
      summary.topFiles.forEach((f: FileHotspot) => {
        const icon = f.severity === 'critical' ? '🔴' : '🟡';
        output += `  ${icon} ${f.file} - ${f.issueCount} issues\n`;
      });
    }

    return output;
  }

  public formatQuickWins(wins: QuickWin[]): string {
    let output = '⚡ Quick Wins - High Impact, Low Effort\n';
    output += '='.repeat(50) + '\n\n';

    if (wins.length === 0) {
      return output + 'Great job! No quick wins available - focus on the remaining issues.\n';
    }

    let totalTime = 0;
    let totalGain = 0;

    wins.forEach((win: QuickWin, index: number) => {
      output += `${index + 1}. ${win.title}\n`;
      output += `   ${win.description}\n`;
      output += `   ⏱️  Effort: ${win.effort} | 📈 Score: +${win.scoreGain} points | 📁 Files: ${win.filesAffected}\n\n`;

      totalTime += parseInt(win.effort);
      totalGain += win.scoreGain;
    });

    output += `💡 Total: ${totalTime} minutes → +${totalGain} points!\n`;

    return output;
  }

  public formatTrends(trends: TrendData): string {
    let output = '📈 Project Trends\n';
    output += '='.repeat(50) + '\n\n';

    if (trends.previousScore !== undefined) {
      const scoreEmoji = (trends.scoreChange || 0) > 0 ? '✅' : '❌';
      output += `${scoreEmoji} Score: ${trends.previousScore} → ${trends.currentScore} `;
      output += `(${trends.scoreChange! > 0 ? '+' : ''}${trends.scoreChange})\n`;
    } else {
      output += `🎯 Current Score: ${trends.currentScore}\n`;
    }

    if (trends.previousIssueCount !== undefined) {
      const issueEmoji = (trends.issueChange || 0) < 0 ? '✅' : '❌';
      output += `${issueEmoji} Issues: ${trends.previousIssueCount} → ${trends.currentIssueCount} `;
      output += `(${trends.issueChange! > 0 ? '+' : ''}${trends.issueChange})\n\n`;
    }

    if (trends.improvingAreas.length > 0) {
      output += '✅ Improving Areas:\n';
      trends.improvingAreas.forEach((area: CategoryTrend) => {
        output += `  • ${area.category}: ${area.before} → ${area.after} (${area.change})\n`;
      });
      output += '\n';
    }

    if (trends.degradingAreas.length > 0) {
      output += '❌ Areas Needing Attention:\n';
      trends.degradingAreas.forEach((area: CategoryTrend) => {
        output += `  • ${area.category}: ${area.before} → ${area.after} (+${area.change})\n`;
      });
    }

    if (trends.improvingAreas.length === 0 && trends.degradingAreas.length === 0 && !trends.previousScore) {
      output += '\n📊 First analysis - no trends available yet.\n';
      output += 'Run another analysis later to see your progress!\n';
    }

    return output;
  }
}
