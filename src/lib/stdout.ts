import { fromEvent, Observable } from 'rxjs'
import { shareReplay, take, takeUntil } from 'rxjs/operators'


export function bindStdoutData(
  stdout: NodeJS.ReadableStream,
  takeUntilNotifier$: Observable<any>,
): Observable<Buffer> {

  const take$ = takeUntilNotifier$.pipe(take(1), shareReplay())
  const data$ = fromEvent<Buffer>(stdout, 'data').pipe(
    // tap(buf => console.info('stdout:', buf.toString())),
    takeUntil(take$),
  )

  return data$
}
