import { fromEvent, NEVER, Observable } from 'rxjs'
import { bufferCount, map, take, tap } from 'rxjs/operators'


export function bindStderrData(
  stderr: NodeJS.ReadableStream,
  bufMaxSize: number,
): Observable<Buffer> {

  const count = typeof bufMaxSize === 'number' && bufMaxSize > 0
    ? bufMaxSize
    : 0
  let data$: Observable<Buffer> = NEVER

  if (count >= 0) {
    data$ = fromEvent<any>(stderr, 'data').pipe(
      map(data => Buffer.isBuffer(data) ? data : Buffer.from(data)),
      tap(buf => buf.toString()),
      bufferCount(count),
      take(1),
      map(arr => Buffer.concat(arr)),
    )
  }

  return data$
}
