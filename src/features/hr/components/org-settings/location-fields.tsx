"use client";

import { useMemo } from "react";
import { Country, State, City } from "country-state-city";
import { getTimeZones } from "@vvo/tzdb";
import { Input } from "@/components/ui/input/input";
import { Switch } from "@/components/ui/switch/switch";
import { Select, type SelectOption } from "@/components/ui/select/select";

// ── Option Builders (memoized at module load) ──

const COUNTRY_OPTIONS: SelectOption[] = Country.getAllCountries().map((c) => ({
  value: c.isoCode,
  label: `${c.flag ?? ""} ${c.name}`.trim(),
}));

const TIMEZONE_OPTIONS: SelectOption[] = getTimeZones().map((tz) => ({
  value: tz.name,
  label: `${tz.name.replace(/_/g, " ")} (${tz.currentTimeFormat.split(" ")[0]})`,
}));

// Map country ISO code → default timezone (first zone of that country).
// Used to auto-fill timezone when a country is selected.
function defaultTimezoneForCountry(isoCode: string): string | null {
  const country = Country.getCountryByCode(isoCode);
  return country?.timezones?.[0]?.zoneName ?? null;
}

// ── Shared State ──

export type LocationFieldValues = {
  isRemote: boolean;
  parentId: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateCode: string;
  postalCode: string;
  countryCode: string;
  timezone: string;
  phone: string;
};

type Props = {
  values: LocationFieldValues;
  parentOptions: SelectOption[];
  onChange: (patch: Partial<LocationFieldValues>) => void;
};

// ── Component ──

export function LocationFields({ values, parentOptions, onChange }: Props) {
  const stateOptions: SelectOption[] = useMemo(() => {
    if (!values.countryCode) return [];
    return State.getStatesOfCountry(values.countryCode).map((s) => ({
      value: s.isoCode,
      label: s.name,
    }));
  }, [values.countryCode]);

  const cityOptions: SelectOption[] = useMemo(() => {
    if (!values.countryCode || !values.stateCode) return [];
    return City.getCitiesOfState(values.countryCode, values.stateCode).map((c) => ({
      value: c.name,
      label: c.name,
    }));
  }, [values.countryCode, values.stateCode]);

  // Auto-fill timezone when country changes (user can override after).
  function handleCountryChange(code: string) {
    const patch: Partial<LocationFieldValues> = {
      countryCode: code,
      stateCode: "",
      city: "",
    };
    const tz = defaultTimezoneForCountry(code);
    if (tz) patch.timezone = tz;
    onChange(patch);
  }

  return (
    <>
      {/* Details — name lives above; this is parent + phone */}
      <div className="org-settings__dialog-section">
        <h4 className="org-settings__dialog-section-title">Details</h4>
        <div className="org-settings__dialog-fields">
          <div className="org-settings__dialog-row">
            <label className="org-settings__dialog-label">
              Parent Location
              <Select
                options={parentOptions}
                value={values.parentId}
                onChange={(v) => onChange({ parentId: v })}
                placeholder="None (Top level)"
              />
            </label>
            <label className="org-settings__dialog-label">
              Phone
              <Input
                value={values.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="Optional"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="org-settings__dialog-section">
        <h4 className="org-settings__dialog-section-title">Address</h4>
        <div className="org-settings__dialog-fields">
          {/* Remote toggle — top of address section */}
          <label className="org-settings__dialog-label org-settings__dialog-toggle">
            <div className="org-settings__dialog-toggle-info">
              <span className="org-settings__dialog-toggle-title">Remote location</span>
              <span className="org-settings__dialog-toggle-desc">
                No physical address — people work from anywhere
              </span>
            </div>
            <Switch
              checked={values.isRemote}
              onCheckedChange={(checked) => onChange({ isRemote: checked })}
            />
          </label>

          {/* Physical address — hidden when remote */}
          {!values.isRemote && (
            <>
              <div className="org-settings__dialog-row">
                <label className="org-settings__dialog-label">
                  Country
                  <Select
                    options={COUNTRY_OPTIONS}
                    value={values.countryCode}
                    onChange={handleCountryChange}
                    placeholder="Select country..."
                  />
                </label>
                <label className="org-settings__dialog-label">
                  State / Province
                  <Select
                    options={stateOptions}
                    value={values.stateCode}
                    onChange={(v) => onChange({ stateCode: v, city: "" })}
                    placeholder={values.countryCode ? "Select state..." : "Select country first"}
                    disabled={!values.countryCode}
                  />
                </label>
              </div>
              <div className="org-settings__dialog-row">
                <label className="org-settings__dialog-label">
                  City
                  {cityOptions.length > 0 ? (
                    <Select
                      options={cityOptions}
                      value={values.city}
                      onChange={(v) => onChange({ city: v })}
                      placeholder="Select city..."
                    />
                  ) : (
                    <Input
                      value={values.city}
                      onChange={(e) => onChange({ city: e.target.value })}
                      placeholder={values.stateCode ? "Type city name" : "Select state first"}
                      disabled={!values.stateCode}
                    />
                  )}
                </label>
                <label className="org-settings__dialog-label">
                  Postal Code
                  <Input
                    value={values.postalCode}
                    onChange={(e) => onChange({ postalCode: e.target.value })}
                  />
                </label>
              </div>
              <label className="org-settings__dialog-label">
                Address Line 1
                <Input
                  placeholder="Street address"
                  value={values.addressLine1}
                  onChange={(e) => onChange({ addressLine1: e.target.value })}
                />
              </label>
              <label className="org-settings__dialog-label">
                Address Line 2
                <Input
                  placeholder="Suite, floor, unit (optional)"
                  value={values.addressLine2}
                  onChange={(e) => onChange({ addressLine2: e.target.value })}
                />
              </label>
            </>
          )}

          {/* Timezone — always visible (remote workers still have a timezone) */}
          <label className="org-settings__dialog-label">
            Timezone
            <Select
              options={TIMEZONE_OPTIONS}
              value={values.timezone}
              onChange={(v) => onChange({ timezone: v })}
              placeholder={values.isRemote ? "Select timezone..." : "Auto-filled from country (overridable)"}
            />
          </label>
        </div>
      </div>
    </>
  );
}
