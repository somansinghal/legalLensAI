import { onReady } from './utils.js';
import { initRevealAnimations } from './ui.js';
import { initThemeSwitcher } from './theme.js';

onReady(() => {
  initThemeSwitcher();
  initRevealAnimations();
});
