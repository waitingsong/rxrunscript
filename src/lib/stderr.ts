import { ChildProcess } from 'child_process'
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
  stderr: ChildProcess['stderr'],
  takeUntilNotifier$: Observable<any>,
  skipUntilNofifier$: Observable<any>,
  bufMaxSize: number,
): Observable<Buffer> {

  if (! stderr) {
    throw new Error('stderr null')
  }

  const take$ = takeUntilNotifier$.pipe(
    take(1),
    shareReplay(),
  )
  const skip$ = skipUntilNofifier$.pipe(
    take(1),
    shareReplay(1),
  )

  const event$ = bufMaxSize > 0
    ? fromEvent(stderr, 'data') as Observable<Buffer>
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
