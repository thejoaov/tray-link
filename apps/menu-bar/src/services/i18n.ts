import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { EmitterSubscription } from 'react-native'

import { defaultUserPreferences, UserPreferences } from '../modules/Storage'
import { loadPreferences, subscribePreferencesChange } from './preferences'

type Locale = NonNullable<UserPreferences['locale']>

type TranslationKey =
  | 'settings'
  | 'language'
  | 'defaultEditor'
  | 'defaultTerminal'
  | 'openConfigFile'
  | 'openConfigFileDescription'
  | 'openConfigFileFailed'
  | 'systemDefault'
  | 'openOnStartup'
  | 'showAppIcons'
  | 'deleteFilesFromDiskByDefault'
  | 'addCustomEditor'
  | 'addCustomTerminal'
  | 'projects'
  | 'reorder'
  | 'done'
  | 'searchProjects'
  | 'clearSearch'
  | 'noProjectsYet'
  | 'noProjectsFound'
  | 'clickToAddProject'
  | 'adjustSearchOrAddProject'
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
  | 'selectProjectDefaults'
  | 'reload'
  | 'reloadToolList'
  | 'advanced'
  | 'migrateLegacyData'
  | 'migrationPreviewFound'
  | 'migrationPreviewNone'
  | 'invalidEditor'
  | 'invalidTerminal'
  | 'invalidValues'
  | 'cli'
  | 'installCli'
  | 'reinstallCli'
  | 'uninstallCli'
  | 'cliInstalled'
  | 'cliNotInstalled'
  | 'cliInstallError'
  | 'updates'
  | 'checkForUpdates'
  | 'installUpdate'
  | 'currentVersion'
  | 'latestVersion'
  | 'viewReleaseNotes'
  | 'updaterUnsupported'
  | 'updaterChecking'
  | 'updaterUpToDate'
  | 'updaterAvailable'
  | 'updaterInstalling'
  | 'updaterInstalled'
  | 'updaterError'

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    settings: 'Settings',
    language: 'Language',
    defaultEditor: 'Default editor',
    defaultTerminal: 'Default terminal',
    openConfigFile: 'Open config.json',
    openConfigFileDescription: 'Open the shared config file in your editor or default app',
    openConfigFileFailed: 'Could not open config.json.',
    systemDefault: 'System default',
    openOnStartup: 'Open on startup',
    showAppIcons: 'Show real app icons',
    deleteFilesFromDiskByDefault: 'Delete files from disk by default',
    addCustomEditor: 'Add custom editor',
    addCustomTerminal: 'Add custom terminal',
    projects: 'Projects',
    reorder: 'Reorder',
    done: 'Done',
    searchProjects: 'Search projects',
    clearSearch: 'Clear search',
    noProjectsYet: 'No projects added yet.',
    noProjectsFound: 'No projects found.',
    clickToAddProject: 'Click + to add a new project.',
    adjustSearchOrAddProject: 'Try another search or add a new project.',
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
    selectProjectDefaults: 'Select defaults',
    reload: 'Reload',
    reloadToolList: 'Reload editors and terminals',
    advanced: 'Advanced',
    migrateLegacyData: 'Migrate legacy data',
    migrationPreviewFound: 'Legacy data found: {{projects}} projects',
    migrationPreviewNone: 'No legacy data found',
    invalidEditor: 'Invalid editor',
    invalidTerminal: 'Invalid terminal',
    invalidValues: 'Invalid values',
    cli: 'CLI',
    installCli: 'Install',
    reinstallCli: 'Reinstall',
    uninstallCli: 'Uninstall',
    cliInstalled: 'tlink command is available in your terminal',
    cliNotInstalled: 'Install tlink to use from any terminal',
    cliInstallError: 'Failed to install CLI: {{error}}',
    updates: 'Updates',
    checkForUpdates: 'Check for updates',
    installUpdate: 'Install update',
    currentVersion: 'Current version',
    latestVersion: 'Latest version',
    viewReleaseNotes: 'View release',
    updaterUnsupported: 'In-app updates are only available on macOS.',
    updaterChecking: 'Checking for updates…',
    updaterUpToDate: 'Tray Link is up to date.',
    updaterAvailable: 'Version {{version}} is available to install.',
    updaterInstalling: 'Installing update… Tray Link will restart when ready.',
    updaterInstalled: 'Update installed. Tray Link will restart now.',
    updaterError: 'Update failed: {{error}}',
  },
  pt: {
    settings: 'Configurações',
    language: 'Idioma',
    defaultEditor: 'Editor padrão',
    defaultTerminal: 'Terminal padrão',
    openConfigFile: 'Abrir config.json',
    openConfigFileDescription: 'Abrir o arquivo de configuração compartilhado no editor ou app padrão',
    openConfigFileFailed: 'Não foi possível abrir o config.json.',
    systemDefault: 'Padrão do sistema',
    openOnStartup: 'Abrir na inicialização',
    showAppIcons: 'Mostrar ícones reais dos apps',
    deleteFilesFromDiskByDefault: 'Excluir arquivos do disco por padrão',
    addCustomEditor: 'Adicionar editor personalizado',
    addCustomTerminal: 'Adicionar terminal personalizado',
    projects: 'Projetos',
    reorder: 'Reordenar',
    done: 'Concluir',
    searchProjects: 'Buscar projetos',
    clearSearch: 'Limpar busca',
    noProjectsYet: 'Nenhum projeto adicionado ainda.',
    noProjectsFound: 'Nenhum projeto encontrado.',
    clickToAddProject: 'Clique em + para adicionar um projeto.',
    adjustSearchOrAddProject: 'Tente outra busca ou adicione um novo projeto.',
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
    selectProjectDefaults: 'Selecionar padrões',
    reload: 'Recarregar',
    reloadToolList: 'Recarregar lista de editores e terminais',
    advanced: 'Avançado',
    migrateLegacyData: 'Migrar dados legados',
    migrationPreviewFound: 'Dados legados encontrados: {{projects}} projetos',
    migrationPreviewNone: 'Nenhum dado legado encontrado',
    invalidEditor: 'Editor inválido',
    invalidTerminal: 'Terminal inválido',
    invalidValues: 'Valores inválidos',
    cli: 'CLI',
    installCli: 'Instalar',
    reinstallCli: 'Reinstalar',
    uninstallCli: 'Desinstalar',
    cliInstalled: 'O comando tlink está disponível no seu terminal',
    cliNotInstalled: 'Instale o tlink para usar em qualquer terminal',
    cliInstallError: 'Falha ao instalar CLI: {{error}}',
    updates: 'Atualizações',
    checkForUpdates: 'Verificar atualizações',
    installUpdate: 'Instalar atualização',
    currentVersion: 'Versão atual',
    latestVersion: 'Versão mais recente',
    viewReleaseNotes: 'Ver release',
    updaterUnsupported: 'As atualizações no app estão disponíveis apenas no macOS.',
    updaterChecking: 'Verificando atualizações…',
    updaterUpToDate: 'O Tray Link já está atualizado.',
    updaterAvailable: 'A versão {{version}} está disponível para instalar.',
    updaterInstalling: 'Instalando atualização… O Tray Link será reiniciado quando estiver pronto.',
    updaterInstalled: 'Atualização instalada. O Tray Link será reiniciado agora.',
    updaterError: 'Falha na atualização: {{error}}',
  },
  es: {
    settings: 'Configuración',
    language: 'Idioma',
    defaultEditor: 'Editor predeterminado',
    defaultTerminal: 'Terminal predeterminado',
    openConfigFile: 'Abrir config.json',
    openConfigFileDescription: 'Abrir el archivo de configuración compartido en tu editor o app predeterminada',
    openConfigFileFailed: 'No se pudo abrir config.json.',
    systemDefault: 'Predeterminado del sistema',
    openOnStartup: 'Abrir al iniciar',
    showAppIcons: 'Mostrar iconos reales de las apps',
    deleteFilesFromDiskByDefault: 'Eliminar archivos del disco por defecto',
    addCustomEditor: 'Agregar editor personalizado',
    addCustomTerminal: 'Agregar terminal personalizado',
    projects: 'Proyectos',
    reorder: 'Reordenar',
    done: 'Listo',
    searchProjects: 'Buscar proyectos',
    clearSearch: 'Limpiar búsqueda',
    noProjectsYet: 'Aún no hay proyectos agregados.',
    noProjectsFound: 'No se encontraron proyectos.',
    clickToAddProject: 'Haz clic en + para agregar un proyecto.',
    adjustSearchOrAddProject: 'Prueba otra búsqueda o agrega un nuevo proyecto.',
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
    selectProjectDefaults: 'Seleccionar predeterminados',
    reload: 'Recargar',
    reloadToolList: 'Recargar lista de editores y terminales',
    advanced: 'Avanzado',
    migrateLegacyData: 'Migrar datos legados',
    migrationPreviewFound: 'Datos heredados encontrados: {{projects}} proyectos',
    migrationPreviewNone: 'No se encontraron datos heredados',
    invalidEditor: 'Editor inválido',
    invalidTerminal: 'Terminal inválido',
    invalidValues: 'Valores inválidos',
    cli: 'CLI',
    installCli: 'Instalar',
    reinstallCli: 'Reinstalar',
    uninstallCli: 'Desinstalar',
    cliInstalled: 'El comando tlink está disponible en tu terminal',
    cliNotInstalled: 'Instala tlink para usar desde cualquier terminal',
    cliInstallError: 'Error al instalar CLI: {{error}}',
    updates: 'Actualizaciones',
    checkForUpdates: 'Buscar actualizaciones',
    installUpdate: 'Instalar actualización',
    currentVersion: 'Versión actual',
    latestVersion: 'Última versión',
    viewReleaseNotes: 'Ver release',
    updaterUnsupported: 'Las actualizaciones dentro de la app solo están disponibles en macOS.',
    updaterChecking: 'Buscando actualizaciones…',
    updaterUpToDate: 'Tray Link ya está actualizado.',
    updaterAvailable: 'La versión {{version}} está disponible para instalar.',
    updaterInstalling: 'Instalando actualización… Tray Link se reiniciará cuando esté listo.',
    updaterInstalled: 'Actualización instalada. Tray Link se reiniciará ahora.',
    updaterError: 'Error de actualización: {{error}}',
  },
}

export const resolveLocale = (): Locale => {
  // Synchronous fallback at module init time — language will be updated
  // asynchronously via syncI18nLanguageFromPreferences() once prefs are loaded.
  const locale = defaultUserPreferences.locale
  if (locale === 'pt' || locale === 'es') {
    return locale
  }
  return 'en'
}

const resources = {
  en: { translation: dictionaries.en },
  pt: { translation: dictionaries.pt },
  es: { translation: dictionaries.es },
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: resolveLocale(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })
}

export const syncI18nLanguageFromPreferences = async () => {
  const prefs = await loadPreferences()
  const locale = prefs.locale
  const nextLanguage = locale === 'pt' || locale === 'es' ? locale : 'en'
  if (i18n.language !== nextLanguage) {
    i18n.changeLanguage(nextLanguage)
  }
}

export const subscribeLanguageSync = (): EmitterSubscription => {
  return subscribePreferencesChange(() => {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: fail silently if syncing language from preferences fails for any reason, to avoid breaking other prefs functionality
    syncI18nLanguageFromPreferences().catch(() => {})
  })
}

export type { TranslationKey }
export { i18n }
