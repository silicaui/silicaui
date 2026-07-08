import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Input } from "./input";
import { Button } from "./button";

export type PowerSearchFieldType = "text" | "select" | "date" | "boolean" | "custom";

export interface PowerSearchFieldOption {
  value: string;
  label: React.ReactNode;
}

export interface PowerSearchValuePickerProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
}

export interface PowerSearchFieldDef {
  key: string;
  label: React.ReactNode;
  type: PowerSearchFieldType;
  /** For `type: "select"`. */
  options?: PowerSearchFieldOption[];
  /** For `type: "custom"` — render your own value-picker UI; call `onCommit` when done. */
  render?: (props: PowerSearchValuePickerProps) => React.ReactNode;
  placeholder?: string;
  /** Format a stored value for display in the chip/summary. Default: the raw value (or the matching option's label, for `select`). */
  formatValue?: (value: string) => React.ReactNode;
}

export interface PowerSearchTerm {
  id: string;
  field: string;
  value: string;
}

export interface PowerSearchValue {
  query: string;
  terms: PowerSearchTerm[];
}

const EMPTY_VALUE: PowerSearchValue = { query: "", terms: [] };

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `ps-${idCounter}`;
}

function defaultFormatValue(field: PowerSearchFieldDef | undefined, value: string): React.ReactNode {
  if (!field) return value;
  if (field.formatValue) return field.formatValue(value);
  if (field.type === "select") return field.options?.find((o) => o.value === value)?.label ?? value;
  if (field.type === "boolean") return value === "true" ? "Yes" : "No";
  return value;
}

// ---------------------------------------------------------------------------
// usePowerSearchConfig — owns the query + term-list state.
// ---------------------------------------------------------------------------

export interface UsePowerSearchConfigOptions {
  fields: PowerSearchFieldDef[];
  value?: PowerSearchValue;
  defaultValue?: PowerSearchValue;
  onValueChange?: (value: PowerSearchValue) => void;
}

export interface UsePowerSearchConfigResult {
  fields: PowerSearchFieldDef[];
  value: PowerSearchValue;
  setQuery: (query: string) => void;
  addTerm: (field: string, value: string) => void;
  updateTerm: (id: string, value: string) => void;
  removeTerm: (id: string) => void;
  clear: () => void;
}

/**
 * The state engine behind `PowerSearch` — call it yourself when you need the
 * query/terms outside the field (e.g. to build an API request), and pass its
 * `value`/`setQuery`/etc straight to `PowerSearch` as a controlled instance.
 *
 *   const search = usePowerSearchConfig({ fields });
 *   <PowerSearch {...search} />
 *   // search.value.query, search.value.terms are your filter state
 */
