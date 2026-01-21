const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

class ThemeManager {
  constructor() {
    this.currentTheme = THEMES.LIGHT;
  }

  setTheme(theme) {
    if (Object.values(THEMES).includes(theme)) {
      this.currentTheme = theme;
      return { success: true, message: `Theme set to ${theme}` };
    }
    return { success: false, message: `Invalid theme. Available: ${Object.values(THEMES).join(', ')}` };
  }

  getTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return Object.values(THEMES);
  }
}

module.exports = { THEMES, ThemeManager };
