import { Ionicons } from '@expo/vector-icons'
import { Project } from '@tray-link/common-types'
import React from 'react'
import { GestureResponderHandlers, LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native'

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
  globalEditorCommand?: string | null
  globalTerminalCommand?: string | null
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
  onLayout?: (event: LayoutChangeEvent) => void
  dragHandleProps?: GestureResponderHandlers
  isDragging?: boolean
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
  globalEditorCommand,
  globalTerminalCommand,
  toolSelectionMode = false,
  onToggleProjectToolSelectionMode,
  labels,
  editMode = false,
  onLayout,
  dragHandleProps,
  isDragging = false,
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

  const renderOptionLabel = (label: string, globalDefault: boolean) => {
    return globalDefault ? `${label} *` : label
  }

  return (
    <View onLayout={onLayout} style={[styles.container, isDragging && styles.draggingContainer]}>
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
          <View
            style={[styles.button, styles.dragHandleButton, isDragging && styles.dragHandleButtonActive]}
            {...dragHandleProps}
          >
            <Ionicons name="reorder-three-outline" size={16} color="var(--text-color)" />
          </View>
        ) : null}
        <TouchableOpacity accessibilityLabel="Remove project" style={styles.button} onPress={onRemove}>
          <Ionicons name="trash-outline" size={14} color="var(--text-color)" />
        </TouchableOpacity>
        {!editMode ? (
          <TouchableOpacity accessibilityLabel={labels.moreActions} style={styles.button} onPress={onToggleContextMenu}>
            <Ionicons name="ellipsis-horizontal" size={14} color="var(--text-color)" />
          </TouchableOpacity>
        ) : null}
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
                style={[
                  styles.contextActionButton,
                  option.command === project.defaultEditor && styles.contextActionButtonProjectDefault,
                ]}
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
                  {renderOptionLabel(option.label, option.command === globalEditorCommand)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.contextTitle}>{labels.openWithTerminal}</Text>
          <View style={styles.contextActions}>
            {terminalOptions.map((option) => (
              <TouchableOpacity
                key={option.command}
                style={[
                  styles.contextActionButton,
                  option.command === project.defaultTerminal && styles.contextActionButtonProjectDefault,
                ]}
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
                  {renderOptionLabel(option.label, option.command === globalTerminalCommand)}
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
  draggingContainer: {
    zIndex: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.8)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 8,
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
  dragHandleButton: {
    minWidth: 30,
  },
  dragHandleButtonActive: {
    backgroundColor: 'rgba(125, 211, 252, 0.22)',
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contextActionButtonProjectDefault: {
    borderColor: 'rgba(125, 211, 252, 0.9)',
    backgroundColor: 'rgba(125, 211, 252, 0.12)',
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
