"use client";

import { useEffect, useState } from "react";
import { teamApi } from "@/lib/api";

interface Props {
  value: string;
  onChange: (name: string) => void;
  className?: string;
  // Pass the list when rendering many at once, so each one doesn't fetch it.
  names?: string[];
}

// Team member picker fed by Team Management. A booking's existing value is always
// offered exactly as stored, even if it's an old spelling no longer on the team,
// so opening and saving a booking never changes who it's assigned to.
export default function BookedBySelect({ value, onChange, className, names: namesProp }: Props) {
  const [fetchedNames, setFetchedNames] = useState<string[]>([]);
  const names = namesProp ?? fetchedNames;

  useEffect(() => {
    if (namesProp) return;
    teamApi.getAll()
      .then(({ data }) => setFetchedNames((data.data || []).map((m: { name: string }) => m.name)))
      .catch(() => setFetchedNames([]));
  }, [namesProp]);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">Select team member</option>
      {value && !names.includes(value) && <option value={value}>{value}</option>}
      {names.map((name) => <option key={name} value={name}>{name}</option>)}
    </select>
  );
}
