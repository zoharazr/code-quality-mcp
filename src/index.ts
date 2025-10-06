#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ProjectDetector } from './detectors/ProjectDetector.js';
import { QualityAnalyzer } from './analyzers/QualityAnalyzer.js';
import { AnalysisStorage } from './services/AnalysisStorage.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'code-quality-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools: Tool[] = [
  {
    name: 'analyze_project',
    description: 'Analyze project type and code quality',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project to analyze',
        },
        deep: {
          type: 'boolean',
          description: 'Perform deep analysis including nested projects',
          default: true,
        }
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'check_quality',
    description: 'Check code quality based on project type. Supports both fast (logic-based) and deep (AI-powered) analysis modes.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project',
        },
        projectType: {
          type: 'string',
          description: 'Override detected project type',
          enum: ['react', 'react-native', 'java', 'nodejs', 'nextjs', 'nest', 'dotnet', 'angular', 'firebase', 'aws-amplify'],
        },
        deepAnalysis: {
          type: 'boolean',
          description: 'Enable AI-powered deep analysis (slower but more accurate). Default: false',
          default: false,
        },
        aiEnabled: {
          type: 'boolean',
          description: 'Enable AI analysis (alternative to deepAnalysis). Default: false',
          default: false,
        },
        checkUnusedCode: {
          type: 'boolean',
          description: 'Check for unused code. Default: true',
          default: true,
        },
        checkComplexity: {
          type: 'boolean',
          description: 'Check code complexity (requires deep analysis). Default: false',
          default: false,
        },
        checkSecurity: {
          type: 'boolean',
          description: 'Check for security issues (requires deep analysis). Default: false',
          default: false,
        },
        page: {
          type: 'number',
          description: 'Page number for paginated results. Default: 1',
          default: 1,
        },
        pageSize: {
          type: 'number',
          description: 'Number of issues per page. Default: 50, Max: 100',
          default: 50,
        }
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'get_recommendations',
    description: 'Get code quality recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project',
        },
        language: {
          type: 'string',
          description: 'Language for recommendations (en/he)',
          default: 'en',
        }
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'get_smart_summary',
    description: 'Get a concise, actionable summary of code quality instead of full issue list',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project',
        }
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'get_quick_wins',
    description: 'Get high-impact, low-effort fixes to quickly improve code quality score',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project',
        }
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'get_trends',
    description: 'See how code quality is improving or degrading over time',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project',
        }
      },
      required: ['projectPath'],
    },
  }
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const detector = new ProjectDetector();
    const analyzer = new QualityAnalyzer();
    const storage = new AnalysisStorage();

    switch (name) {
      case 'analyze_project': {
        const projectPath = args?.projectPath as string;
        const deep = args?.deep as boolean ?? true;

        const projectInfo = await detector.detectProject(projectPath, deep);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(projectInfo, null, 2),
            },
          ],
        };
      }

      case 'check_quality': {
        const projectPath = args?.projectPath as string;
        const projectTypeOverride = args?.projectType as string | undefined;

        // Pagination parameters
        const page = Math.max(1, (args?.page as number) || 1);
        const pageSize = Math.min(100, Math.max(1, (args?.pageSize as number) || 50));

        // Extract analysis options
        const options = {
          deepAnalysis: args?.deepAnalysis as boolean ?? false,
          aiEnabled: args?.aiEnabled as boolean ?? false,
          checkUnusedCode: args?.checkUnusedCode as boolean ?? true,
          checkComplexity: args?.checkComplexity as boolean ?? false,
          checkSecurity: args?.checkSecurity as boolean ?? false,
        };

        const projectInfo = projectTypeOverride
          ? { types: [projectTypeOverride], isMultiProject: false }
          : await detector.detectProject(projectPath, true);

        const qualityReport = await analyzer.analyzeQuality(projectPath, projectInfo, options);

        // Pagination logic
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedIssues = qualityReport.issues.slice(startIndex, endIndex);
        const totalPages = Math.ceil(qualityReport.issues.length / pageSize);

        // Create paginated report
        const limitedReport = {
          ...qualityReport,
          issues: paginatedIssues,
          pagination: {
            currentPage: page,
            pageSize: pageSize,
            totalIssues: qualityReport.issues.length,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            issuesOnCurrentPage: paginatedIssues.length,
            startIndex: startIndex + 1, // 1-indexed for user clarity
            endIndex: Math.min(endIndex, qualityReport.issues.length)
          },
          issuesSummary: {
            byCategory: qualityReport.issues.reduce((acc, issue) => {
              acc[issue.category] = (acc[issue.category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            bySeverity: qualityReport.issues.reduce((acc, issue) => {
              acc[issue.severity] = (acc[issue.severity] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          }
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(limitedReport, null, 2),
            },
          ],
        };
      }

      case 'get_recommendations': {
        const projectPath = args?.projectPath as string;

        const projectInfo = await detector.detectProject(projectPath, true);
        const recommendations = await analyzer.getRecommendations(projectPath, projectInfo);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(recommendations, null, 2),
            },
          ],
        };
      }

      case 'get_smart_summary': {
        const projectPath = args?.projectPath as string;

        // Run analysis
        const projectInfo = await detector.detectProject(projectPath, true);
        const qualityReport = await analyzer.analyzeQuality(projectPath, projectInfo, {});

        // Save for trends
        await storage.saveAnalysis(projectPath, qualityReport);

        // Generate summary
        const summary = storage.generateSmartSummary(qualityReport);
        const formatted = storage.formatSmartSummary(summary);

        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      }

      case 'get_quick_wins': {
        const projectPath = args?.projectPath as string;

        // Run analysis
        const projectInfo = await detector.detectProject(projectPath, true);
        const qualityReport = await analyzer.analyzeQuality(projectPath, projectInfo, {});

        // Generate quick wins
        const quickWins = storage.generateQuickWins(qualityReport);
        const formatted = storage.formatQuickWins(quickWins);

        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      }

      case 'get_trends': {
        const projectPath = args?.projectPath as string;

        // Run analysis
        const projectInfo = await detector.detectProject(projectPath, true);
        const qualityReport = await analyzer.analyzeQuality(projectPath, projectInfo, {});

        // Generate trends (compares with previous)
        const trends = await storage.generateTrends(projectPath, qualityReport);
        const formatted = storage.formatTrends(trends);

        // Save current for next comparison
        await storage.saveAnalysis(projectPath, qualityReport);

        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Code Quality MCP Server running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});