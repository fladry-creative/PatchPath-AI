/**
 * Cosmos DB Client Configuration
 */

import { CosmosClient, type Database, type Container } from '@azure/cosmos';

// Cosmos DB configuration
const endpoint = process.env.COSMOS_ENDPOINT || '';
const key = process.env.COSMOS_KEY || '';
const connectionString = process.env.AZURE_COSMOS_CONNECTION_STRING || '';

// Initialize client
let cosmosClient: CosmosClient;

if (connectionString) {
  cosmosClient = new CosmosClient(connectionString);
} else if (endpoint && key) {
  cosmosClient = new CosmosClient({ endpoint, key });
} else {
  console.warn('⚠️  Cosmos DB not configured - using in-memory fallback');
}

// Database and container names
const DATABASE_ID = 'patchpath';
const CONTAINERS = {
  MODULES: 'modules',
  RACKS: 'racks',
  PATCHES: 'patches',
  ENRICHMENTS: 'enrichments',
  USERS: 'users',
} as const;

/**
 * Get database instance
 */
export async function getDatabase(): Promise<Database> {
  const { database } = await cosmosClient.databases.createIfNotExists({
    id: DATABASE_ID,
  });
  return database;
}

/**
 * Get container instance
 */
export async function getContainer(containerId: string): Promise<Container> {
  const database = await getDatabase();
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ['/partitionKey'] },
  });
  return container;
}

/**
 * Container accessors
 */
export async function getModulesContainer(): Promise<Container> {
  return getContainer(CONTAINERS.MODULES);
}

export async function getRacksContainer(): Promise<Container> {
  return getContainer(CONTAINERS.RACKS);
}

export async function getPatchesContainer(): Promise<Container> {
  return getContainer(CONTAINERS.PATCHES);
}

export async function getEnrichmentsContainer(): Promise<Container> {
  return getContainer(CONTAINERS.ENRICHMENTS);
}

export async function getUsersContainer(): Promise<Container> {
  return getContainer(CONTAINERS.USERS);
}

/**
 * Check if Cosmos DB is configured
 */
export function isCosmosConfigured(): boolean {
  return !!(connectionString || (endpoint && key));
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    if (!isCosmosConfigured()) return false;
    const database = await getDatabase();
    await database.read();
    return true;
  } catch (error) {
    console.error('Cosmos DB health check failed:', error);
    return false;
  }
}
