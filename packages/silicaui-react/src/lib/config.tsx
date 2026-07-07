import * as React from "react";

/**
 * Runtime configuration shared by all Silica React components.
 *
 * `prefix` MUST match the `prefix` you set on `@plugin "silicaui"` in your CSS.
 * The CSS plugin emits `.<prefix>btn`; these components rebuild those class
 * names at runtime, so both sides have to agree on the prefix.
 */
export interface SilicaConfig {
  /** Prepended verbatim to every Silica class (e.g. `"sx-"` → `sx-btn`). */
  prefix: string;
}

const DEFAULT_CONFIG: SilicaConfig = { prefix: "" };

const SilicaConfigContext = React.createContext<SilicaConfig>(DEFAULT_CONFIG);

export interface SilicaProviderProps extends Partial<SilicaConfig> {
  children: React.ReactNode;
}

/**
 * Provides Silica config to the components beneath it. Providers may be nested —
 * a client-site subtree can run under `prefix="st-"` inside a platform shell on
 * `prefix="sx-"`, and each Silica component picks up its nearest provider.
 *
 *   <SilicaProvider prefix="sx-">
 *     <App />
 *   </SilicaProvider>
 */
export function SilicaProvider({ prefix = "", children }: SilicaProviderProps) {
  const value = React.useMemo<SilicaConfig>(() => ({ prefix }), [prefix]);
  return (
    <SilicaConfigContext.Provider value={value}>
      {children}
    </SilicaConfigContext.Provider>
  );
}

/** Read the full Silica config from context (defaults to `{ prefix: "" }`). */
export function useSilicaConfig(): SilicaConfig {
  return React.useContext(SilicaConfigContext);
}

/**
 * Returns a class-name builder bound to the active prefix. `cn("btn")` →
 * `"sx-btn"` when a `prefix="sx-"` provider is in scope, or `"btn"` otherwise.
 * Passing a nullish/false value returns it unchanged, so it composes with the
 * same conditional style the components already use.
 */
export function useSilicaClass(): (name: string | false | null | undefined) => string | false | null | undefined {
  const { prefix } = React.useContext(SilicaConfigContext);
  return React.useCallback(
    (name) => (name ? `${prefix}${name}` : name),
    [prefix],
  );
}
