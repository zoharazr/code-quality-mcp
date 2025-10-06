/**
 * ====================================================================
 * CODE QUALITY MCP SERVER - USAGE EXAMPLES
 * ====================================================================
 *
 * This file demonstrates how to use the Code Quality MCP Server
 * in different scenarios.
 *
 * The server provides HYBRID analysis:
 * - FAST MODE: Logic-based checks (regex patterns)
 * - DEEP MODE: AI-powered analysis (Claude)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// ====================================================================
// EXAMPLE 1: How to Start the MCP Server
// ====================================================================

/**
 * Start the MCP server (usually done automatically by Claude Desktop)
 *
 * In your Claude Desktop config (~/.config/Claude/claude_desktop_config.json):
 *
 * {
 *   "mcpServers": {
 *     "code-quality": {
 *       "command": "node",
 *       "args": ["/path/to/code-quality-mcp/dist/index.js"]
 *     }
 *   }
 * }
 */
async function startServer() {
  // This is what happens when you run: npm start
  // The server is already implemented in src/index.ts
  console.log('Server starts automatically when Claude Desktop launches it');
  console.log('You don\'t need to start it manually!');
}

// ====================================================================
// EXAMPLE 2: Using the Server via MCP Client
// ====================================================================

/**
 * Example: Connect to the server and analyze a project
 */
async function exampleConnectAndAnalyze() {
  // This is how Claude Desktop connects to your server
  const client = new Client({
    name: 'code-quality-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  // Connect via stdio (same way Claude Desktop does)
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js']
  });

  await client.connect(transport);

  // List available tools
  const tools = await client.listTools();
  console.log('Available tools:', tools);

  // Call a tool
  const result = await client.callTool({
    name: 'check_quality',
    arguments: {
      projectPath: '.',
      deepAnalysis: false  // Fast mode
    }
  });

  console.log('Analysis result:', result);
}

// ====================================================================
// EXAMPLE 3: Fast Mode Analysis (Development)
// ====================================================================

/**
 * Use case: Quick checks during development
 *
 * When to use:
 * - Every few minutes while coding
 * - Before committing code
 * - In CI/CD pipelines
 *
 * MCP Tool Call:
 */
const fastModeExample = {
  tool: 'check_quality',
  arguments: {
    projectPath: '/path/to/your/project',

    // FAST MODE SETTINGS
    deepAnalysis: false,      // Use logic-based checks only
    aiEnabled: false,         // No AI calls

    // What to check
    checkUnusedCode: true,    // Check for unused variables
  }
};

/**
 * Expected response (Fast Mode):
 *
 * {
 *   "projectPath": ".",
 *   "projectTypes": ["nodejs"],
 *   "score": 88,
 *   "analysisType": "fast",
 *   "issues": [
 *     {
 *       "severity": "warning",
 *       "category": "unused-code",
 *       "file": "src/utils/helper.ts",
 *       "line": 42,
 *       "message": "Variable 'unusedVar' is declared but never used",
 *       "rule": "no-unused-vars"
 *     }
 *   ],
 *   "recommendations": [
 *     "Remove unused variables to improve code cleanliness"
 *   ],
 *   "stats": {
 *     "totalFiles": 25,
 *     "totalLines": 1500
 *   }
 * }
 *
 * Performance: ~20ms
 */

// ====================================================================
// EXAMPLE 4: Deep Mode Analysis (Code Review)
// ====================================================================

/**
 * Use case: Thorough analysis before merging
 *
 * When to use:
 * - Before creating a Pull Request
 * - During code review
 * - For security audits
 * - When refactoring large sections
 *
 * MCP Tool Call:
 */
const deepModeExample = {
  tool: 'check_quality',
  arguments: {
    projectPath: '/path/to/your/project',

    // DEEP MODE SETTINGS
    deepAnalysis: true,       // Enable AI analysis
    aiEnabled: true,          // Use Claude for analysis

    // Comprehensive checks
    checkUnusedCode: true,    // Check for unused code
    checkComplexity: true,    // Check code complexity (AI)
    checkSecurity: true,      // Check security issues (AI)
  }
};

