import type { DesignArtifact } from './design-types'
import { createDesignArtifactId } from './design-types'

export type GroupedDesignArtifacts = {
  html: DesignArtifact[]
  graph: DesignArtifact[]
  canvas: DesignArtifact[]
}

export function groupDesignArtifacts(artifacts: readonly DesignArtifact[]): GroupedDesignArtifacts {
  return artifacts.reduce<GroupedDesignArtifacts>(
    (groups, artifact) => {
      if (artifact.kind === 'graph') groups.graph.push(artifact)
      else if (artifact.kind === 'canvas') groups.canvas.push(artifact)
      else groups.html.push(artifact)
      return groups
    },
    { html: [], graph: [], canvas: [] }
  )
}

export function canImplementDesignArtifact(
  artifact: DesignArtifact | null | undefined
): artifact is DesignArtifact & { kind: 'html' } {
  return artifact?.kind === 'html'
}

type GraphOutputFileApi = {
  readWorkspaceFile: (options: { path: string; workspaceRoot: string }) => Promise<
    | { ok: true; content: string }
    | { ok: false; message: string }
  >
  writeWorkspaceFile: (payload: { path: string; workspaceRoot: string; content: string }) => Promise<
    | { ok: true }
    | { ok: false; message: string }
  >
}

export type PromoteGraphOutputOptions = {
  api: GraphOutputFileApi
  workspaceRoot: string
  outputRelativePath: string
  title?: string
  createId?: () => string
  now?: () => Date
}

export type PromoteGraphOutputResult =
  | { ok: true; artifact: DesignArtifact }
  | { ok: false; message: string }

function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  return normalized.split('/').filter(Boolean).pop() ?? normalized
}

function isCompleteHtml(content: string): boolean {
  return content.trim().toLowerCase().endsWith('</html>')
}

export async function promoteGraphOutputToDesignArtifact(
  options: PromoteGraphOutputOptions
): Promise<PromoteGraphOutputResult> {
  const workspaceRoot = options.workspaceRoot.trim()
  const outputRelativePath = options.outputRelativePath.trim()
  if (!workspaceRoot || !outputRelativePath) {
    return { ok: false, message: 'Missing workspace or graph output path.' }
  }

  const read = await options.api.readWorkspaceFile({ path: outputRelativePath, workspaceRoot })
  if (!read.ok) return { ok: false, message: read.message }
  if (!isCompleteHtml(read.content)) {
    return { ok: false, message: 'Graph output is not a complete HTML document yet.' }
  }

  const artifactId = options.createId?.() ?? createDesignArtifactId()
  const createdAt = (options.now?.() ?? new Date()).toISOString()
  const relativePath = `.kun-design/${artifactId}/v1.html`
  const write = await options.api.writeWorkspaceFile({
    path: relativePath,
    workspaceRoot,
    content: read.content
  })
  if (!write.ok) return { ok: false, message: write.message }

  const title = options.title?.trim() || basename(outputRelativePath).replace(/\.html$/i, '') || 'Design draft'
  return {
    ok: true,
    artifact: {
      id: artifactId,
      kind: 'html',
      title,
      relativePath,
      createdAt,
      updatedAt: createdAt,
      versions: [{ id: `${artifactId}-v1`, relativePath, createdAt, summary: `Saved from ${outputRelativePath}` }]
    }
  }
}
