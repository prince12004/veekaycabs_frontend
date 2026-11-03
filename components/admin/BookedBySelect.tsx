"use client";

import { useEffect, useState } from "react";
import { teamApi } from "@/lib/api";

interface Props {
  value: string;
  onChange: (name: string) => void;
  className?: string;
}

// Team member picker fed by Team Management. A booking's existing value is always
// offered exactly as stored, even if it's an old spelling no longer on the team,
// so opening and saving a booking never changes who it's assigned to.
export default function BookedBySelect({ value, onChange, className }: Props) {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    teamApi.getAll()
      .then(({ data }) => setNames((data.data || []).map((m: { name: string }) => m.name)))
      .catch(() => setNames([]));
  }, []);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">Select team member</option>
      {value && !names.includes(value) && <option value={value}>{value}</option>}
      {names.map((name) => <option key={name} value={name}>{name}</option>)}
    </select>
  );
}
