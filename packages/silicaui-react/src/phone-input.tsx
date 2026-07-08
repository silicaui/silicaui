import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";
import { Join } from "./join";
import { Select } from "./select";
import { Input } from "./input";
import {
  DEFAULT_COUNTRIES,
  findCountry,
  flagEmoji,
  type Country,
} from "./lib/countries";

export type PhoneInputColor = SilicaColor;
export type PhoneInputSize = SilicaSize;

const FALLBACK_COUNTRY: Country = { iso2: "US", name: "United States", dial: "1" };

/** Groups digits 3-3-4 (or a safe fallback), e.g. `"5551234567"` → `"555 123 4567"`. */
function formatNational(digits: string): string {
  const groups: string[] = [];
  let i = 0;
  while (i < digits.length) {
    const remaining = digits.length - i;
    const size = remaining === 4 ? 4 : Math.min(3, remaining);
    groups.push(digits.slice(i, i + size));
    i += size;
  }
  return groups.join(" ");
}

export interface PhoneInputProps {
  /** Controlled national number (digits, or digits with formatting — either is fine). */
  value?: string;
  /** Uncontrolled initial national number. */
  defaultValue?: string;
  /** Fires on every keystroke with the raw national digits and the full E.164 string. */
  onValueChange?: (national: string, e164: string) => void;
  /** Controlled selected country (ISO 3166-1 alpha-2). */
  country?: string;
  /** Uncontrolled initial country. Default `"US"`. */
  defaultCountry?: string;
  /** Fires when the country picker selection changes. */
  onCountryChange?: (iso2: string) => void;
  /** Override/extend the built-in country list. */
  countries?: Country[];
  /** Accent color; maps to `input-<color>`/`select-<color>` (border + focus ring). */
  color?: PhoneInputColor;
  /** Default `md`. Matches same-size Input/Select heights. */
  size?: PhoneInputSize;
  disabled?: boolean;
  placeholder?: string;
  /** Field name for form submission (submits the national digits). */
  name?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * Silica PhoneInput — a country-code `Select` joined to a national-number
 * `Input` (via `Join`), with a lightweight generic digit-grouping formatter.
 * Not a full E.164 validation/formatting library — for that level of
 * per-country precision, format `onValueChange`'s `e164` output yourself.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    {
      value,
      defaultValue,
      onValueChange,
      country,
      defaultCountry = "US",
      onCountryChange,
      countries = DEFAULT_COUNTRIES,
      color,
      size = "md",
      disabled,
      placeholder = "Phone number",
      name,
      id,
      className,
      "aria-label": ariaLabel = "Phone number",
    },
    ref,
  ) {
    const sc = useSilicaClass();

    const isCountryControlled = country !== undefined;
    const [uncontrolledCountry, setUncontrolledCountry] =
      React.useState(defaultCountry);
    const currentCountryCode = isCountryControlled
      ? country
      : uncontrolledCountry;
    const selected =
      findCountry(currentCountryCode, countries) ?? countries[0] ?? FALLBACK_COUNTRY;

    const isValueControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState(
      defaultValue ?? "",
    );
    const currentDigits = (isValueControlled ? value : uncontrolledValue)
      .replace(/\D/g, "");

    const handleCountryChange = (next: unknown) => {
      const iso2 = String(next);
      if (!isCountryControlled) setUncontrolledCountry(iso2);
      onCountryChange?.(iso2);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      if (!isValueControlled) setUncontrolledValue(digits);
      onValueChange?.(digits, `+${selected.dial}${digits}`);
    };

    return (
      <Join className={cx("w-full", className)}>
        <Select
          aria-label="Country code"
          items={countries.map((c) => ({
            value: c.iso2,
            label: `${flagEmoji(c.iso2)} +${c.dial}`,
          }))}
          value={selected.iso2}
          onValueChange={handleCountryChange}
          color={color}
          size={size}
          disabled={disabled}
          className={cx(sc("phone-input-country"))}
        />
        <Input
          ref={ref}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className="flex-1"
          value={formatNational(currentDigits)}
          onChange={handleNumberChange}
          color={color}
          size={size}
          disabled={disabled}
          placeholder={placeholder}
          name={name}
          id={id}
          aria-label={ariaLabel}
        />
      </Join>
    );
  },
);
