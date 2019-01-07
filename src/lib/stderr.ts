import { fromEvent, NEVER, Observable } from 'rxjs'
import { bufferCount, map, take } from 'rxjs/operators'


export function bindStderrData(
  stderr: NodeJS.ReadableStream,
  bufMaxSize: number,
): Observable<Buffer> {

  const count = typeof bufMaxSize === 'number' && bufMaxSize > 0
    ? bufMaxSize
    : 0
  let data$: Observable<Buffer> = NEVER

  if (count >= 0) {
    data$ = fromEvent<Buffer>(stderr, 'data').pipe(
      bufferCount(count),
      take(1),
      // map(Buffer.concat),   works not!
      map(arr => Buffer.concat(arr)),
    )
  }

  return data$
}
