/**
 * Permissive database types.
 *
 * The typed generator (`supabase gen types`) requires Docker/podman, which isn't
 * available in this environment. Queries work fine untyped; regenerate real types
 * later where Docker is available:
 *   supabase gen types typescript --linked > lib/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
