import assert from 'node:assert'

import minimist from 'minimist'
import { interval, take } from 'rxjs'


const argv = minimist(process.argv.slice(2))

assert(argv, 'argv invalid')
const count = (argv.count as string || undefined) ?? 'fake'
const limit = +count

if (Number.isNaN(limit)) {
  throw new Error('take number invaid')
}

interval(1000).pipe(
  take(limit as number),
)
  .subscribe(console.info)
