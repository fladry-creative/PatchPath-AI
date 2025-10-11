#!/usr/bin/env tsx
/**
 * Test Cosmos DB Connection
 */

import { CosmosClient } from '@azure/cosmos';

async function testCosmosConnection() {
  console.log('🧪 Testing Cosmos DB Connection...\n');

  const connectionString = process.env.AZURE_COSMOS_CONNECTION_STRING;

  if (!connectionString) {
    console.error('❌ AZURE_COSMOS_CONNECTION_STRING not found in environment');
    process.exit(1);
  }

  console.log('✅ Connection string found');
  console.log(`   Length: ${connectionString.length} characters\n`);

  try {
    // Create client
    const client = new CosmosClient(connectionString);
    console.log('✅ Cosmos client created');

    // Test connection by getting database account
    const { resource: dbAccount } = await client.getDatabaseAccount();
    console.log('✅ Successfully connected to Cosmos DB');
    console.log(`   Consistency: ${dbAccount?.consistencyPolicy?.defaultConsistencyLevel}\n`);

    // Get or create database
    const { database } = await client.databases.createIfNotExists({ id: 'patchpath' });
    console.log('✅ Database ready: patchpath');

    // Get or create modules container
    const { container } = await database.containers.createIfNotExists({
      id: 'modules',
      partitionKey: { paths: ['/partitionKey'] },
    });
    console.log('✅ Container ready: modules\n');

    // Test write operation
    console.log('🧪 Testing write operation...');
    const testModule = {
      id: `test-module-${Date.now()}`,
      partitionKey: 'Test',
      name: 'Test Module',
      manufacturer: 'Test',
      type: 'VCO',
      hp: 8,
      createdAt: new Date().toISOString(),
    };

    const { resource: created } = await container.items.create(testModule);
    console.log('✅ Write successful:', created?.id);

    // Test read operation
    console.log('🧪 Testing read operation...');
    const { resource: read } = await container.item(testModule.id, 'Test').read();
    console.log('✅ Read successful:', read?.name);

    // Test delete operation
    console.log('🧪 Testing delete operation...');
    await container.item(testModule.id, 'Test').delete();
    console.log('✅ Delete successful\n');

    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   ✅ ALL COSMOS DB TESTS PASSED ✅           ║');
    console.log('╚══════════════════════════════════════════════╝');
  } catch (error) {
    console.error('\n❌ Cosmos DB test failed:', error);
    process.exit(1);
  }
}

testCosmosConnection().catch(console.error);
