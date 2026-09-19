import { onReady } from './utils.js';
import { setWorkspaceReady } from './state.js';
import { initRevealAnimations, setVisible } from './ui.js';

onReady(() => {
  initRevealAnimations();
  const button = document.querySelector('#workspaceCta');
  if (!button) return;
  button.addEventListener('click', () => {
    setWorkspaceReady(true);
    setVisible('#workspaceMessage', true);
    button.textContent = 'Workspace coming soon';
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
  });
});
