import { interval } from 'rxjs'
import { take } from 'rxjs/operators'
// eslint-disable-next-line node/no-unpublished-import
import yargs from 'yargs'


const args = yargs.argv._ as unknown
const limit = +args[0]

if (Number.isNaN(limit)) {
  throw new Error('take number invaid')
}

interval(1000).pipe(
  take(limit),
)
  .subscribe(console.info)
