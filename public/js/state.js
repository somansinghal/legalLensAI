const state = { workspaceReady: false };

export function getState() {
  return { ...state };
}

export function setWorkspaceReady(value) {
  state.workspaceReady = Boolean(value);
  return getState();
}
