#!/usr/bin/env node
/**
 * PatchPath AI MCP Server (HTTP+SSE Transport)
 *
 * Deployed version that accepts connections via HTTP with Server-Sent Events.
 * This allows Claude Desktop to connect remotely instead of via stdio.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import cors from 'cors';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool handlers (same as stdio version)
import {
  searchModules,
  getModuleDetails,
  analyzeRackFromUrl,
  generatePatchForRack,
} from './tools/read-tools.js';

import {
  contributeModule,
  verifyModule,
  enrichModuleIO,
  contributePatch,
  linkModules,
} from './tools/write-tools.js';

import logger from '../lib/logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS for Claude Desktop connections
app.use(
  cors({
    origin: '*', // Claude Desktop origin
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'patchpath-mcp-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// MCP SSE endpoint
app.get('/sse', async (req, res) => {
  logger.info('🔌 New MCP connection via SSE');

  const transport = new SSEServerTransport('/message', res);
  const server = new Server(
    {
      name: 'patchpath-ai',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Setup tool handlers (same logic as stdio version)
  setupMCPHandlers(server);

  await server.connect(transport);
  logger.info('✅ MCP client connected');
});

// MCP message endpoint (for SSE)
app.post('/message', async (req, res) => {
  // SSE transport handles this automatically
  res.sendStatus(200);
});

/**
 * Setup MCP server handlers
 * (Extracted to reuse logic from stdio version)
 */
function setupMCPHandlers(server: Server) {
  // List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      // READ TOOLS
      {
        name: 'searchModules',
        description: 'Search for Eurorack modules by name, manufacturer, or capability',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            manufacturer: { type: 'string', description: 'Filter by manufacturer (optional)' },
            type: { type: 'string', description: 'Filter by type (optional)' },
            limit: { type: 'number', description: 'Max results (default 20)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'getModuleDetails',
        description: 'Get comprehensive module details',
        inputSchema: {
          type: 'object',
          properties: {
            moduleId: { type: 'string', description: 'Module ID' },
          },
          required: ['moduleId'],
        },
      },
      {
        name: 'analyzeRack',
        description: 'Analyze ModularGrid rack from URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Rack URL' },
          },
          required: ['url'],
        },
      },
      {
        name: 'generatePatch',
        description: 'Generate patch for rack and intent',
        inputSchema: {
          type: 'object',
          properties: {
            rackUrl: { type: 'string', description: 'Rack URL' },
            intent: { type: 'string', description: 'Patch intent' },
            genre: { type: 'string', description: 'Genre (optional)' },
            technique: { type: 'string', description: 'Technique (optional)' },
          },
          required: ['rackUrl', 'intent'],
        },
      },
      // WRITE TOOLS
      {
        name: 'contributeModule',
        description: 'Add new module to database',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            manufacturer: { type: 'string' },
            type: { type: 'string' },
            hp: { type: 'number' },
            description: { type: 'string' },
            rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'very-rare', 'diy'] },
            productionStatus: {
              type: 'string',
              enum: ['current', 'discontinued', 'limited', 'diy', 'unknown'],
            },
            source: { type: 'string' },
          },
          required: ['name', 'manufacturer', 'type'],
        },
      },
      {
        name: 'verifyModule',
        description: 'Verify or correct module data',
        inputSchema: {
          type: 'object',
          properties: {
            moduleId: { type: 'string' },
            corrections: { type: 'object' },
            verificationNote: { type: 'string' },
          },
          required: ['moduleId'],
        },
      },
      {
        name: 'enrichModuleIO',
        description: 'Add I/O specifications',
        inputSchema: {
          type: 'object',
          properties: {
            moduleId: { type: 'string' },
            inputs: { type: 'array' },
            outputs: { type: 'array' },
          },
          required: ['moduleId'],
        },
      },
      {
        name: 'contributePatch',
        description: 'Save patch to community library',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            modules: { type: 'array' },
            connections: { type: 'array' },
            technique: { type: 'string' },
            genre: { type: 'string' },
          },
          required: ['title', 'modules', 'connections'],
        },
      },
      {
        name: 'linkModules',
        description: 'Link related modules',
        inputSchema: {
          type: 'object',
          properties: {
            moduleId1: { type: 'string' },
            moduleId2: { type: 'string' },
            relationship: {
              type: 'string',
              enum: ['variation', 'successor', 'alternative', 'similar', 'complement'],
            },
            note: { type: 'string' },
          },
          required: ['moduleId1', 'moduleId2', 'relationship'],
        },
      },
    ],
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    logger.info('🔧 MCP tool called', { tool: name });

    try {
      let result;

      switch (name) {
        case 'searchModules':
          result = await searchModules(args as Parameters<typeof searchModules>[0]);
          break;
        case 'getModuleDetails':
          result = await getModuleDetails(args as Parameters<typeof getModuleDetails>[0]);
          break;
        case 'analyzeRack':
          result = await analyzeRackFromUrl(args as Parameters<typeof analyzeRackFromUrl>[0]);
          break;
        case 'generatePatch':
          result = await generatePatchForRack(args as Parameters<typeof generatePatchForRack>[0]);
          break;
        case 'contributeModule':
          result = await contributeModule(args as Parameters<typeof contributeModule>[0]);
          break;
        case 'verifyModule':
          result = await verifyModule(args as Parameters<typeof verifyModule>[0]);
          break;
        case 'enrichModuleIO':
          result = await enrichModuleIO(args as Parameters<typeof enrichModuleIO>[0]);
          break;
        case 'contributePatch':
          result = await contributePatch(args as Parameters<typeof contributePatch>[0]);
          break;
        case 'linkModules':
          result = await linkModules(args as Parameters<typeof linkModules>[0]);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('❌ Tool error', { tool: name, error });
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: 'module://{manufacturer}/{name}',
        name: 'Module info',
        mimeType: 'application/json',
      },
    ],
  }));
}

// Start server
app.listen(PORT, () => {
  logger.info('🚀 PatchPath MCP Server (HTTP+SSE) running', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
  logger.info('🎸 Two-way knowledge preservation active');
  logger.info(`📡 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔌 MCP endpoint: http://localhost:${PORT}/sse`);
});
