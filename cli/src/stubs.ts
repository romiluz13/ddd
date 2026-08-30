/**
 * Stubs for machine API primitives that are not yet implemented.
 * (SPEC.md §15.3: discover, packet, claim, refute, exception, obligation, compile)
 */

export const STUB_PRIMITIVES = [
  "discover",
  "refute",
  "exception",
  "obligation",
  "compile",
] as const;

export type StubPrimitive = (typeof STUB_PRIMITIVES)[number];

export function isStubPrimitive(name: string): name is StubPrimitive {
  return (STUB_PRIMITIVES as readonly string[]).includes(name);
}

export function runStub(name: StubPrimitive): void {
  console.log(`${name}: not yet implemented`);
}
