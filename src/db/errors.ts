// The name of the constraint a failed write broke, or undefined when the
// failure was something else. A batch reports the database's error itself; a
// single query wraps it.
export function constraintOf(error: unknown) {
  const failure = error as {
    constraint?: string;
    cause?: { constraint?: string };
  } | null;
  return failure?.constraint ?? failure?.cause?.constraint;
}
