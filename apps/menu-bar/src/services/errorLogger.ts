import { appendErrorLog, getErrorLogPath } from '../../modules/storage-module/src'

type SerializableValue = null | string | number | boolean | SerializableValue[] | { [key: string]: SerializableValue }

export type ErrorLogEntry = {
  id: string
  timestamp: string
  source: string
  error: SerializableValue
  metadata?: SerializableValue
}

const globalScope = globalThis as typeof globalThis & {
  ErrorUtils?: {
    getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined
    setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void
  }
}

let globalHandlersInstalled = false

function toSerializable(value: unknown, depth = 0, seen = new WeakSet<object>()): SerializableValue {
  if (value == null) {
    return null
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (depth >= 6) {
    return '[MaxDepthExceeded]'
  }

  if (value instanceof Error) {
    const errorRecord = value as unknown as Record<string, unknown>
    const ownProperties = Object.fromEntries(
      Object.getOwnPropertyNames(value).map((key) => [key, toSerializable(errorRecord[key], depth + 1, seen)]),
    )

    return {
      type: 'Error',
      name: value.name,
      message: value.message,
      stack: value.stack ?? null,
      ...ownProperties,
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item, depth + 1, seen))
  }

  if (typeof value === 'function') {
    const callable = value as { name?: string }
    return `[Function ${callable.name || 'anonymous'}]`
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) {
      return '[Circular]'
    }

    seen.add(value as object)

    const entries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      toSerializable(nestedValue, depth + 1, seen),
    ])

    return Object.fromEntries(entries)
  }

  return String(value)
}

function createLogEntry(source: string, error: unknown, metadata?: Record<string, unknown>): ErrorLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
    source,
    error: toSerializable(error),
    metadata: metadata ? toSerializable(metadata) : undefined,
  }
}

export async function logError(source: string, error: unknown, metadata?: Record<string, unknown>): Promise<void> {
  const entry = createLogEntry(source, error, metadata)

  console.error(`[${source}]`, error)

  try {
    await appendErrorLog(JSON.stringify(entry))
  } catch (logWriteError) {
    console.error('[error-logger:write-failed]', logWriteError)
  }
}

export function installGlobalErrorLogging(): void {
  if (globalHandlersInstalled) {
    return
  }

  globalHandlersInstalled = true

  const previousHandler = globalScope.ErrorUtils?.getGlobalHandler?.()
  globalScope.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    void logError('global-js-error', error, { isFatal: Boolean(isFatal) })
    previousHandler?.(error, isFatal)
  })
}

export async function getErrorLogFilePath(): Promise<string | null> {
  try {
    return await getErrorLogPath()
  } catch {
    return null
  }
}
