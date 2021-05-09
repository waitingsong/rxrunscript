import { interval } from 'rxjs'
import * as yargs from 'yargs'

import { take } from '../node_modules/rxjs/operators'


const args = yargs.argv._
const limit = +args[0]

if (Number.isNaN(limit)) {
  throw new Error('take number invaid')
}

interval(1000).pipe(
  take(limit),
)
  .subscribe(console.info)
