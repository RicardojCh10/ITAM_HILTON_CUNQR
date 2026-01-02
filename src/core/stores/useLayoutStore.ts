// src/core/stores/useLayoutStore.ts
import { defineStore } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';
import { updatePreset, updateSurfacePalette, $t } from '@primeuix/themes';
import { getPresetExt, type ColorOption } from '@/shared/layouts/composables/layout';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';

const surfacesList = [
  { name: 'slate', palette: { 0: '#ffffff', 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' } },
  { name: 'gray', palette: { 0: '#ffffff', 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712' } },
  { name: 'zinc', palette: { 0: '#ffffff', 50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b' } },
  { name: 'neutral', palette: { 0: '#ffffff', 50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4', 400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040', 800: '#262626', 900: '#171717', 950: '#0a0a0a' } },
  { name: 'stone', palette: { 0: '#ffffff', 50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1', 400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c', 800: '#292524', 900: '#1c1917', 950: '#0c0a09' } },
  { name: 'soho', palette: { 0: '#ffffff', 50: '#f4f4f4', 100: '#e8e9e9', 200: '#d2d2d4', 300: '#bbbcbe', 400: '#a5a5a9', 500: '#8e8f93', 600: '#77787d', 700: '#616268', 800: '#4a4b52', 900: '#34343d', 950: '#1d1e27' } },
  { name: 'viva', palette: { 0: '#ffffff', 50: '#f3f3f3', 100: '#e7e7e8', 200: '#cfd0d0', 300: '#b7b8b9', 400: '#9fa1a1', 500: '#87898a', 600: '#6e7173', 700: '#565a5b', 800: '#3e4244', 900: '#262b2c', 950: '#0e1315' } },
  { name: 'ocean', palette: { 0: '#ffffff', 50: '#fbfcfc', 100: '#F7F9F8', 200: '#EFF3F2', 300: '#DADEDD', 400: '#B1B7B6', 500: '#828787', 600: '#5F7274', 700: '#415B61', 800: '#29444E', 900: '#183240', 950: '#0c1920' } }
];

export const useLayoutStore = defineStore('layout', () => {
  const storedConfig = localStorage.getItem('layoutConfig');
  const storedState = localStorage.getItem('layoutState');

  const isConfiguratorOpen = ref(false);

  // Acción para abrir/cerrar configurador
  function setConfiguratorOpen(value: boolean) {
    isConfiguratorOpen.value = value;
  }

  const layoutConfig = reactive(storedConfig ? JSON.parse(storedConfig) : {
    preset: 'Aura',
    primary: 'sky',
    surface: 'slate',
    darkTheme: false,
    menuMode: 'static'
  });

  const layoutState = reactive(storedState ? JSON.parse(storedState) : {
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    activeMenuItem: null,
    configuratorVisible: false
  });

  // 🟢 Aquí agregas el getter computado:
  const isSidebarActive = computed(() =>
    layoutState.overlayMenuActive || layoutState.staticMenuMobileActive
  );

  // Persistencia
  watch(layoutConfig, (value) => {
    localStorage.setItem('layoutConfig', JSON.stringify(value));
  }, { deep: true });

  watch(layoutState, (value) => {
    localStorage.setItem('layoutState', JSON.stringify(value));
  }, { deep: true });

  const presetMap: Record<'Aura' | 'Lara' | 'Nora', unknown> = {
    'Aura': Aura,
    'Lara': Lara,
    'Nora': Nora
  };

  const applyFullTheme = (): void => {
    const presetValue = presetMap[layoutConfig.preset as 'Aura' | 'Lara' | 'Nora'] || Aura;
    const surfacePalette = surfacesList.find(s => s.name === layoutConfig.surface)?.palette;

    $t()
      .preset(presetValue)
      .preset(getPresetExt(layoutConfig.primary))
      .surfacePalette(surfacePalette)
      .use({ useDefaultOptions: true });

    document.documentElement.classList.toggle('app-dark', layoutConfig.darkTheme);
  };

  const toggleMenu = (): void => {
    if (layoutConfig.menuMode === 'overlay') {
      layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
    }
    if (window.innerWidth > 991) {
      layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
    } else {
      layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
    }
  };

  const toggleDarkMode = (): void => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme;
    document.documentElement.classList.toggle('app-dark', layoutConfig.darkTheme);
  };

  const setPrimaryColor = (colorName: string): void => {
    layoutConfig.primary = colorName;
    updatePreset(getPresetExt(colorName));
    applyFullTheme();
  };

  const setSurfaceColor = (surface: ColorOption): void => {
    layoutConfig.surface = surface.name;
    updateSurfacePalette(surface.palette);
    applyFullTheme();
  };

  const setPreset = (presetName: string): void => {
    layoutConfig.preset = presetName;
    applyFullTheme();
  };

  const setMenuMode = (mode: string): void => {
    layoutConfig.menuMode = mode;
  };

  const toggleConfigurator = (): void => {
    layoutState.configuratorVisible = !layoutState.configuratorVisible;
  };

  const setActiveMenuItem = (item: unknown): void => {
    layoutState.activeMenuItem = item;
  };

  return {
    layoutConfig,
    layoutState,
    toggleMenu,
    toggleDarkMode,
    setPrimaryColor,
    setSurfaceColor,
    setPreset,
    setMenuMode,
    toggleConfigurator,
    setActiveMenuItem,
    applyFullTheme,
    isSidebarActive,
    setConfiguratorOpen,
    isConfiguratorOpen,
  };
});