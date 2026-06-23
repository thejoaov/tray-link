import { Ionicons } from '@expo/vector-icons'
import { Project } from '@tray-link/common-types'
import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

import { AppIcon } from '../components'
import { Text } from '../components/Text'
import { ToolOption } from '../services/preferences'
import { getTagColors, parseTag } from './ProjectItem'
import SectionHeader from './SectionHeader'

const DEFAULT_TAG_COLOR = '#007AFF'
const MAX_RECENT_PROJECTS = 5
const BUBBLE_SIZE = 48
const TOOL_ICON_SIZE = 22

export const RECENT_SECTION_ID = 'header-recents'

type Props = {
  projects: Project[]
  recentLabel: string
  showAppIcons: boolean
  isCollapsed: boolean
  onToggleCollapsed: () => void
  editorOptionsByCommand: Map<string, ToolOption>
  terminalOptionsByCommand: Map<string, ToolOption>
  globalEditorCommand: string
  globalTerminalCommand: string
  onOpenRecent: (project: Project) => void
}

const resolveRecentToolOption = (
  project: Project,
  editorOptionsByCommand: Map<string, ToolOption>,
  terminalOptionsByCommand: Map<string, ToolOption>,
  globalEditorCommand: string,
  globalTerminalCommand: string,
): ToolOption | null => {
  const lastOpenedTool = project.lastOpenedTool

  if (lastOpenedTool?.type === 'editor') {
    return editorOptionsByCommand.get(lastOpenedTool.command) ?? editorOptionsByCommand.get(globalEditorCommand) ?? null
  }

  if (lastOpenedTool?.type === 'terminal') {
    return (
      terminalOptionsByCommand.get(lastOpenedTool.command) ??
      terminalOptionsByCommand.get(globalTerminalCommand) ??
      null
    )
  }

  return editorOptionsByCommand.get(project.defaultEditor ?? globalEditorCommand) ?? null
}

type RecentProjectBubbleProps = {
  project: Project
  showAppIcons: boolean
  toolOption: ToolOption | null
  onPress: () => void
}

const RecentProjectBubble = ({ project, showAppIcons, toolOption, onPress }: RecentProjectBubbleProps) => {
  const parsedTag = parseTag(project.tag)
  const tagColor = parsedTag.color ?? DEFAULT_TAG_COLOR
  const tagColors = getTagColors(tagColor)
  const fallbackIconName =
    project.lastOpenedTool?.type === 'terminal' ? ('terminal-outline' as const) : ('code-slash-outline' as const)

  return (
    <TouchableOpacity accessibilityLabel={project.name} onPress={onPress} style={styles.bubbleContainer}>
      <View
        style={[
          styles.bubbleCircle,
          {
            backgroundColor: tagColors.bg,
            borderColor: tagColors.border,
          },
        ]}
      >
        {showAppIcons && toolOption?.iconPath ? (
          <AppIcon
            uri={toolOption.iconPath}
            style={styles.toolIcon}
            fallback={
              <Ionicons name={toolOption.iconName ?? fallbackIconName} size={TOOL_ICON_SIZE} color={tagColors.text} />
            }
          />
        ) : (
          <Ionicons name={toolOption?.iconName ?? fallbackIconName} size={TOOL_ICON_SIZE} color={tagColors.text} />
        )}
      </View>
      <Text style={styles.bubbleName} numberOfLines={2}>
        {project.name}
      </Text>
    </TouchableOpacity>
  )
}

export const RecentProjects = ({
  projects,
  recentLabel,
  showAppIcons,
  isCollapsed,
  onToggleCollapsed,
  editorOptionsByCommand,
  terminalOptionsByCommand,
  globalEditorCommand,
  globalTerminalCommand,
  onOpenRecent,
}: Props) => {
  const recentProjects = useMemo(() => {
    return [...projects]
      .filter((project) => project.lastOpenedAt)
      .sort((left, right) => new Date(right.lastOpenedAt ?? 0).getTime() - new Date(left.lastOpenedAt ?? 0).getTime())
      .slice(0, MAX_RECENT_PROJECTS)
  }, [projects])

  if (recentProjects.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        label={recentLabel}
        onPress={onToggleCollapsed}
        accessoryRight={
          <View style={styles.collapseIconContainer}>
            <Ionicons
              name={isCollapsed ? 'chevron-forward-outline' : 'chevron-down-outline'}
              size={12}
              color="var(--text-color)"
              style={{ opacity: 0.6 }}
            />
          </View>
        }
      />
      {!isCollapsed ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {recentProjects.map((project) => {
            const toolOption = resolveRecentToolOption(
              project,
              editorOptionsByCommand,
              terminalOptionsByCommand,
              globalEditorCommand,
              globalTerminalCommand,
            )

            return (
              <RecentProjectBubble
                key={project.id}
                project={project}
                showAppIcons={showAppIcons}
                toolOption={toolOption}
                onPress={() => onOpenRecent(project)}
              />
            )
          })}
        </ScrollView>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  collapseIconContainer: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bubbleContainer: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  bubbleCircle: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIcon: {
    width: TOOL_ICON_SIZE,
    height: TOOL_ICON_SIZE,
    borderRadius: 6,
  },
  bubbleName: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    color: 'var(--text-color)',
  },
})
