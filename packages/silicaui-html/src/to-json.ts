/**
 * The JSON projection (architecture spec §4) — the validated neutral tree as
 * plain, serializable data, for structured hosts and the builder. The JSON
 * round-trip guarantees serializability (throws on cycles) and strips
 * `undefined`, so what comes out is exactly what a host will persist.
 */
import type { Document, Node, Template } from "./schema";

export function toJson<T extends Node | Template | Document>(input: T): T {
  return JSON.parse(JSON.stringify(input)) as T;
}
