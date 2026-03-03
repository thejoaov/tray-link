import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { EmitterSubscription } from 'react-native';

import { UserPreferences, defaultUserPreferences, getUserPreferences } from '../modules/Storage';
import { loadPreferences, subscribePreferencesChange } from './preferences';

type Locale = NonNullable<UserPreferences['locale']>;

type TranslationKey =
  | 'settings'
  | 'language'
  | 'defaultEditor'
  | 'defaultTerminal'
  | 'systemDefault'
  | 'deleteFilesFromDiskByDefault'
  | 'addCustomEditor'
  | 'addCustomTerminal'
  | 'projects'
  | 'reorder'
  | 'done'
  | 'noProjectsYet'
  | 'clickToAddProject'
  | 'removeProjectTitle'
  | 'deleteFilesFromDisk'
  | 'cancel'
  | 'remove'
  | 'deleteFailed'
  | 'couldNotDeleteFromDisk'
  | 'loading'
  | 'settingsMenu'
  | 'quit'
  | 'customEditor'
  | 'customTerminal'
  | 'name'
  | 'binary'
  | 'openCommandTemplate'
  | 'saveCustomEditor'
  | 'saveCustomTerminal'
  | 'saved'
  | 'customEditorSaved'
  | 'customTerminalSaved'
  | 'moreActions'
  | 'openWithEditor'
  | 'openWithTerminal'
  | 'reload'
  | 'reloadToolList'
  | 'migrateLegacyData'
  | 'migrationPreviewFound'
  | 'migrationPreviewNone'
  | 'invalidEditor'
  | 'invalidTerminal'
  | 'invalidValues';

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    settings: 'Settings',
    language: 'Language',
    defaultEditor: 'Default editor',
    defaultTerminal: 'Default terminal',
    systemDefault: 'System default',
    deleteFilesFromDiskByDefault: 'Delete files from disk by default',
    addCustomEditor: 'Add custom editor',
    addCustomTerminal: 'Add custom terminal',
    projects: 'Projects',
    reorder: 'Reorder',
    done: 'Done',
    noProjectsYet: 'No projects added yet.',
    clickToAddProject: 'Click + to add a new project.',
    removeProjectTitle: 'Remove project?',
    deleteFilesFromDisk: 'Delete files from disk',
    cancel: 'Cancel',
    remove: 'Remove',
    deleteFailed: 'Delete failed',
    couldNotDeleteFromDisk: 'Could not delete {{path}} from disk.',
    loading: 'Loading...',
    settingsMenu: 'Settings…',
    quit: 'Quit',
    customEditor: 'Custom Editor',
    customTerminal: 'Custom Terminal',
    name: 'Name',
    binary: 'Binary',
    openCommandTemplate: 'Open command template',
    saveCustomEditor: 'Save custom editor',
    saveCustomTerminal: 'Save custom terminal',
    saved: 'Saved',
    customEditorSaved: 'Custom editor saved successfully.',
    customTerminalSaved: 'Custom terminal saved successfully.',
    moreActions: 'More actions',
    openWithEditor: 'Open with editor',
    openWithTerminal: 'Open with terminal',
    reload: 'Reload',
    reloadToolList: 'Reload editors and terminals',
    migrateLegacyData: 'Migrate legacy data',
    migrationPreviewFound: 'Legacy data found: {{projects}} projects',
    migrationPreviewNone: 'No legacy data found',
    invalidEditor: 'Invalid editor',
    invalidTerminal: 'Invalid terminal',
    invalidValues: 'Invalid values',
  },
  pt: {
    settings: 'Configurações',
    language: 'Idioma',
    defaultEditor: 'Editor padrão',
    defaultTerminal: 'Terminal padrão',
    systemDefault: 'Padrão do sistema',
    deleteFilesFromDiskByDefault: 'Excluir arquivos do disco por padrão',
    addCustomEditor: 'Adicionar editor personalizado',
    addCustomTerminal: 'Adicionar terminal personalizado',
    projects: 'Projetos',
    reorder: 'Reordenar',
    done: 'Concluir',
    noProjectsYet: 'Nenhum projeto adicionado ainda.',
    clickToAddProject: 'Clique em + para adicionar um projeto.',
    removeProjectTitle: 'Remover projeto?',
    deleteFilesFromDisk: 'Excluir arquivos do disco',
    cancel: 'Cancelar',
    remove: 'Remover',
    deleteFailed: 'Falha ao excluir',
    couldNotDeleteFromDisk: 'Não foi possível excluir {{path}} do disco.',
    loading: 'Carregando...',
    settingsMenu: 'Configurações…',
    quit: 'Sair',
    customEditor: 'Editor Personalizado',
    customTerminal: 'Terminal Personalizado',
    name: 'Nome',
    binary: 'Binário',
    openCommandTemplate: 'Template de comando de abertura',
    saveCustomEditor: 'Salvar editor personalizado',
    saveCustomTerminal: 'Salvar terminal personalizado',
    saved: 'Salvo',
    customEditorSaved: 'Editor personalizado salvo com sucesso.',
    customTerminalSaved: 'Terminal personalizado salvo com sucesso.',
    moreActions: 'Mais ações',
    openWithEditor: 'Abrir com editor',
    openWithTerminal: 'Abrir com terminal',
    reload: 'Recarregar',
    reloadToolList: 'Recarregar lista de editores e terminais',
    migrateLegacyData: 'Migrar dados legados',
    migrationPreviewFound: 'Dados legados encontrados: {{projects}} projetos',
    migrationPreviewNone: 'Nenhum dado legado encontrado',
    invalidEditor: 'Editor inválido',
    invalidTerminal: 'Terminal inválido',
    invalidValues: 'Valores inválidos',
  },
  es: {
    settings: 'Configuración',
    language: 'Idioma',
    defaultEditor: 'Editor predeterminado',
    defaultTerminal: 'Terminal predeterminado',
    systemDefault: 'Predeterminado del sistema',
    deleteFilesFromDiskByDefault: 'Eliminar archivos del disco por defecto',
    addCustomEditor: 'Agregar editor personalizado',
    addCustomTerminal: 'Agregar terminal personalizado',
    projects: 'Proyectos',
    reorder: 'Reordenar',
    done: 'Listo',
    noProjectsYet: 'Aún no hay proyectos agregados.',
    clickToAddProject: 'Haz clic en + para agregar un proyecto.',
    removeProjectTitle: '¿Eliminar proyecto?',
    deleteFilesFromDisk: 'Eliminar archivos del disco',
    cancel: 'Cancelar',
    remove: 'Eliminar',
    deleteFailed: 'Error al eliminar',
    couldNotDeleteFromDisk: 'No se pudo eliminar {{path}} del disco.',
    loading: 'Cargando...',
    settingsMenu: 'Configuración…',
    quit: 'Salir',
    customEditor: 'Editor personalizado',
    customTerminal: 'Terminal personalizado',
    name: 'Nombre',
    binary: 'Binario',
    openCommandTemplate: 'Plantilla de comando de apertura',
    saveCustomEditor: 'Guardar editor personalizado',
    saveCustomTerminal: 'Guardar terminal personalizado',
    saved: 'Guardado',
    customEditorSaved: 'Editor personalizado guardado con éxito.',
    customTerminalSaved: 'Terminal personalizado guardado con éxito.',
    moreActions: 'Más acciones',
    openWithEditor: 'Abrir con editor',
    openWithTerminal: 'Abrir con terminal',
    reload: 'Recargar',
    reloadToolList: 'Recargar lista de editores y terminales',
    migrateLegacyData: 'Migrar datos legados',
    migrationPreviewFound: 'Datos heredados encontrados: {{projects}} proyectos',
    migrationPreviewNone: 'No se encontraron datos heredados',
    invalidEditor: 'Editor inválido',
    invalidTerminal: 'Terminal inválido',
    invalidValues: 'Valores inválidos',
  },
};

export const resolveLocale = (): Locale => {
  const locale = getUserPreferences()?.locale ?? defaultUserPreferences.locale;
  if (locale === 'pt' || locale === 'es') {
    return locale;
  }
  return 'en';
};

const resources = {
  en: { translation: dictionaries.en },
  pt: { translation: dictionaries.pt },
  es: { translation: dictionaries.es },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: resolveLocale(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
}

export const syncI18nLanguageFromPreferences = () => {
  const locale = loadPreferences().locale;
  const nextLanguage = locale === 'pt' || locale === 'es' ? locale : 'en';
  if (i18n.language !== nextLanguage) {
    i18n.changeLanguage(nextLanguage);
  }
};

export const subscribeLanguageSync = (): EmitterSubscription => {
  return subscribePreferencesChange(() => {
    syncI18nLanguageFromPreferences();
  });
};

export type { TranslationKey };
export { i18n };
