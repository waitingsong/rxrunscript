import { ChildProcess } from 'child_process'

import { fromEvent, Observable } from 'rxjs'
import { shareReplay, take, takeUntil } from 'rxjs/operators'


export function bindStdoutData(
  stdout: ChildProcess['stdout'],
  takeUntilNotifier$: Observable<unknown>,
): Observable<Buffer> {

  if (! stdout) {
    throw new Error('stdout null')
  }

  const take$ = takeUntilNotifier$.pipe(take(1), shareReplay())
  const data$ = fromEvent(stdout, 'data').pipe(
    // tap(buf => console.info('stdout:', buf.toString())),
    takeUntil(take$),
  )

  return data$ as Observable<Buffer>
}
