import { interval } from 'rxjs'
import { take } from 'rxjs/operators'
import * as yargs from 'yargs'



const args = yargs.argv._
const limit = +args[0]

if (Number.isNaN(limit)) {
  throw new Error('take number invaid')
}

interval(1000).pipe(
  take(limit),
)
  .subscribe(console.info)
