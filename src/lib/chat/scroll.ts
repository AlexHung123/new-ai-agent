export function isScrollAtTail(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
  tolerance = 80,
): boolean {
  return scrollTop + clientHeight >= scrollHeight - tolerance;
}
