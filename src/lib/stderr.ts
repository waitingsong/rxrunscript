import { fromEvent, NEVER, Observable } from 'rxjs'
import {
  buffer,
  filter,
  map,
  shareReplay,
  skipUntil,
  take,
  takeUntil,
} from 'rxjs/operators'


export function bindStderrData(
  stderr: NodeJS.ReadableStream,
  takeUntilNotifier$: Observable<any>,
  skipUntilNofifier$: Observable<any>,
  bufMaxSize: number,
): Observable<Buffer> {

  const take$ = takeUntilNotifier$.pipe(
    take(1),
    shareReplay(),
  )
  const skip$ = skipUntilNofifier$.pipe(
    take(1),
    shareReplay(1),
  )

  const event$ = bufMaxSize > 0
    ? fromEvent<Buffer>(stderr, 'data')
    : NEVER

  const data$ = event$.pipe(
    takeUntil(take$),
    take(bufMaxSize),
    // tap(buf => console.info('inner stderr1', buf.toString(), buf.byteLength)),
    buffer(take$),
    // buffer() may emit blank data, so filter
    filter(arr => arr && arr.length > 0 ? true : false),
    // map(Buffer.concat), // !! works not output empty array
    map(arr => Buffer.concat(arr)),
  )

  const ret$ = data$.pipe(
    skipUntil<Buffer>(skip$),
  )

  return ret$
}
