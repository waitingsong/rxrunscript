import { SpawnOptions } from 'child_process'

import { join } from '../shared/index'

import { initialMsgPrefixOpts, initialSpawnOpts } from './config'


export function processOpts(
  command: string,
  args?: ReadonlyArray<string> | null,
  options?: SpawnOptions | null,
  stderrMaxBufferSize?: number,
) {

  const { errPrefix } = initialMsgPrefixOpts

  command = command ? command.trim() : ''
  /* istanbul ignore else */
  if (!command) {
    throw new TypeError(`${errPrefix}\nRun command is blank`)
  }
  command = command.replace(/\\/g, '/').trimLeft()

  const spawnOpts = options ? { ...initialSpawnOpts, ...options } : initialSpawnOpts

  spawnOpts.shell = true
  /* istanbul ignore else */
  if (process.platform === 'win32') {
    spawnOpts.windowsVerbatimArguments = true

    /* istanbul ignore else */
    if (command.slice(0, 2) === './' || command.slice(0, 3) === '../') {
      const arr = command.split(' ')

      arr[0] = join(<string> spawnOpts.cwd, arr[0])
      command = arr.join(' ')
    }
  }

  const runArgs = args && args.length ? [...args] : []

  const errScript = `"${command} ${runArgs.join(' ')}"`
  const maxBufferSize = typeof stderrMaxBufferSize === 'number' && stderrMaxBufferSize > 0
    ? +stderrMaxBufferSize
    : 0
  const runSpawnOpts = { command, runArgs, spawnOpts }

  return {
    errScript,
    maxBufferSize,
    runSpawnOpts,
  }
}
