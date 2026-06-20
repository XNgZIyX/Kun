import { memo, useCallback, useEffect, useRef } from 'react'
import { Send, Loader2, MessageSquare, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  useDesignAssistantStore,
  type DesignMessageBlock
} from '../../design/design-assistant-store'
import { useDesignWorkspaceStore } from '../../design/design-workspace-store'
import { buildDesignTurnPrompt } from '../../design/design-turn-prompt'

function DesignAIRailInner() {
  const { t } = useTranslation('common')
  const blocks = useDesignAssistantStore((s) => s.designBlocks)
  const input = useDesignAssistantStore((s) => s.designInput)
  const busy = useDesignAssistantStore((s) => s.designBusy)
  const target = useDesignAssistantStore((s) => s.designTarget)
  const setInput = useDesignAssistantStore((s) => s.setDesignInput)
  const sendMessage = useDesignAssistantStore((s) => s.sendDesignMessage)
  const clearConversation = useDesignAssistantStore((s) => s.clearDesignConversation)
  const workspaceRoot = useDesignWorkspaceStore((s) => s.workspaceRoot)

  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = timelineRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [blocks.length])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || busy || !workspaceRoot) return

    const store = useDesignWorkspaceStore.getState()
    const active = store.artifacts.find((a) => a.id === store.activeArtifactId) ?? null

    const prompt = buildDesignTurnPrompt({
      target: active?.kind === 'canvas' ? 'canvas' : 'html',
      mode: 'text',
      text,
      artifactRelativePath: active?.relativePath ?? '',
      workspaceRoot,
      customPrompt: store.generationPrompt || undefined,
      designContext: store.designContext
    })

    void sendMessage(text, prompt, workspaceRoot)
  }, [input, busy, workspaceRoot, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const targetLabel =
    target.type === 'new'
      ? t('designRailTargetNew')
      : target.type === 'html'
        ? `${t('designRailTargetIterate')}${target.title}`
        : t('designRailTargetCanvas')

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-500" strokeWidth={1.8} />
          <div>
            <div className="text-[13px] font-medium text-gray-800 dark:text-white/90">
              {t('designRailTitle')}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-white/50 truncate max-w-[260px]">
              {targetLabel}
            </div>
          </div>
        </div>
        <button
          onClick={clearConversation}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white/70"
          title={t('designRailClear')}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>

      <div ref={timelineRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {blocks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-[240px]">
              <MessageSquare className="mx-auto h-8 w-8 text-gray-300 dark:text-white/20" strokeWidth={1.2} />
              <p className="mt-2 text-[13px] text-gray-400 dark:text-white/40">
                {t('designRailEmpty')}
              </p>
            </div>
          </div>
        ) : (
          blocks.map((block) => <MessageBubble key={block.id} block={block} />)
        )}
        {busy && (
          <div className="flex items-center gap-2 text-[12px] text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('designRailThinking')}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-3 dark:border-white/10">
        <div className="flex items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('designRailPlaceholder')}
            className="min-h-[36px] max-h-[120px] flex-1 resize-none bg-transparent text-[13px] text-gray-800 outline-none placeholder:text-gray-400 dark:text-white/90 dark:placeholder:text-white/30"
            rows={1}
            disabled={busy}
          />
          <button
            onClick={handleSend}
            disabled={busy || !input.trim()}
            className="shrink-0 rounded-md bg-blue-500 p-1.5 text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}

const MessageBubble = memo(function MessageBubble({ block }: { block: DesignMessageBlock }) {
  const isUser = block.kind === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white/85'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{block.text}</div>
      </div>
    </div>
  )
})

export const DesignAIRail = memo(DesignAIRailInner)
