import { ChildProcess } from 'child_process'

import { fromEvent, Observable, map } from 'rxjs'
import { shareReplay, take, takeUntil } from 'rxjs/operators'

import { OutputRow } from './types'


export function bindStdoutData(
  stdout: ChildProcess['stdout'],
  takeUntilNotifier$: Observable<unknown>,
): Observable<OutputRow> {

  if (! stdout) {
    throw new Error('stdout null')
  }

  const take$ = takeUntilNotifier$.pipe(take(1), shareReplay())
  const data$ = fromEvent(stdout, 'data').pipe(
    // tap(buf => console.info('stdout:', buf.toString())),
    map((data) => {
      return { data: data as Buffer }
    }),
    takeUntil(take$),
  )

  return data$
}
