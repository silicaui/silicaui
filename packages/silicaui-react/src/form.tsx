import * as React from "react";
import { Form as BaseForm } from "@base-ui-components/react/form";

export type FormProps = React.ComponentPropsWithoutRef<typeof BaseForm>;

/**
 * Silica Form — a `<form>` that coordinates its Fields' validation. Behavior
 * from Base UI: it runs each Field's validation on submit, focuses the first
 * invalid control, and accepts server-returned `errors` keyed by field `name`.
 * Presentational only otherwise — lay it out with `Field`s and utilities.
 *
 *   <Form errors={serverErrors} onSubmit={…}>
 *     <Field name="email">…</Field>
 *     <Button type="submit">Save</Button>
 *   </Form>
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(function Form(
  props,
  ref,
) {
  return <BaseForm ref={ref} {...props} />;
});
