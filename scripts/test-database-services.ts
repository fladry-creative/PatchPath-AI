#!/usr/bin/env tsx

/**
 * Integration test for database services
 * Tests patch and rack services with real Cosmos DB
 */

import { savePatch, getPatch, deletePatch } from '../lib/database/patch-service';
import { saveRack, getRack, incrementUseCount, deleteRack } from '../lib/database/rack-service';
import { type Patch } from '../types/patch';
import { type ParsedRack } from '../types/rack';
import logger from '../lib/logger';

const TEST_USER_ID = 'integration-test-user';
const TEST_RACK_ID = '999999';

async function testPatchService() {
  logger.info('Testing Patch Service...');

  const testPatch: Patch = {
    id: `test-patch-${  Date.now()}`,
    userId: TEST_USER_ID,
    rackId: TEST_RACK_ID,
    metadata: {
      title: 'Integration Test Patch',
      description: 'Testing database services',
      difficulty: 'intermediate',
      estimatedTime: 10,
      techniques: ['FM'],
      genres: ['test'],
    },
    connections: [],
    patchingOrder: [],
    parameterSuggestions: [],
    whyThisWorks: 'This is a test',
    tips: ['Test tip'],
    createdAt: new Date(),
    updatedAt: new Date(),
    saved: false,
    tags: ['test'],
  };

  try {
    // Save patch
    logger.info('Saving test patch...');
    const saved = await savePatch(testPatch);
    logger.info('✅ Patch saved', { id: saved.id });

    // Get patch
    logger.info('Retrieving patch...');
    const retrieved = await getPatch(saved.id, TEST_USER_ID);
    if (!retrieved) {
      throw new Error('Failed to retrieve patch');
    }
    logger.info('✅ Patch retrieved', { id: retrieved.id });

    // Delete patch
    logger.info('Deleting patch...');
    await deletePatch(saved.id, TEST_USER_ID, true);
    logger.info('✅ Patch deleted');

    return true;
  } catch (error) {
    logger.error('❌ Patch service test failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

async function testRackService() {
  logger.info('Testing Rack Service...');

  const testRack: ParsedRack = {
    url: `https://modulargrid.net/e/racks/view/${TEST_RACK_ID}`,
    rows: [
      {
        rowNumber: 0,
        modules: [
          {
            id: 'test-mod-1',
            name: 'Test Module',
            manufacturer: 'Test',
            type: 'VCO',
            hp: 10,
            power: { positive12V: 50, negative12V: 50 },
            inputs: [],
            outputs: [],
            position: { row: 0, column: 0 },
          },
        ],
        totalHP: 10,
        maxHP: 168,
      },
    ],
    modules: [
      {
        id: 'test-mod-1',
        name: 'Test Module',
        manufacturer: 'Test',
        type: 'VCO',
        hp: 10,
        power: { positive12V: 50, negative12V: 50 },
        inputs: [],
        outputs: [],
        position: { row: 0, column: 0 },
      },
    ],
    metadata: {
      rackId: TEST_RACK_ID,
      rackName: 'Integration Test Rack',
      hp: 10,
    },
  };

  try {
    // Save rack
    logger.info('Saving test rack...');
    const saved = await saveRack(testRack);
    logger.info('✅ Rack saved', { id: saved.id });

    // Get rack
    logger.info('Retrieving rack...');
    const retrieved = await getRack(TEST_RACK_ID);
    if (!retrieved) {
      throw new Error('Failed to retrieve rack');
    }
    logger.info('✅ Rack retrieved', { id: retrieved.id });

    // Increment use count
    logger.info('Incrementing use count...');
    await incrementUseCount(TEST_RACK_ID);
    const afterIncrement = await getRack(TEST_RACK_ID);
    logger.info('✅ Use count incremented', { useCount: afterIncrement?.useCount });

    // Delete rack
    logger.info('Deleting rack...');
    await deleteRack(TEST_RACK_ID);
    logger.info('✅ Rack deleted');

    return true;
  } catch (error) {
    logger.error('❌ Rack service test failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

async function main() {
  logger.info('Starting database services integration test...');

  const patchSuccess = await testPatchService();
  const rackSuccess = await testRackService();

  logger.info('Integration test complete', {
    patchService: patchSuccess ? '✅ PASS' : '❌ FAIL',
    rackService: rackSuccess ? '✅ PASS' : '❌ FAIL',
  });

  if (patchSuccess && rackSuccess) {
    logger.info('🎉 All database services working correctly!');
    process.exit(0);
  } else {
    logger.error('❌ Some database services failed');
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Integration test error', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
