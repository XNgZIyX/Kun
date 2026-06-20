import { describe, expect, it, vi } from 'vitest'
import type { DesignArtifact } from './design-types'
import {
  canImplementDesignArtifact,
  groupDesignArtifacts,
  promoteGraphOutputToDesignArtifact
} from './design-artifact-actions'
import { useDesignWorkspaceStore } from './design-workspace-store'
import { applyGraphComposerPrompt, starterDesignGraph } from './design-graph'

function artifact(id: string, kind: DesignArtifact['kind']): DesignArtifact {
  const createdAt = '2026-06-20T00:00:00.000Z'
  const relativePath = kind === 'graph' ? `.kun-design/${id}/graph.json` : `.kun-design/${id}/v1.html`
  return {
    id,
    kind,
    title: id,
    relativePath,
    createdAt,
    updatedAt: createdAt,
    versions: [{ id: `${id}-v1`, relativePath, createdAt, summary: '' }]
  }
}

describe('design artifact actions', () => {
  it('groups HTML drafts separately from node canvases while preserving order', () => {
    const first = artifact('first-html', 'html')
    const graph = artifact('graph', 'graph')
    const second = artifact('second-html', 'html')

    expect(groupDesignArtifacts([first, graph, second])).toEqual({
      html: [first, second],
      graph: [graph],
      canvas: []
    })
  })

  it('only allows HTML design artifacts to be implemented directly', () => {
    expect(canImplementDesignArtifact(artifact('draft', 'html'))).toBe(true)
    expect(canImplementDesignArtifact(artifact('canvas', 'graph'))).toBe(false)
    expect(canImplementDesignArtifact(null)).toBe(false)
  })

  it('promotes a complete graph HTML output into a new HTML artifact', async () => {
    const readWorkspaceFile = vi.fn(async () => ({
      ok: true as const,
      content: '<!doctype html><html><body>Done</body></html>'
    }))
    const writeWorkspaceFile = vi.fn(async () => ({ ok: true as const }))

    const result = await promoteGraphOutputToDesignArtifact({
      api: { readWorkspaceFile, writeWorkspaceFile },
      workspaceRoot: '/repo',
      outputRelativePath: '.kun-design/graph/node.html',
      title: 'Node output',
      createId: () => 'promoted',
      now: () => new Date('2026-06-20T01:02:03.000Z')
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.artifact).toMatchObject({
      id: 'promoted',
      kind: 'html',
      title: 'Node output',
      relativePath: '.kun-design/promoted/v1.html'
    })
    expect(writeWorkspaceFile).toHaveBeenCalledWith({
      path: '.kun-design/promoted/v1.html',
      workspaceRoot: '/repo',
      content: '<!doctype html><html><body>Done</body></html>'
    })
  })

  it('does not promote incomplete graph output', async () => {
    const result = await promoteGraphOutputToDesignArtifact({
      api: {
        readWorkspaceFile: vi.fn(async () => ({ ok: true as const, content: '<html><body>Still writing' })),
        writeWorkspaceFile: vi.fn(async () => ({ ok: true as const }))
      },
      workspaceRoot: '/repo',
      outputRelativePath: '.kun-design/graph/node.html',
      createId: () => 'unused'
    })

    expect(result).toEqual({
      ok: false,
      message: 'Graph output is not a complete HTML document yet.'
    })
  })

  it('keeps the starter graph scoped to a node-canvas document', () => {
    const graph = starterDesignGraph()

    expect(graph.version).toBe(1)
    expect(graph.nodes.map((node) => node.data.kind)).toEqual(['prompt', 'design'])
    expect(graph.edges).toHaveLength(1)
    expect(graph.edges[0]).toMatchObject({
      source: graph.nodes[0].id,
      target: graph.nodes[1].id
    })
  })

  it('fills the empty starter prompt from the graph composer without changing the edge', () => {
    const graph = starterDesignGraph()
    const result = applyGraphComposerPrompt(graph, 'Build a compact pricing page')

    expect(result.nodes).toHaveLength(2)
    expect(result.nodes[0]).toMatchObject({
      id: graph.nodes[0].id,
      data: { kind: 'prompt', brief: 'Build a compact pricing page' }
    })
    expect(result.nodes[1]).toMatchObject({
      id: graph.nodes[1].id,
      data: { kind: 'design', brief: '' }
    })
    expect(result.edges).toEqual(graph.edges)
    expect(graph.nodes[0].data.brief).toBe('')
  })

  it('appends a new prompt-to-design chain when the graph has no empty starter chain', () => {
    const graph = applyGraphComposerPrompt(starterDesignGraph(), 'Existing brief')
    const result = applyGraphComposerPrompt(graph, 'Second brief', {
      createNodeId: vi.fn()
        .mockReturnValueOnce('prompt-next')
        .mockReturnValueOnce('design-next')
    })

    expect(result.nodes.map((node) => node.id)).toEqual([
      graph.nodes[0].id,
      graph.nodes[1].id,
      'prompt-next',
      'design-next'
    ])
    expect(result.nodes[2]).toMatchObject({
      position: { x: 80, y: 324 },
      data: { kind: 'prompt', brief: 'Second brief' }
    })
    expect(result.nodes[3]).toMatchObject({
      position: { x: 400, y: 324 },
      data: { kind: 'design', brief: '' }
    })
    expect(result.edges.at(-1)).toEqual({
      id: 'prompt-next-design-next',
      source: 'prompt-next',
      target: 'design-next'
    })
    expect(result.nodes[0].data.brief).toBe('Existing brief')
  })

  it('does not expose retired design agent panel visibility state', () => {
    expect(useDesignWorkspaceStore.getState()).not.toHaveProperty('agentPanelOpen')
    expect(useDesignWorkspaceStore.getState()).not.toHaveProperty('setAgentPanelOpen')
  })
})
