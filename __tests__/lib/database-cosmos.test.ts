/**
 * Tests for lib/database/cosmos.ts
 * Uses REAL Cosmos DB connection
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  getDatabase,
  getContainer,
  getModulesContainer,
  getRacksContainer,
  getPatchesContainer,
  getEnrichmentsContainer,
  getUsersContainer,
  isCosmosConfigured,
  healthCheck,
} from '@/lib/database/cosmos';

describe('lib/database/cosmos', () => {
  const isConfigured = isCosmosConfigured();

  describe('isCosmosConfigured', () => {
    it('should check if Cosmos DB is configured', () => {
      expect(typeof isConfigured).toBe('boolean');

      if (
        process.env.AZURE_COSMOS_CONNECTION_STRING ||
        (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY)
      ) {
        expect(isConfigured).toBe(true);
      }
    });
  });

  describe('getDatabase', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition('should get or create database', async () => {
      const database = await getDatabase();

      expect(database).toBeDefined();
      expect(database.id).toBe('patchpath');
    }, 30000);

    testCondition('should return same database on multiple calls', async () => {
      const db1 = await getDatabase();
      const db2 = await getDatabase();

      expect(db1.id).toBe(db2.id);
    }, 30000);
  });

  describe('getContainer', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition('should create container if not exists', async () => {
      const container = await getContainer('test-container');

      expect(container).toBeDefined();
      expect(container.id).toBe('test-container');
    }, 30000);
  });

  describe('container accessors', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition('should get modules container', async () => {
      const container = await getModulesContainer();

      expect(container).toBeDefined();
      expect(container.id).toBe('modules');
    }, 30000);

    testCondition('should get racks container', async () => {
      const container = await getRacksContainer();

      expect(container).toBeDefined();
      expect(container.id).toBe('racks');
    }, 30000);

    testCondition('should get patches container', async () => {
      const container = await getPatchesContainer();

      expect(container).toBeDefined();
      expect(container.id).toBe('patches');
    }, 30000);

    testCondition('should get enrichments container', async () => {
      const container = await getEnrichmentsContainer();

      expect(container).toBeDefined();
      expect(container.id).toBe('enrichments');
    }, 30000);

    testCondition('should get users container', async () => {
      const container = await getUsersContainer();

      expect(container).toBeDefined();
      expect(container.id).toBe('users');
    }, 30000);
  });

  describe('healthCheck', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition('should pass health check when configured', async () => {
      const healthy = await healthCheck();

      expect(healthy).toBe(true);
    }, 30000);

    it('should fail health check when not configured', async () => {
      if (!isConfigured) {
        const healthy = await healthCheck();
        expect(healthy).toBe(false);
      } else {
        // Skip when configured
        expect(true).toBe(true);
      }
    });
  });

  describe('error handling', () => {
    it('should handle missing environment variables', () => {
      const originalConn = process.env.AZURE_COSMOS_CONNECTION_STRING;
      const originalEndpoint = process.env.COSMOS_ENDPOINT;
      const originalKey = process.env.COSMOS_KEY;

      delete process.env.AZURE_COSMOS_CONNECTION_STRING;
      delete process.env.COSMOS_ENDPOINT;
      delete process.env.COSMOS_KEY;

      // Re-import to test with missing vars
      jest.isolateModules(() => {
        const { isCosmosConfigured } = require('@/lib/database/cosmos');
        expect(isCosmosConfigured()).toBe(false);
      });

      // Restore
      if (originalConn) process.env.AZURE_COSMOS_CONNECTION_STRING = originalConn;
      if (originalEndpoint) process.env.COSMOS_ENDPOINT = originalEndpoint;
      if (originalKey) process.env.COSMOS_KEY = originalKey;
    });
  });

  describe('integration tests', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition('should perform basic CRUD operations', async () => {
      const container = await getContainer('test-crud');

      const testItem = {
        id: `test-${Date.now()}`,
        partitionKey: 'test',
        data: 'test data',
      };

      // Create
      const { resource: created } = await container.items.create(testItem);
      expect(created).toBeDefined();
      expect(created?.id).toBe(testItem.id);

      // Read
      const { resource: read } = await container
        .item(testItem.id, testItem.partitionKey)
        .read();
      expect(read).toBeDefined();
      expect(read?.data).toBe('test data');

      // Update
      if (read) {
        read.data = 'updated data';
        const { resource: updated } = await container
          .item(testItem.id, testItem.partitionKey)
          .replace(read);
        expect(updated?.data).toBe('updated data');
      }

      // Delete
      await container.item(testItem.id, testItem.partitionKey).delete();

      // Verify deletion
      try {
        await container.item(testItem.id, testItem.partitionKey).read();
        fail('Should have thrown 404');
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error) {
          expect(error.code).toBe(404);
        }
      }
    }, 60000);

    testCondition('should handle query operations', async () => {
      const container = await getContainer('test-query');

      // Insert test items
      const testItems = [
        {
          id: `test-query-1-${Date.now()}`,
          partitionKey: 'query-test',
          type: 'test',
          value: 100,
        },
        {
          id: `test-query-2-${Date.now()}`,
          partitionKey: 'query-test',
          type: 'test',
          value: 200,
        },
      ];

      for (const item of testItems) {
        await container.items.create(item);
      }

      // Query
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.type = @type',
        parameters: [{ name: '@type', value: 'test' }],
      };

      const { resources } = await container.items.query(querySpec).fetchAll();

      expect(resources.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      for (const item of testItems) {
        await container.item(item.id, item.partitionKey).delete();
      }
    }, 60000);
  });
});
