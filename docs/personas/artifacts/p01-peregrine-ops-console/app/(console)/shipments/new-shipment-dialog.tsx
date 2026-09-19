"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldLabel,
  Input,
  Select,
} from "@wizeworks/silicaui-react";

const PORTS = {
  Rotterdam: "Rotterdam",
  Riga: "Riga",
  Tashkent: "Tashkent",
};

interface FieldErrors {
  ref?: string;
  consignee?: string;
  destination?: string;
}

/**
 * "New shipment" — the one write path in the console.
 *
 * The dialog is CONTROLLED rather than left to its trigger, because the form has
 * to survive a rejected submit: an uncontrolled dialog that closes on submit
 * throws away what she typed at exactly the moment the server tells her one
 * field is wrong. It closes on success, on Escape, and on Cancel — never on a
 * 409.
 */
export function NewShipmentDialog({ onCreated }: { onCreated: (ref: string) => void }) {
  const [open, setOpen] = useState(false);
  const [ref_, setRef] = useState("");
  const [consignee, setConsignee] = useState("");
  const [destination, setDestination] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  function reset() {
    setRef("");
    setConsignee("");
    setDestination("");
    setErrors({});
    setFormError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setBusy(true);
    const res = await fetch("/api/shipments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ref: ref_, consignee, destination }),
    });
    setBusy(false);

    if (res.ok) {
      const created = (await res.json()) as { ref: string };
      setOpen(false);
      reset();
      onCreated(created.ref);
      return;
    }

    const body = (await res.json()) as { message?: string; fields?: FieldErrors };
    setErrors(body.fields ?? {});
    setFormError(body.message ?? "The shipment could not be created.");
    // Move focus to the message. Without this the keyboard user is left on the
    // submit button with an error they were never told about — a screen reader
    // announces the live region, but a sighted keyboard user's focus stays put
    // and the next Tab walks past the thing that just went wrong.
    requestAnimationFrame(() => alertRef.current?.focus());
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger>
        <Button color="primary">New shipment</Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>New shipment</DialogTitle>
          <DialogDescription>
            Booked against Peregrine&rsquo;s own reference series.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          {formError ? (
            <Alert
              ref={alertRef}
              color="error"
              role="alert"
              tabIndex={-1}
              className="outline-offset-2"
            >
              {formError}
            </Alert>
          ) : null}

          <Field status={errors.ref ? "error" : undefined} statusMessage={errors.ref}>
            <FieldLabel required>Reference</FieldLabel>
            <Input
              name="ref"
              value={ref_}
              onChange={(e) => setRef(e.target.value)}
              placeholder="PFR-2026-0431"
              autoComplete="off"
              className="w-full font-mono"
            />
          </Field>

          <Field
            status={errors.consignee ? "error" : undefined}
            statusMessage={errors.consignee}
          >
            <FieldLabel required>Consignee</FieldLabel>
            <Input
              name="consignee"
              value={consignee}
              onChange={(e) => setConsignee(e.target.value)}
              placeholder="Oltin Vodiy Tekstil MChJ"
              autoComplete="off"
              className="w-full"
            />
          </Field>

          <Field
            status={errors.destination ? "error" : undefined}
            statusMessage={errors.destination}
          >
            <FieldLabel required>Destination</FieldLabel>
            <Select
              name="destination"
              items={PORTS}
              value={destination}
              onValueChange={(v) => setDestination(String(v ?? ""))}
              placeholder="Choose a port"
              className="w-full"
            />
          </Field>

          <DialogFooter>
            <DialogClose>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" color="primary" loading={busy}>
              Book it
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