/**
 * Expected response (Deep Mode):
 *
 * {
 *   "projectPath": ".",
 *   "projectTypes": ["nodejs", "react"],
 *   "score": 92,
 *   "analysisType": "deep",
 *   "issues": [
 *     {
 *       "severity": "error",
 *       "category": "security",
 *       "file": "src/api/auth.ts",
 *       "line": 15,
 *       "message": "Hardcoded credentials detected",
 *       "rule": "no-hardcoded-secrets"
 *     },
 *     {
 *       "severity": "warning",
 *       "category": "code-quality",
 *       "file": "src/services/processor.ts",
 *       "line": 50,
 *       "message": "Function 'processData' is too complex (complexity: 15)",
 *       "rule": "complexity"
 *     }
 *   ],
 *   "aiInsights": [
 *     "src/api/auth.ts:",
 *     "Extract environment variable validation into separate function",
 *     "Add input sanitization for user credentials",
 *     "src/services/processor.ts:",
 *     "Break down 'processData' into smaller functions",
 *     "Consider using a state machine for complex flow"
 *   ],
 *   "recommendations": [
 *     "Use environment variables for sensitive data",
 *     "Refactor complex functions to improve maintainability"
 *   ]
 * }
 *
 * Performance: ~1000ms (with AI calls)
 */

// ====================================================================
// EXAMPLE 5: Project Type Analysis
// ====================================================================

/**
 * Use case: Detect project type and structure
 *
 * MCP Tool Call:
 */
const analyzeProjectExample = {
  tool: 'analyze_project',
  arguments: {
    projectPath: '/path/to/your/project',
    deep: true  // Include nested projects
  }
};

/**
 * Expected response:
 *
 * {
 *   "types": ["nodejs", "react", "firebase-functions"],
 *   "isMultiProject": true,
 *   "mainFramework": "react",
 *   "subProjects": [
 *     {
 *       "path": "functions",
 *       "type": "firebase-functions",
 *       "dependencies": ["firebase-admin", "express"]
 *     },
 *     {
 *       "path": "client",
 *       "type": "react",
 *       "dependencies": ["react", "react-dom"]
 *     }
 *   ]
 * }
 */

// ====================================================================
// EXAMPLE 6: Get Recommendations Only
// ====================================================================

/**
 * Use case: Quick suggestions without full analysis
 *
 * MCP Tool Call:
 */
const recommendationsExample = {
  tool: 'get_recommendations',
  arguments: {
    projectPath: '/path/to/your/project',
    language: 'he'  // Hebrew recommendations
  }
};

/**
 * Expected response:
 *
 * {
 *   "score": 85,
 *   "projectTypes": ["nodejs"],
 *   "recommendations": [
 *     "השתמש ב-path aliases כדי למנוע imports עמוקים",
 *     "הוסף TypeScript לפרויקט לשיפור type safety",
 *     "העבר console.log למערכת logging מסודרת"
 *   ],
 *   "topIssues": [
 *     {
 *       "severity": "warning",
 *       "message": "Deep relative imports found"
 *     }
 *   ]
 * }
 */

// ====================================================================
// EXAMPLE 7: Specific Project Type Override
// ====================================================================

/**
 * Use case: Force analysis for specific project type
 *
 * MCP Tool Call:
 */
const specificTypeExample = {
  tool: 'check_quality',
  arguments: {
    projectPath: '/path/to/your/project',
    projectType: 'react-native',  // Force React Native rules
    deepAnalysis: false
  }
};

// ====================================================================
// EXAMPLE 8: Minimal Analysis (Fastest)
// ====================================================================

/**
 * Use case: Ultra-fast basic checks only
 *
 * MCP Tool Call:
 */
const minimalAnalysisExample = {
  tool: 'check_quality',
  arguments: {
    projectPath: '/path/to/your/project',

    // Disable everything except basic checks
    deepAnalysis: false,
    aiEnabled: false,
    checkUnusedCode: false,  // Skip unused code check
  }
};

// ====================================================================
// EXAMPLE 9: Security-Focused Deep Analysis
// ====================================================================

/**
 * Use case: Security audit before deployment
 *
 * MCP Tool Call:
 */
const securityAuditExample = {
  tool: 'check_quality',
  arguments: {
    projectPath: '/path/to/your/project',

    // Focus on security
    deepAnalysis: true,
    aiEnabled: true,
    checkSecurity: true,      // Enable security checks
    checkComplexity: false,   // Don't need complexity
    checkUnusedCode: false,   // Don't need unused code
  }
};

// ====================================================================
// EXAMPLE 10: Complete Workflow (Real-World Usage)
// ====================================================================

/**
 * Real-world workflow for a development team
 */
async function completeWorkflow() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           CODE QUALITY WORKFLOW EXAMPLE                    ║
╚════════════════════════════════════════════════════════════╝

