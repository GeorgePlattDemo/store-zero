import test from 'node:test';
import assert from 'node:assert/strict';
import {runSelfChecks} from './core-self-checks.mjs';
import {loadCatalog} from '../src/evaluation/catalog.mjs';
test('declared manufacturing core: 22 independent guide, inventory, geometry and Q checks',async()=>{const result=await runSelfChecks(loadCatalog());assert.equal(result.passed,22);});
