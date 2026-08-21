export type JsonToolResult<T> = {
  content: Array<{ type: 'text'; text: string }>;
  details: T;
};

/** Model-facing JSON plus structured details for the SSE adapter. */
export function jsonToolResult<T>(value: T): JsonToolResult<T> {
  return {
    content: [{ type: 'text', text: JSON.stringify(value) }],
    details: value,
  };
}
