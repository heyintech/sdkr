import { scaffoldCollection } from './collection.mjs'

function printUsage() {
  console.log(`Usage:
  sdkr collection <targetPath> [--template minimal|example]

Commands:
  collection   Generate an API collection scaffold in a project-relative directory

Options:
  --example    Shortcut for "--template example"
  --help       Show this help message

Notes:
  - <targetPath> must be relative to the Nuxt app root.
  - The collection name defaults to the last path segment.
  - The default clientPrefix is "/<name>".`)
}

function parseCollectionArgs(argv) {
  let targetPath = ''
  let template = 'minimal'

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help') {
      return { help: true }
    }

    if (arg === '--example') {
      template = 'example'
      continue
    }

    if (arg === '--template') {
      const value = argv[index + 1]
      if (!value) {
        throw new Error('[sdkr] Missing value for "--template".')
      }
      template = value
      index += 1
      continue
    }

    if (arg.startsWith('--template=')) {
      template = arg.slice('--template='.length)
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`[sdkr] Unknown option "${arg}".`)
    }

    if (targetPath) {
      throw new Error('[sdkr] Only one target path is supported.')
    }

    targetPath = arg
  }

  if (template !== 'minimal' && template !== 'example') {
    throw new Error('[sdkr] "--template" must be "minimal" or "example".')
  }

  return {
    help: false,
    targetPath,
    template,
  }
}

async function main() {
  const [, , command, ...rest] = process.argv

  if (!command || command === '--help' || command === '-h') {
    printUsage()
    return
  }

  if (command !== 'collection') {
    throw new Error(`[sdkr] Unknown command "${command}".`)
  }

  const args = parseCollectionArgs(rest)
  if (args.help) {
    printUsage()
    return
  }

  if (!args.targetPath) {
    throw new Error(
      '[sdkr] Missing target path. Example: "sdkr collection modules/demo-api".',
    )
  }

  const result = await scaffoldCollection({
    targetPath: args.targetPath,
    template: args.template,
  })

  console.log(
    `[sdkr] Using collection name "${result.name}" derived from the last segment of "${result.targetPath}".`,
  )
  console.log(`[sdkr] Using clientPrefix "${result.clientPrefix}".`)
  console.log(`[sdkr] Template: ${result.template}.`)
  console.log('[sdkr] Created files:')
  result.createdFiles.forEach((file) => {
    console.log(`  ${file}`)
  })
  console.log(
    `[sdkr] Add "${result.targetPath}" to "sdkr.collections" in your nuxt.config when you want this collection to be loaded.`,
  )
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
