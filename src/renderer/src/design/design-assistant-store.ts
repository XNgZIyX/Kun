import { create } from 'zustand'
import { getProvider } from '../agent/registry'
import { rendererRuntimeClient } from '../agent/runtime-client'

export type DesignMessageBlock =
  | { kind: 'user'; id: string; text: string; createdAt: string }
  | { kind: 'assistant'; id: string; text: string; createdAt: string }

export type DesignTarget =
  | { type: 'new' }
  | { type: 'html'; artifactId: string; title: string }
  | { type: 'canvas'; artifactId: string }

type DesignAssistantState = {
  designThreadId: string | null
  designBlocks: DesignMessageBlock[]
  designInput: string
  designBusy: boolean
  designTarget: DesignTarget

  setDesignInput: (text: string) => void
  setDesignTarget: (target: DesignTarget) => void
  clearDesignConversation: () => void
  ensureDesignThread: (workspaceRoot: string) => Promise<string>
  sendDesignMessage: (text: string, prompt: string, workspaceRoot: string) => Promise<void>
  appendBlock: (block: DesignMessageBlock) => void
}

const DESIGN_THREAD_KEY = 'kun.design-assistant.threadRegistry.v1'

function readDesignAssistantThreadId(workspaceRoot: string): string | null {
  try {
    const raw = localStorage.getItem(DESIGN_THREAD_KEY)
    if (!raw) return null
    const map = JSON.parse(raw) as Record<string, string>
    return map[workspaceRoot] ?? null
  } catch {
    return null
  }
}

function writeDesignAssistantThreadId(workspaceRoot: string, threadId: string): void {
  try {
    const raw = localStorage.getItem(DESIGN_THREAD_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    map[workspaceRoot] = threadId
    localStorage.setItem(DESIGN_THREAD_KEY, JSON.stringify(map))
  } catch {
    // non-fatal
  }
}

let nextBlockId = 0
function makeBlockId(): string {
  return `design-block-${++nextBlockId}`
}

export const useDesignAssistantStore = create<DesignAssistantState>((set, get) => ({
  designThreadId: null,
  designBlocks: [],
  designInput: '',
  designBusy: false,
  designTarget: { type: 'new' },

  setDesignInput: (text) => set({ designInput: text }),
  setDesignTarget: (target) => set({ designTarget: target }),

  clearDesignConversation: () =>
    set({ designBlocks: [], designThreadId: null, designBusy: false }),

  appendBlock: (block) =>
    set((s) => ({ designBlocks: [...s.designBlocks, block] })),

  ensureDesignThread: async (workspaceRoot) => {
    const existing = get().designThreadId
    if (existing) return existing

    const savedId = readDesignAssistantThreadId(workspaceRoot)
    if (savedId) {
      set({ designThreadId: savedId })
      return savedId
    }

    const provider = getProvider()
    const thread = await provider.createThread({
      workspace: workspaceRoot,
      title: 'Design Assistant'
    })
    const threadId = thread.id
    writeDesignAssistantThreadId(workspaceRoot, threadId)
    set({ designThreadId: threadId })
    return threadId
  },

  sendDesignMessage: async (text, prompt, workspaceRoot) => {
    const state = get()
    if (state.designBusy) return

    set({ designBusy: true, designInput: '' })
    state.appendBlock({
      kind: 'user',
      id: makeBlockId(),
      text,
      createdAt: new Date().toISOString()
    })

    try {
      const threadId = await get().ensureDesignThread(workspaceRoot)
      const provider = getProvider()
      const { turnId } = await provider.sendUserMessage(threadId, prompt, {
        displayText: text,
        mode: 'agent'
      })

      const sseStreamId = `design-rail-${threadId}-${turnId}`
      const { streamId } = await rendererRuntimeClient.startSse(threadId, 0, sseStreamId)

      let assistantText = ''
      const unsubscribe = rendererRuntimeClient.onSseEvent((payload) => {
        if (payload.streamId !== streamId) return
        for (const rawEvent of payload.events) {
          const event = rawEvent as { type?: string; delta?: string; text?: string }
          if (event.type === 'text_delta' && event.delta) {
            assistantText += event.delta
          } else if (event.type === 'turn_complete') {
            unsubscribe()
            rendererRuntimeClient.stopSse(streamId)
            get().appendBlock({
              kind: 'assistant',
              id: makeBlockId(),
              text: assistantText,
              createdAt: new Date().toISOString()
            })
            set({ designBusy: false })
          }
        }
      })
    } catch {
      set({ designBusy: false })
      get().appendBlock({
        kind: 'assistant',
        id: makeBlockId(),
        text: 'Failed to send design message.',
        createdAt: new Date().toISOString()
      })
    }
  }
}))
