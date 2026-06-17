import { Ionicons } from '@expo/vector-icons'
import { Project } from '@tray-link/common-types'
import React, { useEffect, useState } from 'react'
import {
  GestureResponderHandlers,
  LayoutChangeEvent,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

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
    tagLabel: string
    editTagPlaceholder: string
    save: string
  }
  editMode?: boolean
  onLayout?: (event: LayoutChangeEvent) => void
  dragHandleProps?: GestureResponderHandlers
  isDragging?: boolean
  onToggleFavorite?: () => void
  onSaveTag?: (tag: string) => void
  allExistingTags?: string[]
}

export function parseTag(tag: string | undefined | null): { name: string; color?: string } {
  if (!tag?.trim()) {
    return { name: '' }
  }
  const parts = tag.trim().split('||')
  return {
    name: parts[0],
    color: parts[1] || undefined,
  }
}

export function getTagColors(color: string) {
  if (color.startsWith('#')) {
    const baseHex = color.length === 9 ? color.slice(0, 7) : color
    return {
      bg: `${baseHex}1F`,
      border: `${baseHex}40`,
      text: baseHex,
    }
  }
  if (color.startsWith('rgb')) {
    return {
      bg: color.replace(/rgb(a?)\(([^)]+)\)/, (match, isAlpha, values) => {
        const parts = values.split(',')
        if (parts.length === 4) {
          parts[3] = '0.12'
          return `rgba(${parts.join(',')})`
        }
        return `rgba(${values}, 0.12)`
      }),
      border: color.replace(/rgb(a?)\(([^)]+)\)/, (match, isAlpha, values) => {
        const parts = values.split(',')
        if (parts.length === 4) {
          parts[3] = '0.25'
          return `rgba(${parts.join(',')})`
        }
        return `rgba(${values}, 0.25)`
      }),
      text: color,
    }
  }
  return {
    bg: 'rgba(0, 122, 255, 0.12)',
    border: 'rgba(0, 122, 255, 0.25)',
    text: color || '#007AFF',
  }
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
  onToggleFavorite,
  onSaveTag,
  allExistingTags = [],
}: Props) => {
  const currentTagParsed = parseTag(project.tag)
  const [tagInput, setTagInput] = useState(currentTagParsed.name)
  const [selectedColor, setSelectedColor] = useState(currentTagParsed.color ?? '#007AFF')
  const [sessionCustomColors, setSessionCustomColors] = useState<string[]>([])
  const [showCustomColorInput, setShowCustomColorInput] = useState(false)
  const [customColorText, setCustomColorText] = useState('')
  const [showNewTagInput, setShowNewTagInput] = useState(false)

  useEffect(() => {
    const parsed = parseTag(project.tag)
    setTagInput(parsed.name)
    setSelectedColor(parsed.color ?? '#007AFF')
    setShowNewTagInput(false)
    setShowCustomColorInput(false)
    setCustomColorText('')
  }, [project.tag])

  const PRESET_COLORS = React.useMemo(
    () => [
      '#007AFF', // Blue
      '#34C759', // Green
      '#FF9500', // Orange
      '#FF3B30', // Red
      '#AF52DE', // Purple
      '#FFCC00', // Yellow
      '#5856D6', // Indigo
    ],
    [],
  )

  const customColors = React.useMemo(() => {
    const colors = new Set<string>()
    allExistingTags.forEach((tag) => {
      const parsed = parseTag(tag)
      if (parsed.color && !PRESET_COLORS.includes(parsed.color)) {
        colors.add(parsed.color)
      }
    })
    return Array.from(colors)
  }, [allExistingTags, PRESET_COLORS])

  const availableColors = React.useMemo(() => {
    const combined = [...PRESET_COLORS, ...customColors, ...sessionCustomColors]
    return Array.from(new Set(combined))
  }, [customColors, sessionCustomColors, PRESET_COLORS])

  const handleAddCustomColor = () => {
    const cleaned = customColorText.trim()
    if (cleaned) {
      if (cleaned.startsWith('#') || cleaned.startsWith('rgb')) {
        setSessionCustomColors((prev) => [...prev, cleaned])
        setSelectedColor(cleaned)
        setCustomColorText('')
        setShowCustomColorInput(false)
      }
    }
  }

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
          {project.tag
            ? (() => {
                const parsed = parseTag(project.tag)
                const colors = parsed.color ? getTagColors(parsed.color) : null
                return (
                  <View style={[styles.tagChip, colors && { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <Ionicons name="pricetag" size={9} color={colors ? colors.text : '#007AFF'} />
                    <Text style={[styles.tagChipText, colors && { color: colors.text }]}>{parsed.name}</Text>
                  </View>
                )
              })()
            : null}
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
        {onToggleFavorite ? (
          <TouchableOpacity
            accessibilityLabel={project.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            style={styles.button}
            onPress={onToggleFavorite}
          >
            <Ionicons
              name={project.isFavorite ? 'star' : 'star-outline'}
              size={14}
              color={project.isFavorite ? '#FFD700' : 'var(--text-color)'}
            />
          </TouchableOpacity>
        ) : null}
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

          <Text style={styles.contextTitle}>{labels.tagLabel}</Text>
          {project.tag ? (
            (() => {
              const parsed = parseTag(project.tag)
              const colors = parsed.color ? getTagColors(parsed.color) : null
              return (
                <View
                  style={[styles.tagChipActive, colors && { backgroundColor: colors.bg, borderColor: colors.border }]}
                >
                  <Ionicons name="pricetag" size={11} color={colors ? colors.text : '#007AFF'} />
                  <Text style={[styles.tagChipTextActive, colors && { color: colors.text }]}>{parsed.name}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setTagInput('')
                      onSaveTag?.('')
                    }}
                    style={styles.tagChipRemoveButton}
                    accessibilityLabel="Remove tag"
                  >
                    <Ionicons name="close-circle" size={14} color={colors ? colors.text : '#007AFF'} />
                  </TouchableOpacity>
                </View>
              )
            })()
          ) : showNewTagInput ? (
            <View style={styles.tagInputContainer}>
              <View style={styles.tagInputRow}>
                <TextInput
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder={labels.editTagPlaceholder}
                  placeholderTextColor="#8E8E93"
                  style={styles.tagInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.tagSaveButton}
                  onPress={() => {
                    if (tagInput.trim()) {
                      onSaveTag?.(`${tagInput.trim()}||${selectedColor}`)
                    }
                  }}
                >
                  <Text style={styles.tagSaveButtonText}>{labels.save}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tagRemoveButton}
                  onPress={() => {
                    setTagInput('')
                    setShowNewTagInput(false)
                    setShowCustomColorInput(false)
                    setCustomColorText('')
                  }}
                  accessibilityLabel="Cancel"
                >
                  <Ionicons name="close" size={14} color="var(--text-color)" />
                </TouchableOpacity>
              </View>

              <View style={styles.colorSelectorRow}>
                {availableColors.map((color) => {
                  const isSelected = selectedColor === color
                  const isCustom = !PRESET_COLORS.includes(color)
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorCircle, { backgroundColor: color }, isSelected && styles.colorCircleSelected]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {isSelected && <Ionicons name="checkmark" size={10} color="#FFF" />}
                      {isCustom && (
                        <View style={styles.customColorBadge}>
                          <Ionicons name="star" size={5} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}

                {showCustomColorInput ? (
                  <View style={styles.customColorInputWrapper}>
                    <TextInput
                      value={customColorText}
                      onChangeText={setCustomColorText}
                      placeholder="#HEX or rgb(a)"
                      placeholderTextColor="#8E8E93"
                      style={styles.customColorInput}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                      onSubmitEditing={handleAddCustomColor}
                    />
                    <TouchableOpacity style={styles.customColorInputSave} onPress={handleAddCustomColor}>
                      <Ionicons name="checkmark" size={12} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.customColorInputCancel}
                      onPress={() => {
                        setCustomColorText('')
                        setShowCustomColorInput(false)
                      }}
                    >
                      <Ionicons name="close" size={12} color="var(--text-color)" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addColorChipButton} onPress={() => setShowCustomColorInput(true)}>
                    <Ionicons name="add" size={10} color="#007AFF" />
                    <Ionicons name="color-palette-outline" size={10} color="#007AFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.tagChipsContainer}>
              {allExistingTags.map((tag) => {
                const parsed = parseTag(tag)
                const colors = parsed.color ? getTagColors(parsed.color) : null
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.selectableTagChip,
                      colors && { backgroundColor: colors.bg, borderColor: colors.border },
                    ]}
                    onPress={() => onSaveTag?.(tag)}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={9}
                      color={colors ? colors.text : 'var(--text-color)'}
                      style={{ opacity: colors ? 1 : 0.6 }}
                    />
                    <Text style={[styles.selectableTagChipText, colors && { color: colors.text }]}>{parsed.name}</Text>
                  </TouchableOpacity>
                )
              })}
              <TouchableOpacity
                style={styles.addTagChipButton}
                onPress={() => {
                  setTagInput('')
                  setSelectedColor('#007AFF')
                  setShowNewTagInput(true)
                }}
              >
                <Ionicons name="add" size={10} color="#007AFF" />
                <Text style={styles.addTagChipButtonText}>{labels.tagLabel}</Text>
              </TouchableOpacity>
            </View>
          )}
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
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.25)',
  },
  tagChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#007AFF',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  tagInputContainer: {
    marginTop: 4,
    marginBottom: 8,
    gap: 8,
  },
  colorSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  colorCircleSelected: {
    borderColor: '#FFF',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  customColorBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#007AFF',
    borderRadius: 999,
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#FFF',
  },
  customColorInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 4,
    height: 22,
  },
  customColorInput: {
    fontSize: 10,
    color: 'var(--text-color)',
    padding: 0,
    width: 120,
    height: '100%',
  },
  customColorInputSave: {
    padding: 2,
  },
  customColorInputCancel: {
    padding: 2,
  },
  addColorChipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    height: 18,
  },
  tagInput: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 0,
    fontSize: 11,
    color: 'var(--text-color)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    textAlignVertical: 'center',
    verticalAlign: 'middle',
  },
  tagSaveButton: {
    height: 28,
    borderRadius: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
  },
  tagSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  tagRemoveButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tagChipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.35)',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
  },
  tagChipTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
  },
  tagChipRemoveButton: {
    padding: 2,
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  selectableTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  selectableTagChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'var(--text-color)',
  },
  addTagChipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  addTagChipButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#007AFF',
  },
})