export function usePowerSearchConfig({
  fields,
  value,
  defaultValue,
  onValueChange,
}: UsePowerSearchConfigOptions): UsePowerSearchConfigResult {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<PowerSearchValue>(defaultValue ?? EMPTY_VALUE);
  const current = isControlled ? value : internal;

  function commit(next: PowerSearchValue) {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  }

  return {
    fields,
    value: current,
    setQuery: (query) => commit({ ...current, query }),
    addTerm: (field, val) => commit({ ...current, terms: [...current.terms, { id: nextId(), field, value: val }] }),
    updateTerm: (id, val) =>
      commit({ ...current, terms: current.terms.map((t) => (t.id === id ? { ...t, value: val } : t)) }),
    removeTerm: (id) => commit({ ...current, terms: current.terms.filter((t) => t.id !== id) }),
    clear: () => commit(EMPTY_VALUE),
  };
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Field picker / value picker (shared by "add filter" and "edit chip")
// ---------------------------------------------------------------------------

function FieldList({
  fields,
  onPick,
}: {
  fields: PowerSearchFieldDef[];
  onPick: (field: PowerSearchFieldDef) => void;
}) {
  const sc = useSilicaClass();
  return (
    <div className={cx(sc("power-search-field-list"))}>
      {fields.map((f) => (
        <button
          key={f.key}
          type="button"
          className={cx(sc("power-search-field-item"))}
          onClick={() => onPick(f)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function ValuePicker({
  field,
  initialValue,
  onCommit,
  onBack,
}: {
  field: PowerSearchFieldDef;
  initialValue: string;
  onCommit: (value: string) => void;
  onBack?: () => void;
}) {
  const sc = useSilicaClass();
  const [draft, setDraft] = React.useState(initialValue);

  const header = onBack && (
    <button type="button" className={cx(sc("power-search-value-picker-back"))} onClick={onBack}>
      <BackIcon /> {field.label}
    </button>
  );

  let body: React.ReactNode;
  if (field.type === "select") {
    body = (
      <div className={cx(sc("power-search-option-list"))}>
        {field.options?.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={cx(sc("power-search-field-item"))}
            onClick={() => onCommit(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  } else if (field.type === "boolean") {
    body = (
      <div className={cx(sc("power-search-option-list"))}>
        <button type="button" className={cx(sc("power-search-field-item"))} onClick={() => onCommit("true")}>
          Yes
        </button>
        <button type="button" className={cx(sc("power-search-field-item"))} onClick={() => onCommit("false")}>
          No
        </button>
      </div>
    );
  } else if (field.type === "date") {
    body = (
      <Input
        type="date"
        size="sm"
        defaultValue={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft) onCommit(draft);
        }}
      />
    );
  } else if (field.type === "custom" && field.render) {
    body = field.render({ value: draft, onChange: setDraft, onCommit });
  } else {
    body = (
      <form
        className={cx(sc("power-search-value-form"))}
        onSubmit={(e) => {
          e.preventDefault();
          if (draft) onCommit(draft);
        }}
      >
        <Input
          size="sm"
          autoFocus
          value={draft}
          placeholder={field.placeholder}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" size="sm">
          {onBack ? "Add" : "Save"}
        </Button>
      </form>
    );
  }

  return (
    <div className={cx(sc("power-search-value-picker"))}>
      {header}
      {!onBack && <div className={cx(sc("power-search-value-picker-label"))}>{field.label}</div>}
      {body}
    </div>
  );
}

function AddFilterPopover({
  fields,
  onAdd,
}: {
  fields: PowerSearchFieldDef[];
  onAdd: (fieldKey: string, value: string) => void;
}) {
  const sc = useSilicaClass();
  const [open, setOpen] = React.useState(false);
  const [field, setField] = React.useState<PowerSearchFieldDef | null>(null);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setField(null);
      }}
    >
      <PopoverTrigger>
        <button type="button" className={cx(sc("power-search-add"))}>
          <PlusIcon /> Filter
        </button>
      </PopoverTrigger>
      <PopoverContent>
        {!field ? (
          <FieldList fields={fields} onPick={setField} />
        ) : (
          <ValuePicker
            field={field}
            initialValue=""
            onBack={() => setField(null)}
            onCommit={(v) => {
              onAdd(field.key, v);
              setOpen(false);
              setField(null);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function TermChip({
  term,
  field,
  onUpdate,
  onRemove,
}: {
  term: PowerSearchTerm;
  field: PowerSearchFieldDef | undefined;
  onUpdate: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const sc = useSilicaClass();
  const [open, setOpen] = React.useState(false);

  return (
    <span className={cx(sc("power-search-chip"))}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <button type="button" className={cx(sc("power-search-chip-trigger"))}>
            <span className={cx(sc("power-search-chip-field"))}>{field?.label ?? term.field}:</span>
            <span>{defaultFormatValue(field, term.value)}</span>
          </button>
        </PopoverTrigger>
        {field && (
          <PopoverContent>
            <ValuePicker
              field={field}
              initialValue={term.value}
              onCommit={(v) => {
                onUpdate(term.id, v);
                setOpen(false);
              }}
            />
          </PopoverContent>
        )}
      </Popover>
      <button
        type="button"
        className={cx(sc("power-search-chip-remove"))}
        aria-label={`Remove ${String(field?.label ?? term.field)} filter`}
        onClick={() => onRemove(term.id)}
      >
        <XIcon />
      </button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// PowerSearch
// ---------------------------------------------------------------------------

export interface PowerSearchProps {
  fields: PowerSearchFieldDef[];
  value: PowerSearchValue;
  setQuery: (query: string) => void;
  addTerm: (field: string, value: string) => void;
  updateTerm: (id: string, value: string) => void;
  removeTerm: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Silica PowerSearch — a search field that mixes free text with structured
 * `field: value` filter chips (GitHub/Linear-style). Drive it with
 * `usePowerSearchConfig` — this component is purely a view over that state.
 *
 *   const search = usePowerSearchConfig({
 *     fields: [
 *       { key: "status", label: "Status", type: "select", options: [{ value: "open", label: "Open" }] },
 *       { key: "assignee", label: "Assignee", type: "text" },
 *       { key: "due", label: "Due date", type: "date" },
 *     ],
 *   });
 *   <PowerSearch {...search} placeholder="Search issues…" />
 */
export function PowerSearch({
  fields,
  value,
  setQuery,
  addTerm,
  updateTerm,
  removeTerm,
  placeholder = "Search…",
  disabled,
  className,
  "aria-label": ariaLabel,
}: PowerSearchProps) {
  const sc = useSilicaClass();
  const fieldByKey = React.useMemo(() => new Map(fields.map((f) => [f.key, f])), [fields]);

  return (
    <div className={cx(sc("power-search"), className)} data-disabled={disabled || undefined}>
      {value.terms.map((term) => (
        <TermChip
          key={term.id}
          term={term}
          field={fieldByKey.get(term.field)}
          onUpdate={updateTerm}
          onRemove={removeTerm}
        />
      ))}

      <input
        type="text"
        className={cx(sc("power-search-input"))}
        value={value.query}
        placeholder={value.terms.length === 0 ? placeholder : ""}
        disabled={disabled}
        aria-label={ariaLabel ?? "Search"}
        onChange={(e) => setQuery(e.target.value)}
      />

      {!disabled && <AddFilterPopover fields={fields} onAdd={addTerm} />}
    </div>
  );
}
