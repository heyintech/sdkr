import { lstat, mkdir, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'

const TYPESCRIPT_FILE_RE = /\.[cm]?[jt]sx?$/i

function trimTrailingSeparators(value) {
  return value.replace(/[\\/]+$/, '')
}

function isOutsideRoot(relativePath) {
  return (
    relativePath === '..'
    || relativePath.startsWith(`..${sep}`)
    || isAbsolute(relativePath)
  )
}

function toCollectionFileContent(name, clientPrefix) {
  return [
    `import { defineApiCollection } from '@heyintech/sdkr'`,
    '',
    'export default defineApiCollection({',
    `  name: ${JSON.stringify(name)},`,
    '  routeGroups: [',
    '    {',
    `      dir: 'runtime/server',`,
    `      clientPrefix: ${JSON.stringify(clientPrefix)},`,
    '    },',
    '  ],',
    '})',
    '',
  ].join('\n')
}

function toExampleHandlerContent() {
  return [
    `import { getQuery } from 'h3'`,
    '',
    'export interface CallaMeta {',
    '  query: {',
    '    name?: string',
    '  }',
    '  res: {',
    '    message: string',
    '  }',
    '}',
    '',
    'export default defineEventHandler((event) => {',
    '  const query = getQuery(event)',
    `  const name = typeof query.name === 'string' ? query.name : 'sdkr'`,
    '',
    '  return {',
    '    message: `Hello, ${name}!`,',
    `  } satisfies CallaMeta['res']`,
    '})',
    '',
  ].join('\n')
}

export function deriveCollectionName(targetPath) {
  const normalizedPath = trimTrailingSeparators(targetPath.trim())
  const name = basename(normalizedPath)

  if (!name || name === '.' || name === sep) {
    throw new Error('[sdkr] Target path must end with a directory name.')
  }

  if (TYPESCRIPT_FILE_RE.test(name)) {
    throw new Error(
      '[sdkr] Target path must be a directory path, not a TypeScript file path.',
    )
  }

  return name
}

export function resolveTargetDirectory(targetPath, rootDir = process.cwd()) {
  const trimmedTargetPath = targetPath.trim()

  if (!trimmedTargetPath) {
    throw new Error('[sdkr] Missing target path. Pass a project-relative directory path.')
  }

  if (isAbsolute(trimmedTargetPath)) {
    throw new Error('[sdkr] Target path must be relative to the Nuxt app root.')
  }

  const resolvedTarget = resolve(rootDir, trimmedTargetPath)
  const relativeTarget = relative(rootDir, resolvedTarget)

  if (isOutsideRoot(relativeTarget)) {
    throw new Error('[sdkr] Target path must stay inside the Nuxt app root.')
  }

  return {
    name: deriveCollectionName(trimmedTargetPath),
    resolvedTarget,
    relativeTarget: relativeTarget || '.',
  }
}

export async function assertTargetDirectoryIsWritable(targetDir, targetLabel) {
  try {
    const stats = await lstat(targetDir)

    if (!stats.isDirectory()) {
      throw new Error(
        `[sdkr] Target "${targetLabel}" already exists and is not a directory.`,
      )
    }

    const entries = await readdir(targetDir)
    if (entries.length > 0) {
      throw new Error(
        `[sdkr] Target "${targetLabel}" already exists and is not empty.`,
      )
    }
  }
  catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return
    }
    throw error
  }
}

export function buildCollectionFiles({ name, clientPrefix, template }) {
  const files = [
    {
      relativePath: 'collection.ts',
      contents: toCollectionFileContent(name, clientPrefix),
    },
    {
      relativePath: 'runtime/server/.gitkeep',
      contents: '',
    },
  ]

  if (template === 'example') {
    files.push({
      relativePath: 'runtime/server/hello.get.ts',
      contents: toExampleHandlerContent(),
    })
  }

  return files
}

export async function scaffoldCollection({
  targetPath,
  template = 'minimal',
  rootDir = process.cwd(),
}) {
  const target = resolveTargetDirectory(targetPath, rootDir)
  const clientPrefix = `/${target.name}`
  const files = buildCollectionFiles({
    name: target.name,
    clientPrefix,
    template,
  })

  await assertTargetDirectoryIsWritable(target.resolvedTarget, target.relativeTarget)
  await mkdir(target.resolvedTarget, { recursive: true })

  const createdFiles = []

  for (const file of files) {
    const absolutePath = resolve(target.resolvedTarget, file.relativePath)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, file.contents, 'utf8')
    createdFiles.push(relative(rootDir, absolutePath) || '.')
  }

  return {
    clientPrefix,
    createdFiles,
    name: target.name,
    targetPath: target.relativeTarget,
    template,
  }
}
