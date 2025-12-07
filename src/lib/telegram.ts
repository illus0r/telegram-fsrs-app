// Telegram WebApp API integration
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
          secondary_bg_color: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isProgressVisible: boolean;
          isActive: boolean;
          setText(text: string): void;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          showProgress(leaveActive?: boolean): void;
          hideProgress(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
        CloudStorage: {
          setItem(key: string, value: string, callback?: (error: string | null, success: boolean) => void): void;
          getItem(key: string, callback: (error: string | null, value: string | null) => void): void;
          getItems(keys: string[], callback: (error: string | null, values: Record<string, string> | null) => void): void;
          removeItem(key: string, callback?: (error: string | null, success: boolean) => void): void;
          removeItems(keys: string[], callback?: (error: string | null, success: boolean) => void): void;
          getKeys(callback: (error: string | null, keys: string[] | null) => void): void;
        };
        ready(): void;
        expand(): void;
        close(): void;
        sendData(data: string): void;
        setHeaderColor(color: string): void;
        setBackgroundColor(color: string): void;
        SettingsButton: {
          isVisible: boolean;
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
      };
    };
  }
}

export class TelegramWebApp {
  private static instance: TelegramWebApp;
  private tg: typeof window.Telegram.WebApp | null = null;

  private constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.tg = window.Telegram.WebApp;
      this.init();
    }
  }

  static getInstance(): TelegramWebApp {
    if (!TelegramWebApp.instance) {
      TelegramWebApp.instance = new TelegramWebApp();
    }
    return TelegramWebApp.instance;
  }

  private init() {
    if (!this.tg) return;

    // Initialize the app
    this.tg.ready();
    this.tg.expand();

    // Set theme colors
    document.documentElement.style.setProperty('--tg-theme-bg-color', this.tg.themeParams.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', this.tg.themeParams.text_color || '#000000');
    document.documentElement.style.setProperty('--tg-theme-hint-color', this.tg.themeParams.hint_color || '#999999');
    document.documentElement.style.setProperty('--tg-theme-link-color', this.tg.themeParams.link_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-color', this.tg.themeParams.button_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', this.tg.themeParams.button_text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', this.tg.themeParams.secondary_bg_color || '#f1f1f1');

    console.log('Telegram WebApp initialized:', {
      version: this.tg.version,
      platform: this.tg.platform,
      colorScheme: this.tg.colorScheme,
      isExpanded: this.tg.isExpanded,
      viewportHeight: this.tg.viewportHeight,
    });
  }

  isAvailable(): boolean {
    return !!this.tg;
  }

  getVersion(): string {
    return this.tg?.version || '0.0';
  }

  isCloudStorageAvailable(): boolean {
    return !!this.tg?.CloudStorage;
  }

  // Main Button controls
  private currentMainButtonCallback: (() => void) | null = null;

  showMainButton(text: string, callback: () => void) {
    if (!this.tg?.MainButton) return;

    // Remove previous callback if exists
    if (this.currentMainButtonCallback) {
      this.tg.MainButton.offClick(this.currentMainButtonCallback);
    }

    this.tg.MainButton.setText(text);
    this.tg.MainButton.show();
    this.tg.MainButton.enable();
    this.tg.MainButton.onClick(callback);
    this.currentMainButtonCallback = callback;
  }

  hideMainButton() {
    if (!this.tg?.MainButton) return;
    
    // Remove callback when hiding
    if (this.currentMainButtonCallback) {
      this.tg.MainButton.offClick(this.currentMainButtonCallback);
      this.currentMainButtonCallback = null;
    }
    
    this.tg.MainButton.hide();
  }

  setMainButtonText(text: string) {
    if (!this.tg?.MainButton) return;
    
    this.tg.MainButton.setText(text);
  }

  enableMainButton() {
    if (!this.tg?.MainButton) return;
    
    this.tg.MainButton.enable();
  }

  disableMainButton() {
    if (!this.tg?.MainButton) return;
    
    this.tg.MainButton.disable();
  }

  // Settings Button controls (less prominent than MainButton)
  private currentSettingsButtonCallback: (() => void) | null = null;

  showSettingsButton(callback: () => void) {
    if (!this.tg?.SettingsButton) return;

    // Remove previous callback if exists
    if (this.currentSettingsButtonCallback) {
      this.tg.SettingsButton.offClick(this.currentSettingsButtonCallback);
    }

    this.tg.SettingsButton.show();
    this.tg.SettingsButton.onClick(callback);
    this.currentSettingsButtonCallback = callback;
  }

  hideSettingsButton() {
    if (!this.tg?.SettingsButton) return;
    
    // Remove callback when hiding
    if (this.currentSettingsButtonCallback) {
      this.tg.SettingsButton.offClick(this.currentSettingsButtonCallback);
      this.currentSettingsButtonCallback = null;
    }
    
    this.tg.SettingsButton.hide();
  }

  // Back Button controls
  private currentBackButtonCallback: (() => void) | null = null;

  showBackButton(callback: () => void) {
    if (!this.tg?.BackButton) return;

    // Remove previous callback if exists
    if (this.currentBackButtonCallback) {
      this.tg.BackButton.offClick(this.currentBackButtonCallback);
    }

    this.tg.BackButton.show();
    this.tg.BackButton.onClick(callback);
    this.currentBackButtonCallback = callback;
  }

  hideBackButton() {
    if (!this.tg?.BackButton) return;
    
    // Remove callback when hiding
    if (this.currentBackButtonCallback) {
      this.tg.BackButton.offClick(this.currentBackButtonCallback);
      this.currentBackButtonCallback = null;
    }
    
    this.tg.BackButton.hide();
  }

  // Theme
  getThemeParams() {
    return this.tg?.themeParams || {};
  }

  getColorScheme(): 'light' | 'dark' {
    return this.tg?.colorScheme || 'light';
  }

  // User data
  getUserData() {
    return this.tg?.initDataUnsafe?.user || null;
  }

  // Haptic feedback (if available)
  hapticFeedback(type: 'impact' | 'notification' | 'selection' = 'impact') {
    // This would need additional Telegram WebApp API methods
    // For now, just a placeholder
    console.log(`Haptic feedback: ${type}`);
  }

  // Close the app
  close() {
    if (this.tg) {
      this.tg.close();
    }
  }
}

export const telegram = TelegramWebApp.getInstance();