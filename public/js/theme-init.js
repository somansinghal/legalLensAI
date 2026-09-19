(function () {
  try {
    var saved = localStorage.getItem('legallens_theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'system');
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'system');
  }
})();
