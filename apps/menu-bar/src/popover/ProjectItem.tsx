import { Ionicons } from '@expo/vector-icons'
import { Project } from '@tray-link/common-types'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { Text } from '../components/Text'

type Props = {
  index: number
  project: Project
  onOpenEditor: () => void
  onOpenTerminal: () => void
  onOpenFinder: () => void
  onRemove: () => void
  onToggleContextMenu: () => void
  contextMenuOpen?: boolean
  editorOptions: Array<{ label: string; command: string }>
  terminalOptions: Array<{ label: string; command: string }>
  onOpenWithEditor: (command: string) => void
  onOpenWithTerminal: (command: string) => void
  labels: {
    moreActions: string
    openWithEditor: string
    openWithTerminal: string
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
  contextMenuOpen = false,
  editorOptions,
  terminalOptions,
  onOpenWithEditor,
  onOpenWithTerminal,
  labels,
  editMode = false,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: Props) => {
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
        </View>
        <Text style={styles.path} numberOfLines={1} ellipsizeMode="middle">
          {project.path}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity accessibilityLabel="Open in editor" style={styles.button} onPress={onOpenEditor}>
          <Ionicons name="code-slash-outline" size={14} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Open in terminal" style={styles.button} onPress={onOpenTerminal}>
          <Ionicons name="terminal-outline" size={14} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Open in finder" style={styles.button} onPress={onOpenFinder}>
          <Ionicons name="folder-open-outline" size={14} />
        </TouchableOpacity>
        {editMode ? (
          <>
            <TouchableOpacity
              accessibilityLabel="Move project up"
              disabled={!canMoveUp}
              style={[styles.button, !canMoveUp && styles.disabled]}
              onPress={onMoveUp}
            >
              <Ionicons name="arrow-up" size={14} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Move project down"
              disabled={!canMoveDown}
              style={[styles.button, !canMoveDown && styles.disabled]}
              onPress={onMoveDown}
            >
              <Ionicons name="arrow-down" size={14} />
            </TouchableOpacity>
          </>
        ) : null}
        <TouchableOpacity accessibilityLabel="Remove project" style={styles.button} onPress={onRemove}>
          <Ionicons name="trash-outline" size={14} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel={labels.moreActions} style={styles.button} onPress={onToggleContextMenu}>
          <Ionicons name="ellipsis-horizontal" size={14} />
        </TouchableOpacity>
      </View>

      {contextMenuOpen ? (
        <View style={styles.contextMenu}>
          <Text style={styles.contextTitle}>{labels.openWithEditor}</Text>
          <View style={styles.contextActions}>
            {editorOptions.map((option) => (
              <TouchableOpacity
                key={option.command}
                style={styles.contextActionButton}
                onPress={() => onOpenWithEditor(option.command)}
              >
                <Text style={styles.contextActionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.contextTitle}>{labels.openWithTerminal}</Text>
          <View style={styles.contextActions}>
            {terminalOptions.map((option) => (
              <TouchableOpacity
                key={option.command}
                style={styles.contextActionButton}
                onPress={() => onOpenWithTerminal(option.command)}
              >
                <Text style={styles.contextActionText}>{option.label}</Text>
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
  },
  migratedChip: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  migratedChipText: {
    fontSize: 9,
    fontWeight: '600',
    opacity: 0.7,
  },
  path: {
    fontSize: 11,
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  contextMenu: {
    marginTop: 10,
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
    gap: 6,
  },
  contextTitle: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.75,
  },
  contextActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  contextActionButton: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  contextActionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.45,
  },
})
