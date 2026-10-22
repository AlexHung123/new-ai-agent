export function shouldApplyFetchedWcmsHtml(input: {
  requestGeneration: number;
  activeGeneration: number;
  editedSinceRequest: boolean;
}): boolean {
  return (
    input.requestGeneration === input.activeGeneration &&
    !input.editedSinceRequest
  );
}
