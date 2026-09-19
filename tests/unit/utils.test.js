import test from 'node:test';
import assert from 'node:assert/strict';
import { setWorkspaceReady } from '../../public/js/state.js';

test('frontend state utility returns a copy and normalizes readiness', () => {
  const state = setWorkspaceReady(1);
  assert.deepEqual(state, { workspaceReady: true });
  state.workspaceReady = false;
  assert.deepEqual(setWorkspaceReady(false), { workspaceReady: false });
});
