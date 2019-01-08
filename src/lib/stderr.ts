import { fromEvent, of, EMPTY, NEVER, Observable } from 'rxjs'
import { buffer, filter, map, mergeMap, take, takeUntil } from 'rxjs/operators'


export function bindStderrData(
  stderr: NodeJS.ReadableStream,
  bufMaxSize: number,
  closingNotifier$: Observable<any>,
): Observable<Buffer> {

  let data$: Observable<Buffer> = NEVER

  /* istanbul ignore else */
  if (bufMaxSize > 0) {
    data$ = fromEvent<Buffer>(stderr, 'data').pipe(
      take(bufMaxSize),
      // tap(buf => console.log('inner stderr', buf.toString())),
      buffer(closingNotifier$),
      filter(arr => arr.length > 0),
      // map(Buffer.concat), // !! works not output empty array
      map(arr => Buffer.concat(arr)),
      mergeMap(buf => {
        const buf$ = closingNotifier$.pipe(
          mergeMap(([code]) => {
            return code === 0 || code === null ? EMPTY : of(buf)
          }),
        )
        return buf$
      }),
    )
  }

  return data$.pipe(
    takeUntil(closingNotifier$),  // for NEVER
  )
}
