#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ProjectDetector } from './detectors/ProjectDetector.js';
import { QualityAnalyzer } from './analyzers/QualityAnalyzer.js';
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
    description: 'Check code quality based on project type',
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
          description: 'Language for recommendations (he/en)',
          default: 'he',
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

        const projectInfo = projectTypeOverride
          ? { types: [projectTypeOverride], isMultiProject: false }
          : await detector.detectProject(projectPath, true);

        const qualityReport = await analyzer.analyzeQuality(projectPath, projectInfo);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(qualityReport, null, 2),
            },
          ],
        };
      }

      case 'get_recommendations': {
        const projectPath = args?.projectPath as string;
        const language = args?.language as string ?? 'he';

        const projectInfo = await detector.detectProject(projectPath, true);
        const recommendations = await analyzer.getRecommendations(projectPath, projectInfo, language);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(recommendations, null, 2),
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