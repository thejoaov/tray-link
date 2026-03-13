import { Ionicons } from '@expo/vector-icons'
import { Project } from '@tray-link/common-types'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { AppIcon } from '../components'
import { Text } from '../components/Text'

type ToolOption = {
  label: string
  command: string
  iconName?: 'code-slash-outline' | 'terminal-outline'
  iconPath?: string | null
}

type Props = {
  index: number
  project: Project
  onOpenEditor: () => void
  onOpenTerminal: () => void
  onOpenFinder: () => void
  onRemove: () => void
  onToggleContextMenu: () => void
  onCloseContextMenu: () => void
  contextMenuOpen?: boolean
  editorOptions: ToolOption[]
  terminalOptions: ToolOption[]
  editorQuickActionOption?: ToolOption | null
  terminalQuickActionOption?: ToolOption | null
  onOpenWithEditor: (command: string) => void
  onOpenWithTerminal: (command: string) => void
  onSelectProjectEditorDefault: (command: string) => void
  onSelectProjectTerminalDefault: (command: string) => void
  toolSelectionMode?: boolean
  onToggleProjectToolSelectionMode: () => void
  labels: {
    moreActions: string
    openWithEditor: string
    openWithTerminal: string
    selectProjectDefaults: string
    done: string
    close: string
  }
  editMode?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}

export const ProjectItem = ({
  index,
  project,
  onOpenEditor,
  onOpenTerminal,
  onOpenFinder,
  onRemove,
  onToggleContextMenu,
  onCloseContextMenu,
  contextMenuOpen = false,
  editorOptions,
  terminalOptions,
  editorQuickActionOption,
  terminalQuickActionOption,
  onOpenWithEditor,
  onOpenWithTerminal,
  onSelectProjectEditorDefault,
  onSelectProjectTerminalDefault,
  toolSelectionMode = false,
  onToggleProjectToolSelectionMode,
  labels,
  editMode = false,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: Props) => {
  const renderQuickActionIcon = (
    option: ToolOption | null | undefined,
    fallbackName: 'code-slash-outline' | 'terminal-outline',
  ) => {
    return (
      <AppIcon
        uri={option?.iconPath ?? ''}
        style={styles.quickActionIconImage}
        fallback={<Ionicons name={option?.iconName ?? fallbackName} size={14} color="var(--text-color)" />}
      />
    )
  }

  const renderOptionLabel = (label: string, selected: boolean) => {
    return selected ? `${label} *` : label
  }

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {index + 1}. {project.name}
          </Text>
          {project.migrated ? (
            <View style={styles.migratedChip}>
              <Text style={styles.migratedChipText}>migrated</Text>
            </View>
          ) : null}
          {project.source === 'cli' ? (
            <View style={styles.migratedChip}>
              <Text style={styles.migratedChipText}>cli</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.path} numberOfLines={1} ellipsizeMode="middle">
          {project.path}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity accessibilityLabel="Open in editor" style={styles.button} onPress={onOpenEditor}>
          {renderQuickActionIcon(editorQuickActionOption, 'code-slash-outline')}
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Open in terminal" style={styles.button} onPress={onOpenTerminal}>
          {renderQuickActionIcon(terminalQuickActionOption, 'terminal-outline')}
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Open in finder" style={styles.button} onPress={onOpenFinder}>
          <Ionicons name="folder-open-outline" size={14} color="var(--text-color)" />
        </TouchableOpacity>
        {editMode ? (
          <>
            <TouchableOpacity
              accessibilityLabel="Move project up"
              disabled={!canMoveUp}
              style={[styles.button, !canMoveUp && styles.disabled]}
              onPress={onMoveUp}
            >
              <Ionicons name="arrow-up" size={14} color="var(--text-color)" />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Move project down"
              disabled={!canMoveDown}
              style={[styles.button, !canMoveDown && styles.disabled]}
              onPress={onMoveDown}
            >
              <Ionicons name="arrow-down" size={14} color="var(--text-color)" />
            </TouchableOpacity>
          </>
        ) : null}
        <TouchableOpacity accessibilityLabel="Remove project" style={styles.button} onPress={onRemove}>
          <Ionicons name="trash-outline" size={14} color="var(--text-color)" />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel={labels.moreActions} style={styles.button} onPress={onToggleContextMenu}>
          <Ionicons name="ellipsis-horizontal" size={14} color="var(--text-color)" />
        </TouchableOpacity>
      </View>

      {contextMenuOpen ? (
        <View style={styles.contextMenu}>
          <View style={styles.contextMenuHeader}>
            <Text style={styles.contextMenuHeaderText}>{labels.moreActions}</Text>
            <View style={styles.contextMenuHeaderActions}>
              <TouchableOpacity style={styles.contextModeButton} onPress={onToggleProjectToolSelectionMode}>
                <Text style={styles.contextModeButtonText}>
                  {toolSelectionMode ? labels.done : labels.selectProjectDefaults}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel={labels.close}
                style={styles.contextCloseButton}
                onPress={onCloseContextMenu}
              >
                <Ionicons name="close" size={14} color="var(--text-color)" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.contextTitle}>{labels.openWithEditor}</Text>
          <View style={styles.contextActions}>
            {editorOptions.map((option) => (
              <TouchableOpacity
                key={option.command}
                style={styles.contextActionButton}
                onPress={() =>
                  toolSelectionMode ? onSelectProjectEditorDefault(option.command) : onOpenWithEditor(option.command)
                }
              >
                <AppIcon
                  uri={option.iconPath ?? ''}
                  style={styles.contextActionIconImage}
                  fallback={
                    <Ionicons name={option.iconName ?? 'code-slash-outline'} size={12} color="var(--text-color)" />
                  }
                />
                <Text style={styles.contextActionText}>
                  {renderOptionLabel(option.label, option.command === project.defaultEditor)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.contextTitle}>{labels.openWithTerminal}</Text>
          <View style={styles.contextActions}>
            {terminalOptions.map((option) => (
              <TouchableOpacity
                key={option.command}
                style={styles.contextActionButton}
                onPress={() =>
                  toolSelectionMode
                    ? onSelectProjectTerminalDefault(option.command)
                    : onOpenWithTerminal(option.command)
                }
              >
                <AppIcon
                  uri={option.iconPath ?? ''}
                  style={styles.contextActionIconImage}
                  fallback={
                    <Ionicons name={option.iconName ?? 'terminal-outline'} size={12} color="var(--text-color)" />
                  }
                />
                <Text style={styles.contextActionText}>
                  {renderOptionLabel(option.label, option.command === project.defaultTerminal)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  info: {
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: 'var(--text-color)',
  },
  migratedChip: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  migratedChipText: {
    fontSize: 9,
    fontWeight: '600',
    opacity: 0.7,
    color: 'var(--text-color)',
  },
  path: {
    fontSize: 11,
    opacity: 0.6,
    color: 'var(--text-color)',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconImage: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  contextMenu: {
    marginTop: 10,
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  contextMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  contextMenuHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.75,
    color: 'var(--text-color)',
  },
  contextMenuHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextModeButton: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  contextCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  contextModeButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'var(--text-color)',
  },
  contextTitle: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.75,
    color: 'var(--text-color)',
  },
  contextActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  contextActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  contextActionIconImage: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  contextActionText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'var(--text-color)',
  },
  disabled: {
    opacity: 0.45,
  },
})
