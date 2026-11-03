"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Edit2, GitMerge, Loader2, Plus, Trash2, UsersRound, X } from "lucide-react";
import toast from "react-hot-toast";
import { teamApi } from "@/lib/api";

type TeamMember = { _id: string; name: string; aliases: string[]; bookingCount: number };
type Modal =
  | { type: "add" }
  | { type: "edit"; member: TeamMember }
  | { type: "merge"; member: TeamMember }
  | null;

const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState<string[]>([]);
  const [targetId, setTargetId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    teamApi.getAll()
      .then(({ data }) => setMembers(data.data || []))
      .catch(() => toast.error("Failed to load team members"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = (next: Modal) => {
    setName(next?.type === "edit" ? next.member.name : "");
    setAliases(next?.type === "edit" ? next.member.aliases : []);
    setTargetId("");
    setModal(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.type === "add") {
        await teamApi.create(name);
        toast.success("Team member added");
      } else if (modal.type === "edit") {
        await teamApi.update(modal.member._id, { name, aliases });
        toast.success("Team member updated");
      } else {
        await teamApi.merge(modal.member._id, targetId);
        toast.success("Team members merged");
      }
      openModal(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.name} from the team? They'll leave the Team Member dropdown, but their past bookings stay as they are and still count in reports.`)) return;
    try {
      await teamApi.remove(member._id);
      toast.success("Team member removed");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove team member");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-syne font-black text-2xl text-[#0F0F1A]">Team Management</h1>
          <p className="text-[#9090A8] text-sm mt-1">{members.length} team members. This list feeds the Team Member dropdown on bookings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/reports/team" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E4E5EF] bg-white text-[#4A4A6A] font-semibold text-sm hover:border-[#E8540A] hover:text-[#E8540A]">
            <BarChart3 size={15} /> Team Report
          </Link>
          <button onClick={() => openModal({ type: "add" })} className="flex items-center gap-2 btn-gradient px-4 py-2.5 rounded-xl text-white font-bold text-sm">
            <Plus size={15} /> Add Member
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-[#9090A8]">
            <Loader2 size={20} className="animate-spin" /> Loading team...
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center text-[#9090A8]">
            <UsersRound size={36} className="mx-auto mb-3 text-[#E4E5EF]" />
            <p className="font-semibold">No team members yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                  {["Name", "Linked Spellings", "Bookings", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m._id} className="border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors">
                    <td className="px-4 py-4 font-semibold text-[#0F0F1A] text-sm whitespace-nowrap">{m.name}</td>
                    <td className="px-4 py-4 text-[#4A4A6A] text-xs min-w-[160px]">{m.aliases.length ? m.aliases.join(", ") : "—"}</td>
                    <td className="px-4 py-4 text-sm font-bold">
                      <Link href={`/admin/bookings?bookedBy=${encodeURIComponent(m.name)}`} className="text-[#E8540A] hover:underline">{m.bookingCount}</Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openModal({ type: "edit", member: m })} title="Edit" aria-label={`Edit ${m.name}`} className="p-2 rounded-lg text-[#4A4A6A] hover:bg-[#F1F2F7]"><Edit2 size={15} /></button>
                        <button onClick={() => openModal({ type: "merge", member: m })} title="Merge into another member" aria-label={`Merge ${m.name}`} className="p-2 rounded-lg text-[#4A4A6A] hover:bg-[#F1F2F7]"><GitMerge size={15} /></button>
                        <button onClick={() => remove(m)} title="Remove" aria-label={`Remove ${m.name}`} className="p-2 rounded-lg text-[#EF4444] hover:bg-[#FEE2E2]"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-syne font-black text-lg text-[#0F0F1A]">
                {modal.type === "add" ? "Add Team Member" : modal.type === "edit" ? "Edit Team Member" : `Merge ${modal.member.name}`}
              </h2>
              <button type="button" onClick={() => openModal(null)} aria-label="Close" className="p-1.5 rounded-lg text-[#9090A8] hover:bg-[#F1F2F7]"><X size={18} /></button>
            </div>

            {modal.type === "merge" ? (
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Merge into</label>
                <select value={targetId} onChange={(e) => setTargetId(e.target.value)} required className={inputCls}>
                  <option value="">Select team member</option>
                  {members.filter((m) => m._id !== modal.member._id).map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                <p className="text-xs text-[#9090A8] mt-2">
                  Use this when both names are the same person. {modal.member.name} leaves the dropdown and their {modal.member.bookingCount} bookings count under the chosen member. The bookings themselves don&apos;t change.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus className={inputCls} />
                {modal.type === "edit" && name.trim() !== modal.member.name && (
                  <p className="text-xs text-[#9090A8] mt-2">Past bookings keep the old name and still count under this member.</p>
                )}
              </div>
            )}

            {modal.type === "edit" && aliases.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Linked spellings</label>
                <div className="flex flex-wrap gap-2">
                  {aliases.map((a) => (
                    <span key={a} className="flex items-center gap-1 bg-[#F1F2F7] text-[#4A4A6A] text-xs font-medium rounded-lg pl-2.5 pr-1 py-1">
                      {a}
                      <button type="button" onClick={() => setAliases((list) => list.filter((x) => x !== a))} aria-label={`Unlink ${a}`} className="p-0.5 rounded hover:bg-[#E4E5EF]"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 btn-gradient px-4 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60">
                {saving && <Loader2 size={15} className="animate-spin" />} {modal.type === "add" ? "Add Member" : modal.type === "edit" ? "Save Changes" : "Merge"}
              </button>
              <button type="button" onClick={() => openModal(null)} className="px-5 py-3 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
