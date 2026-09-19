import { ConsoleShell } from "../console-shell";

/**
 * The console chrome wraps everything in this group. `sign-in` sits OUTSIDE it
 * on purpose — a sign-in screen showing the nav of the app you have not signed
 * into yet is the kind of thing act 10's stranger notices immediately.
 */
export default function ConsoleLayout({ children }: LayoutProps<"/">) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
