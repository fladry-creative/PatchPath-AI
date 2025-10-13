#!/usr/bin/env node
/**
 * PatchPath AI MCP Server
 *
 * The universal modular synthesis knowledge platform.
 *
 * This server enables AI assistants to:
 * - READ: Query module data, analyze racks, generate patches
 * - WRITE: Contribute new modules, verify data, preserve knowledge
 *
 * Two-way knowledge preservation: AI + humans building the database together.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool handlers
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

/**
 * PatchPath MCP Server
 * Two-way knowledge preservation platform
 */
class PatchPathMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
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

    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupErrorHandling();

    logger.info('🎸 PatchPath MCP Server initialized');
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('📋 Listing available MCP tools');

      return {
        tools: [
          // ========================================
          // READ TOOLS: Query existing knowledge
          // ========================================
          {
            name: 'searchModules',
            description:
              'Search for Eurorack modules by name, manufacturer, or capability. Returns module details including type, HP, and popularity.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (module name, manufacturer, or capability)',
                },
                manufacturer: {
                  type: 'string',
                  description: 'Filter by manufacturer (optional)',
                },
                type: {
                  type: 'string',
                  description:
                    'Filter by module type: VCO, VCF, VCA, SyncGenerator, etc. (optional)',
                },
                limit: {
                  type: 'number',
                  description: 'Max results to return (default: 20, max: 100)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'getModuleDetails',
            description:
              'Get comprehensive details for a specific module including inputs, outputs, specifications, and community data.',
            inputSchema: {
              type: 'object',
              properties: {
                moduleId: {
                  type: 'string',
                  description: 'Module ID from searchModules or known module identifier',
                },
              },
              required: ['moduleId'],
            },
          },
          {
            name: 'analyzeRack',
            description:
              'Analyze a ModularGrid rack from URL or CDN image. Returns identified modules, capabilities, and suggested techniques.',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description:
                    'ModularGrid rack URL (https://modulargrid.net/e/racks/view/[ID]) or CDN image URL',
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'generatePatch',
            description:
              'Generate a modular synth patch for a specific rack and musical intent. Returns step-by-step patching instructions.',
            inputSchema: {
              type: 'object',
              properties: {
                rackUrl: {
                  type: 'string',
                  description: 'ModularGrid rack URL or CDN image URL',
                },
                intent: {
                  type: 'string',
                  description:
                    'Musical intent or patch goal (e.g., "dark ambient drone", "techno bassline", "geometric video patterns")',
                },
                genre: {
                  type: 'string',
                  description: 'Music genre for context (optional)',
                },
                technique: {
                  type: 'string',
                  description: 'Specific synthesis technique to use (optional)',
                },
              },
              required: ['rackUrl', 'intent'],
            },
          },

          // ========================================
          // WRITE TOOLS: Contribute knowledge
          // ========================================
          {
            name: 'contributeModule',
            description:
              'Add a new module to the PatchPath database. Use this when you discover a module not yet in the system (rare modules, DIY builds, discontinued products).',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Module name',
                },
                manufacturer: {
                  type: 'string',
                  description: 'Manufacturer name',
                },
                type: {
                  type: 'string',
                  description: 'Module type (VCO, VCF, VCA, SyncGenerator, etc.)',
                },
                hp: {
                  type: 'number',
                  description: 'Width in HP (Eurorack horizontal pitch units)',
                },
                description: {
                  type: 'string',
                  description: 'Module description and capabilities',
                },
                rarity: {
                  type: 'string',
                  enum: ['common', 'uncommon', 'rare', 'very-rare', 'diy'],
                  description: 'How rare/available is this module?',
                },
                productionStatus: {
                  type: 'string',
                  enum: ['current', 'discontinued', 'limited', 'diy', 'unknown'],
                  description: 'Production status',
                },
                source: {
                  type: 'string',
                  description: 'Source of this information (user report, manufacturer site, etc.)',
                },
              },
              required: ['name', 'manufacturer', 'type'],
            },
          },
          {
            name: 'verifyModule',
            description:
              'Verify or correct existing module data. Use this to improve accuracy when you notice incorrect information.',
            inputSchema: {
              type: 'object',
              properties: {
                moduleId: {
                  type: 'string',
                  description: 'Module ID to verify/correct',
                },
                corrections: {
                  type: 'object',
                  description:
                    'Fields to correct (name, manufacturer, type, hp, description, etc.)',
                },
                verificationNote: {
                  type: 'string',
                  description: 'Explanation of the verification/correction',
                },
              },
              required: ['moduleId'],
            },
          },
          {
            name: 'enrichModuleIO',
            description:
              'Add or update input/output specifications for a module. Critical for accurate patch generation.',
            inputSchema: {
              type: 'object',
              properties: {
                moduleId: {
                  type: 'string',
                  description: 'Module ID to enrich',
                },
                inputs: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: {
                        type: 'string',
                        description: 'CV, Audio, Gate, Trigger, Sync, Ramp, Video, etc.',
                      },
                      description: { type: 'string' },
                    },
                  },
                  description: 'Input jacks and their specifications',
                },
                outputs: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: {
                        type: 'string',
                        description: 'CV, Audio, Gate, Trigger, Sync, Ramp, Video, etc.',
                      },
                      description: { type: 'string' },
                    },
                  },
                  description: 'Output jacks and their specifications',
                },
              },
              required: ['moduleId'],
            },
          },
          {
            name: 'contributePatch',
            description:
              'Save a patch to the community library. Helps build a repository of proven patching techniques.',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Patch title',
                },
                description: {
                  type: 'string',
                  description: 'What this patch does and how it sounds/looks',
                },
                modules: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Module names used in this patch',
                },
                connections: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      from: { type: 'string' },
                      to: { type: 'string' },
                      cable: { type: 'string' },
                    },
                  },
                  description: 'Cable connections',
                },
                technique: {
                  type: 'string',
                  description: 'Primary synthesis technique used',
                },
                genre: {
                  type: 'string',
                  description: 'Genre or style this patch is suited for',
                },
              },
              required: ['title', 'modules', 'connections'],
            },
          },
          {
            name: 'linkModules',
            description:
              'Identify relationships between modules (variations, successors, alternatives). Helps build knowledge graph.',
            inputSchema: {
              type: 'object',
              properties: {
                moduleId1: {
                  type: 'string',
                  description: 'First module ID',
                },
                moduleId2: {
                  type: 'string',
                  description: 'Second module ID',
                },
                relationship: {
                  type: 'string',
                  enum: ['variation', 'successor', 'alternative', 'similar', 'complement'],
                  description: 'Type of relationship between modules',
                },
                note: {
                  type: 'string',
                  description: 'Description of the relationship',
                },
              },
              required: ['moduleId1', 'moduleId2', 'relationship'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      logger.info('🔧 MCP tool called', { tool: name, args });

      try {
        let result;

        switch (name) {
          // READ TOOLS
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

          // WRITE TOOLS
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

        logger.info('✅ Tool execution successful', { tool: name });

        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('❌ MCP tool error', {
          tool: name,
          error: error instanceof Error ? error.message : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'module://{manufacturer}/{name}',
          name: 'Module by manufacturer and name',
          description: 'Access detailed module information',
          mimeType: 'application/json',
        },
        {
          uri: 'patch://{id}',
          name: 'Community patch',
          description: 'Access saved patch information',
          mimeType: 'application/json',
        },
      ],
    }));
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      logger.error('❌ MCP server error', {
        error: error.message,
        stack: error.stack,
      });
    };

    process.on('SIGINT', async () => {
      logger.info('🛑 MCP server shutting down...');
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info('🚀 PatchPath MCP Server running');
    logger.info('📡 Listening for MCP requests via stdio');
    logger.info('🎸 Two-way knowledge preservation active');
  }
}

// Start server
const server = new PatchPathMCPServer();
server.run().catch((error) => {
  logger.error('❌ Failed to start MCP server', {
    error: error instanceof Error ? error.message : 'Unknown',
  });
  process.exit(1);
});
