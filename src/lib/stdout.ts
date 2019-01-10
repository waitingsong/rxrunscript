import { fromEvent, Observable } from 'rxjs'
import { takeUntil } from 'rxjs/operators'


export function bindStdoutData(
  stdout: NodeJS.ReadableStream,
  takeUntilNotifier$: Observable<any>,
): Observable<Buffer> {

  const data$ = fromEvent<Buffer>(stdout, 'data').pipe(
    takeUntil(takeUntilNotifier$),
    // tap(buf => console.info('stdout:', buf.toString())),
  )
  return data$
}
