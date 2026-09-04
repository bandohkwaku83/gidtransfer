"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Dropdown, Select, type MenuProps } from "antd";
import { PlanUpgradeHint } from "@/components/billing/plan-upgrade-hint";
import { DashboardSpin, SettingsWorkflowSkeleton } from "@/components/ui/skeletons";
import { useToast } from "@/components/toast-provider";
import { AuthFormInput } from "@/components/ui/form-input";
import { FormModal, FormModalBody, FormModalFooter, FormModalForm, FormModalHeader } from "@/components/ui/form-modal";
import { getAuth } from "@/lib/auth-demo";
import { HttpError } from "@/lib/http";
import { canManageTeam } from "@/lib/studio-access";
import {
  createStudioTeamMember,
  listStudioTeam,
  readStudioTeamErrorCode,
  removeStudioTeamMember,
  resetStudioTeamPassword,
  studioTeamRoleLabel,
  updateStudioTeamMember,
  type StudioMenuMeta,
  type StudioRoleMeta,
  type StudioTeamMember,
  type StudioTeamRole,
  type StudioTeamSeats,
} from "@/lib/studio-team-api";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { cn } from "@/lib/utils";

const MENU_SELECT_CLASS =
  "w-full [&_.ant-select-selector]:!min-h-11 [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-zinc-200 [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!px-3 [&_.ant-select-selector]:!py-1 [&_.ant-select-selector]:!shadow-none [&_.ant-select-selection-item]:!text-sm [&_.ant-select-selection-item]:!text-zinc-900 [&_.ant-select-selector:hover]:!border-zinc-300 dark:[&_.ant-select-selector]:!border-zinc-700 dark:[&_.ant-select-selector]:!bg-zinc-950 dark:[&_.ant-select-selection-item]:!text-zinc-100";

const MENU_SELECT_POPUP_CLASS = [
  "studio-menu-key-select-dropdown",
  // Spacing between options
  "[&_.ant-select-item]:!my-1 [&_.ant-select-item]:!rounded-lg [&_.ant-select-item]:!px-3 [&_.ant-select-item]:!py-2.5",
  "[&_.rc-virtual-list-holder-inner]:!gap-1",
  // Hide Ant's default checkmark — we render our own checkbox
  "[&_.ant-select-item-option-state]:!hidden",
  // Unselected
  "[&_.ant-select-item-option]:!bg-white [&_.ant-select-item-option]:!text-zinc-900",
  "[&_.ant-select-item-option-active]:!bg-zinc-50",
  // Selected — light brand tint, dark text
  "[&_.ant-select-item-option-selected]:!bg-[#55001F]/10",
  "[&_.ant-select-item-option-selected]:!text-zinc-900",
  "[&_.ant-select-item-option-selected.ant-select-item-option-active]:!bg-[#55001F]/15",
  "dark:[&_.ant-select-item-option]:!bg-zinc-950 dark:[&_.ant-select-item-option]:!text-zinc-100",
  "dark:[&_.ant-select-item-option-active]:!bg-zinc-900",
  "dark:[&_.ant-select-item-option-selected]:!bg-[#55001F]/25",
  "dark:[&_.ant-select-item-option-selected]:!text-zinc-50",
].join(" ");

const AVATAR_TONES = [
  "bg-[#55001F]/12 text-[#55001F] dark:bg-[#55001F]/30 dark:text-[#e899b0]",
  "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
  "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
] as const;

function memberInitials(nameOrEmail: string): string {
  const raw = nameOrEmail.trim();
  if (!raw) return "?";
  if (raw.includes("@")) return raw.slice(0, 2).toUpperCase();
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function memberAvatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length]!;
}

function assignableMenus(menus: StudioMenuMeta[]): StudioMenuMeta[] {
  return menus.filter((m) => m.assignable !== false);
}

function defaultMenuKeysForRole(
  role: StudioTeamRole,
  roles: StudioRoleMeta[],
): string[] {
  return roles.find((r) => r.key === role)?.menuKeys ?? [];
}