STEP 1: During Development (Every 5-10 minutes)
-----------------------------------------------
Command: Use Fast Mode
Tool: check_quality
Arguments:
  {
    "projectPath": ".",
    "deepAnalysis": false,
    "checkUnusedCode": true
  }
Result: Quick feedback in ~20ms

STEP 2: Before Commit (Pre-commit hook)
----------------------------------------
Command: Use Fast Mode with all checks
Tool: check_quality
Arguments:
  {
    "projectPath": ".",
    "deepAnalysis": false,
    "checkUnusedCode": true
  }
Result: Ensure no obvious issues before commit

STEP 3: Before Creating PR (Manual)
------------------------------------
Command: Use Deep Mode
Tool: check_quality
Arguments:
  {
    "projectPath": ".",
    "deepAnalysis": true,
    "aiEnabled": true,
    "checkUnusedCode": true,
    "checkComplexity": true,
    "checkSecurity": true
  }
Result: Comprehensive analysis with AI insights

STEP 4: In CI/CD Pipeline (Automated)
--------------------------------------
Command: Use Fast Mode for speed
Tool: check_quality
Arguments:
  {
    "projectPath": ".",
    "deepAnalysis": false,
    "checkUnusedCode": true
  }
Result: Fast validation in CI/CD

STEP 5: Before Production Deploy (Manual)
------------------------------------------
Command: Security-focused Deep Mode
Tool: check_quality
Arguments:
  {
    "projectPath": ".",
    "deepAnalysis": true,
    "aiEnabled": true,
    "checkSecurity": true
  }
Result: Final security check
  `);
}

// ====================================================================
// EXAMPLE 11: Using from Claude Desktop
// ====================================================================

/**
 * How Claude Desktop uses the server:
 *
 * User asks: "Can you check the code quality of my project?"
 *
 * Claude calls:
 *
 * <use_mcp_tool>
 *   <server_name>code-quality</server_name>
 *   <tool_name>check_quality</tool_name>
 *   <arguments>
 *     {
 *       "projectPath": "/Users/zohar/my-project",
 *       "deepAnalysis": false
 *     }
 *   </arguments>
 * </use_mcp_tool>
 *
 * Claude receives the response and tells the user:
 * "I've analyzed your project. You have a score of 88/100.
 *  I found 6 issues, mainly unused variables. Would you like
 *  me to help fix them?"
 */

// ====================================================================
// EXAMPLE 12: Error Handling
// ====================================================================

/**
 * How to handle errors when using the server
 */
async function errorHandlingExample() {
  try {
    // Call that might fail
    const result = await client.callTool({
      name: 'check_quality',
      arguments: {
        projectPath: '/invalid/path',  // Invalid path
        deepAnalysis: false
      }
    });
  } catch (error) {
    /**
     * Error response format:
     *
     * {
     *   "content": [
     *     {
     *       "type": "text",
     *       "text": "Error: ENOENT: no such file or directory"
     *     }
     *   ],
     *   "isError": true
     * }
     */
    console.error('Analysis failed:', error);
  }
}

// ====================================================================
// SUMMARY: When to Use Each Mode
// ====================================================================

const usageGuide = {
  fastMode: {
    when: [
      'During active development',
      'Before committing code',
      'In CI/CD pipelines',
      'With large codebases',
      'When speed is critical'
    ],
    settings: {
      deepAnalysis: false,
      aiEnabled: false
    },
    performance: '~20ms',
    cost: 'Free'
  },

  deepMode: {
    when: [
      'Before creating Pull Requests',
      'During code reviews',
      'For security audits',
      'When refactoring',
      'Finding complex issues'
    ],
    settings: {
      deepAnalysis: true,
      aiEnabled: true,
      checkComplexity: true,
      checkSecurity: true
    },
    performance: '~1000ms',
    cost: 'API calls to Claude'
  }
};

// ====================================================================
// EXPORT EXAMPLES
// ====================================================================

export {
  fastModeExample,
  deepModeExample,
  analyzeProjectExample,
  recommendationsExample,
  specificTypeExample,
  minimalAnalysisExample,
  securityAuditExample,
  completeWorkflow,
  errorHandlingExample,
  usageGuide
};

/**
 * ====================================================================
 * HOW TO RUN EXAMPLES
 * ====================================================================
 *
 * 1. Build the project:
 *    npm run build
 *
 * 2. Start the server (for Claude Desktop):
 *    npm start
 *
 * 3. Or test directly:
 *    npm run dev
 *
 * 4. Use from Claude Desktop:
 *    Just ask Claude to check your code quality!
 *
 * ====================================================================
 */
