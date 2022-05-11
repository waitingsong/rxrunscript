import { join } from 'path'

import { initialMsgPrefixOpts, initialSpawnOpts } from './config'
import { ProcessOpts, RxRunFnArgs, RxSpawnOpts } from './types'


export interface ProcessOptsRet {
  command: string
  args: string[]
  spawnOpts: RxSpawnOpts
  errScript: string
}

export function processOpts(options: ProcessOpts): ProcessOptsRet {
  const { args, initialRxRunOpts } = options
  const spawnOpts: RxSpawnOpts = processSpawnOpts(initialRxRunOpts, options.spawnOpts)

  const cmd = processCommand(
    options.command,
    initialRxRunOpts.msgPrefixOpts.errPrefix,
    spawnOpts,
  )
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  const runArgs = args && args.length ? [...args] : []
  const errScript = runArgs.length
    ? `"${cmd} ${runArgs.join(' ')}"`
    : `"${cmd}"`

  return {
    command: cmd,
    args: runArgs,
    spawnOpts,
    errScript,
  }
}

function processSpawnOpts(
  defaultRxrunOpts: RxSpawnOpts,
  options?: RxRunFnArgs[2],
): RxSpawnOpts {

  const opts = (options ? { ...initialSpawnOpts, ...options } : initialSpawnOpts) as RxSpawnOpts
  opts.shell = true
  /* istanbul ignore next */
  if (process.platform === 'win32') {
    opts.windowsVerbatimArguments = true
  }

  /* istanbul ignore else */
  if (typeof opts.stderrMaxBufferSize !== 'number' || opts.stderrMaxBufferSize < 0) {
    opts.stderrMaxBufferSize = +defaultRxrunOpts.stderrMaxBufferSize
  }
  opts.msgPrefixOpts = { ...initialMsgPrefixOpts }

  return opts
}


function processCommand(
  command: string,
  errPrefix: string,
  spawnOpts: RxSpawnOpts,
): string {

  let cmd: string | URL = command ? command.trim() : ''
  if (! cmd) {
    throw new TypeError(`${errPrefix}\nRun command is blank`)
  }

  const cmdLead = cmd.slice(0, 3).replace(/\\/ug, '/')
  if (typeof cmd === 'string' && spawnOpts.cwd && typeof spawnOpts.cwd === 'string'
    && (cmdLead === '../' || cmdLead.startsWith('./'))) {
    cmd = join(spawnOpts.cwd, cmd)
  }

  if (typeof spawnOpts.maxCmdLength === 'number'
    && spawnOpts.maxCmdLength > 0
    && cmd.length > spawnOpts.maxCmdLength) {
    throw new TypeError(
      `${errPrefix}\nCommand length exceed ${spawnOpts.maxCmdLength}\n` + cmd.slice(1024) + ' ...',
    )
  }

  return cmd
}