function TemporaryPasswordBanner({
  password,
  onDismiss,
}: {
  password: string;
  onDismiss: () => void;
}) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      showToast("Password copied.", "success");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy. Select and copy manually.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4 border border-zinc-200 bg-zinc-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Temporary password
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Shown once — copy it before you leave this page.
        </p>
        <p className="mt-3 select-all font-mono text-base tracking-[0.12em] text-zinc-900 dark:text-zinc-100">
          {password}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => void copyPassword()}
          className="inline-flex h-9 items-center gap-1.5 bg-[#55001F] px-3.5 text-sm font-semibold text-white transition hover:bg-[#420018]"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-9 items-center px-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function MenuKeySelect({
  menus,
  selected,
  onChange,
  disabled,
}: {
  menus: StudioMenuMeta[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const assignable = assignableMenus(menus);
  const selectedCount = selected.filter((k) =>
    assignable.some((m) => m.key === k),
  ).length;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        Menu access
      </label>
      <Select
        mode="multiple"
        allowClear
        showSearch
        disabled={disabled}
        value={selected}
        onChange={(keys) => onChange(keys)}
        placeholder="Select menus this member can open"
        optionFilterProp="label"
        maxTagCount="responsive"
        className={MENU_SELECT_CLASS}
        classNames={{ popup: { root: MENU_SELECT_POPUP_CLASS } }}
        options={assignable.map((menu) => ({
          value: menu.key,
          label: menu.label,
          title: menu.description || menu.label,
        }))}
        optionRender={(option) => {
          const key = String(option.value ?? "");
          const menu = assignable.find((m) => m.key === key);
          const isSelected = selectedSet.has(key);
          return (
            <div className="flex items-start gap-2.5 py-0.5">
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  isSelected
                    ? "border-[#55001F] bg-[#55001F] text-white"
                    : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-950",
                )}
                aria-hidden
              >
                {isSelected ? (
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
                    <path
                      d="M3.5 8.5 6.5 11.5 12.5 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
              <div className="min-w-0">
                <div
                  className={cn(
                    "text-sm",
                    isSelected
                      ? "font-semibold text-zinc-900 dark:text-zinc-50"
                      : "font-medium text-zinc-900 dark:text-zinc-100",
                  )}
                >
                  {menu?.label ?? String(option.label ?? "")}
                </div>
                {menu?.description ? (
                  <div
                    className={cn(
                      "mt-0.5 text-xs",
                      isSelected
                        ? "text-zinc-600 dark:text-zinc-300"
                        : "text-zinc-500",
                    )}
                  >
                    {menu.description}
                  </div>
                ) : null}
              </div>
            </div>
          );
        }}
        getPopupContainer={(node) => node.parentElement ?? document.body}
      />
      <p className="text-xs text-zinc-500">
        {selectedCount === 0
          ? "No menus selected — member will have no sidebar access."
          : `${selectedCount} menu${selectedCount === 1 ? "" : "s"} selected`}
      </p>
    </div>
  );
}

export function SettingsTeamSection() {
  const { showToast } = useToast();
  const { can, openUpgrade, handlePlanError, plan } = usePlanEntitlements();
  const authUser = getAuth()?.user ?? null;
  const allowed = canManageTeam(authUser);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<StudioTeamMember[]>([]);
  const [seats, setSeats] = useState<StudioTeamSeats>({ used: 0, max: null });
  const [menus, setMenus] = useState<StudioMenuMeta[]>([]);
  const [roles, setRoles] = useState<StudioRoleMeta[]>([]);
  const [studioTeamAvailable, setStudioTeamAvailable] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<StudioTeamMember | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<StudioTeamRole>("editor");
  const [password, setPassword] = useState("");
  const [menuKeys, setMenuKeys] = useState<string[]>([]);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editRole, setEditRole] = useState<StudioTeamRole>("editor");
  const [editMenuKeys, setEditMenuKeys] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<"active" | "disabled">("active");

  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const maxSeats = seats.max ?? plan?.maxTeamMembers ?? null;
  const seatsFull =
    maxSeats != null && maxSeats > 0 && seats.used >= maxSeats;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStudioTeam();
      setMembers(data.members);
      setSeats(data.seats);
      setMenus(data.menus);
      setRoles(data.roles);
      setStudioTeamAvailable(data.studioTeamAvailable);
    } catch (err) {
      if (handlePlanError(err)) {
        setError(null);
        return;
      }
      setError(err instanceof Error ? err.message : "Could not load team.");
    } finally {
      setLoading(false);
    }
  }, [handlePlanError]);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    void load();
  }, [allowed, load]);

  useEffect(() => {
    if (!createOpen) return;
    setMenuKeys(defaultMenuKeysForRole(role, roles));
    // Reset menus from role defaults when the create dialog opens or role changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when role/roles change while open
  }, [createOpen, role, roles]);

  const roleOptions = useMemo(() => {
    if (roles.length > 0) return roles;
    return (
      [
        { key: "admin", label: "Admin", description: "", menuKeys: [] },
        { key: "editor", label: "Editor", description: "", menuKeys: [] },
        { key: "viewer", label: "Viewer", description: "", menuKeys: [] },
      ] as StudioRoleMeta[]
    );
  }, [roles]);

  function openCreate() {
    setEmail("");
    setDisplayName("");
    setRole("editor");
    setPassword("");
    setMenuKeys(defaultMenuKeysForRole("editor", roles));
    setCreateOpen(true);
  }

  function openEdit(member: StudioTeamMember) {
    setEditMember(member);
    setEditDisplayName(member.displayName);
    setEditRole(member.role);
    setEditMenuKeys(member.menuKeys);
    setEditStatus(member.status === "disabled" ? "disabled" : "active");
  }

  function onEditRoleChange(next: StudioTeamRole) {
    setEditRole(next);
    setEditMenuKeys(defaultMenuKeysForRole(next, roles));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) {
      showToast("Email and display name are required.", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await createStudioTeamMember({
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        role,
        ...(password.trim() ? { password: password.trim() } : {}),
        menuKeys,
      });
      setMembers((prev) => {
        const without = prev.filter((m) => m.id !== res.member.id);
        return [res.member, ...without];
      });
      setSeats(res.seats);
      setCreateOpen(false);
      if (res.temporaryPassword) {
        setTempPassword(res.temporaryPassword);
      }
      showToast(res.message || "Team member created.", "success");
    } catch (err) {
      if (handlePlanError(err)) return;
      const code = readStudioTeamErrorCode(err);
      if (code === "TEAM_MEMBER_LIMIT_REACHED") {
        const body =
          err instanceof HttpError && err.body && typeof err.body === "object"
            ? (err.body as { maxTeamMembers?: number; message?: string })
            : null;
        openUpgrade({
          feature: "studioTeam",
          message:
            body?.message ??
            `Team member limit reached${body?.maxTeamMembers != null ? ` (${body.maxTeamMembers})` : ""}.`,
          suggestedPlanId: "premium",
          requiredPlans: ["premium"],
        });
        return;
      }
      if (code === "EMAIL_TAKEN") {
        showToast(
          err instanceof Error
            ? err.message
            : "An account with this email already exists. Studio team creates new users only.",
          "error",
        );
        return;
      }
      showToast(err instanceof Error ? err.message : "Could not create member.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editMember) return;
    setSavingEdit(true);
    try {
      const res = await updateStudioTeamMember(editMember.id, {
        displayName: editDisplayName.trim(),
        role: editRole,
        menuKeys: editMenuKeys,
        status: editStatus,
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === res.member.id ? res.member : m)),
      );
      setEditMember(null);
      showToast(res.message || "Team member updated.", "success");
    } catch (err) {
      if (handlePlanError(err)) return;
      showToast(err instanceof Error ? err.message : "Could not update member.", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function onRemove(member: StudioTeamMember) {
    if (!window.confirm(`Remove ${member.displayName || member.email} from the studio team?`)) {
      return;
    }
    setBusyId(member.id);
    try {
      await removeStudioTeamMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setSeats((prev) => ({
        ...prev,
        used: Math.max(0, prev.used - 1),
      }));
      showToast("Team member removed.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove member.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function onResetPassword(member: StudioTeamMember) {
    if (
      !window.confirm(
        `Generate a new temporary password for ${member.displayName || member.email}?`,
      )
    ) {
      return;
    }
    setBusyId(member.id);
    try {
      const res = await resetStudioTeamPassword(member.id);
      if (res.temporaryPassword) {
        setTempPassword(res.temporaryPassword);
      }
      showToast(res.message || "Password updated.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not reset password.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (!allowed) {
    const hasFeature = can("studioTeam");
    return (
      <div className="space-y-5">
        <div>
          <p className="font-display text-2xl tracking-tight text-zinc-900 dark:text-zinc-50">
            Studio team
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            {hasFeature
              ? "Only the studio owner can manage team members."
              : "Add assistants with role-based menu access on Premium."}
          </p>
        </div>
        {!hasFeature ? (
          <PlanUpgradeHint
            feature="studioTeam"
            suggestedPlanId="premium"
            title="Studio team is on Premium"
            description="Create assistant accounts and choose which menus each person can open."
          />
        ) : null}
      </div>
    );
  }

  if (loading) return <SettingsWorkflowSkeleton />;

  if (error) {
    return (
      <div className="border-l-2 border-red-500 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
        {error}
        <button type="button" className="ml-3 font-semibold underline" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  if (!studioTeamAvailable) {
    return (
      <div className="space-y-5">
        <div>
          <p className="font-display text-2xl tracking-tight text-zinc-900 dark:text-zinc-50">
            Studio team
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            Create accounts for assistants and control what they can open.
          </p>
        </div>
        <PlanUpgradeHint
          feature="studioTeam"
          suggestedPlanId="premium"
          title="Studio team is on Premium"
          description="Invite staff, assign roles, and keep owner-only tools off their menus."
        />
      </div>
    );
  }

  const seatPct =
    maxSeats != null && maxSeats > 0
      ? Math.min(100, Math.round((seats.used / maxSeats) * 100))
      : null;

  return (
    <div className="space-y-8">
      {tempPassword ? (
        <TemporaryPasswordBanner
          password={tempPassword}
          onDismiss={() => setTempPassword(null)}
        />
      ) : null}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-2xl tracking-tight text-zinc-900 dark:text-zinc-50">
            Studio team
          </p>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-500">
            Assistants sign in with the same login. You choose their role and which
            menus they can open.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={seatsFull}
          className="inline-flex shrink-0 items-center gap-2 self-start bg-[#55001F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#420018] disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          Add member
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="font-medium uppercase tracking-[0.14em] text-zinc-400">
            Seats
          </span>
          <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
            {seats.used}
            {maxSeats != null ? ` of ${maxSeats}` : ""} used
          </span>
        </div>
        {seatPct != null ? (
          <div className="h-1 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full bg-[#55001F] transition-[width] duration-300"
              style={{ width: `${seatPct}%` }}
            />
          </div>
        ) : null}
        {seatsFull ? (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Seat limit reached. Remove a member or upgrade your plan.
          </p>
        ) : null}
      </div>

      {members.length === 0 ? (
        <div className="border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
          <Users className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" aria-hidden />
          <p className="mt-4 font-display text-lg text-zinc-900 dark:text-zinc-50">
            No one on the team yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
            Add an assistant and assign the menus they need for day-to-day work.
          </p>
          <button
            type="button"
            onClick={openCreate}
            disabled={seatsFull}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#55001F] underline underline-offset-4 hover:text-[#420018] disabled:opacity-50 dark:text-[#e899b0]"
          >
            Add your first member
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {members.map((member) => {
            const label = member.displayName || member.email;
            const busy = busyId === member.id;
            const menuItems: MenuProps["items"] = [
              {
                key: "edit",
                icon: <Pencil className="h-3.5 w-3.5" aria-hidden />,
                label: "Edit access",
                onClick: () => openEdit(member),
              },
              {
                key: "reset",
                icon: busy ? (
                  <DashboardSpin size="small" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" aria-hidden />
                ),
                label: "Reset password",
                disabled: busy,
                onClick: () => void onResetPassword(member),
              },
              { type: "divider" },
              {
                key: "remove",
                danger: true,
                icon: <Trash2 className="h-3.5 w-3.5" aria-hidden />,
                label: "Remove",
                disabled: busy,
                onClick: () => void onRemove(member),
              },
            ];

            return (
              <li
                key={member.id}
                className="group flex items-center gap-4 py-5 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "inline-flex h-11 w-11 shrink-0 items-center justify-center text-xs font-semibold tracking-wide",
                    memberAvatarTone(member.email || member.id),
                  )}
                  aria-hidden
                >
                  {memberInitials(label)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
                      {member.displayName}
                    </p>
                    <span className="text-xs text-zinc-400">
                      {studioTeamRoleLabel(member.role)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">{member.email}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        member.status === "active"
                          ? "bg-emerald-500"
                          : "bg-zinc-300 dark:bg-zinc-600",
                      )}
                      aria-hidden
                    />
                    {member.status === "active" ? "Active" : "Disabled"}
                    {member.menuKeys.length > 0 ? (
                      <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    ) : null}
                    {member.menuKeys.length > 0 ? (
                      <span>
                        {member.menuKeys.length} menu
                        {member.menuKeys.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </p>
                </div>
                <Dropdown
                  menu={{ items: menuItems }}
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    aria-label={`Actions for ${label}`}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </button>
                </Dropdown>
              </li>
            );
          })}
        </ul>
      )}

      <FormModal
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        busy={creating}
        maxWidth="md"
      >
        <FormModalHeader
          icon={UserPlus}
          title="Add team member"
          description="Creates a new login for your studio. Leave password blank to auto-generate."
          onClose={() => !creating && setCreateOpen(false)}
          busy={creating}
        />
        <FormModalForm id="create-studio-member" onSubmit={(e) => void onCreate(e)}>
          <FormModalBody className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Email
              </label>
              <AuthFormInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="assistant@studio.com"
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Display name
              </label>
              <AuthFormInput
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ama"
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StudioTeamRole)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {roleOptions.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
              {roleOptions.find((r) => r.key === role)?.description ? (
                <p className="text-xs text-zinc-500">
                  {roleOptions.find((r) => r.key === role)?.description}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Password (optional)
              </label>
              <AuthFormInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to auto-generate"
                autoComplete="new-password"
              />
            </div>
            {menus.length > 0 ? (
              <MenuKeySelect
                menus={menus}
                selected={menuKeys}
                onChange={setMenuKeys}
                disabled={creating}
              />
            ) : null}
          </FormModalBody>
          <FormModalFooter
            formId="create-studio-member"
            onCancel={() => setCreateOpen(false)}
            submitLabel="Create"
            busyLabel="Creating…"
            busy={creating}
          />
        </FormModalForm>
      </FormModal>

      <FormModal
        open={Boolean(editMember)}
        onClose={() => !savingEdit && setEditMember(null)}
        busy={savingEdit}
        maxWidth="md"
      >
        <FormModalHeader
          icon={Pencil}
          title="Edit team member"
          description={editMember?.email}
          onClose={() => !savingEdit && setEditMember(null)}
          busy={savingEdit}
        />
        <FormModalForm id="edit-studio-member" onSubmit={(e) => void onSaveEdit(e)}>
          <FormModalBody className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Display name
              </label>
              <AuthFormInput
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Role
              </label>
              <select
                value={editRole}
                onChange={(e) => onEditRoleChange(e.target.value as StudioTeamRole)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {roleOptions.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(e.target.value === "disabled" ? "disabled" : "active")
                }
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            {menus.length > 0 ? (
              <MenuKeySelect
                menus={menus}
                selected={editMenuKeys}
                onChange={setEditMenuKeys}
                disabled={savingEdit}
              />
            ) : null}
          </FormModalBody>
          <FormModalFooter
            formId="edit-studio-member"
            onCancel={() => setEditMember(null)}
            submitLabel="Save"
            busyLabel="Saving…"
            busy={savingEdit}
          />
        </FormModalForm>
      </FormModal>
    </div>
  );
}
