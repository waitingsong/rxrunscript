// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { interval } from 'rxjs'
import { take } from 'rxjs/operators'
// eslint-disable-next-line node/no-unpublished-import
import yargs from 'yargs'


const args: (string|number)[] = typeof yargs.argv._ === 'object'
  ? yargs.argv._
  : []
const limit = args[0] ? +args[0] : 'fake'

if (Number.isNaN(limit)) {
  throw new Error('take number invaid')
}

interval(1000).pipe(
  take(limit as number),
)
  .subscribe(console.info)
