"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/Pagination";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import {
  useDeleteProfile,
  useDeleteUser,
  useProfiles,
  useToggleBlock,
  useTogglePublish,
  useToggleVerify,
  useToggleVip,
  useTogglePremium,
  useUsers,
} from "@/lib/hooks/admin";
import { relativeTime, buildImageUrl } from "@/lib/utils";
import { shareProfilesViaWhatsApp } from "@/lib/profile-share";
import type { AdminProfile } from "@/lib/types/profile";
import type { AdminUser, Gender } from "@/lib/types/user";
import type { MaritalStatus } from "@/lib/types/profile";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
type SortKey = "createdAt" | "age";
type View = "profiles" | "accounts";

export default function UsersPage() {
  const [view, setView] = useState<View>("profiles");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [profileNumber, setProfileNumber] = useState("");
  const [gender, setGender] = useState<"" | Gender>("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [religion, setReligion] = useState("");
  const [caste, setCaste] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [maritalStatus, setMaritalStatus] = useState<"" | MaritalStatus>("");
  const [motherTongue, setMotherTongue] = useState("");
  const [education, setEducation] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const filters = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      order,
      search: search.trim() || undefined,
      profileNumber: profileNumber.trim() || undefined,
      gender: gender || undefined,
      ageMin: ageMin ? Number(ageMin) : undefined,
      ageMax: ageMax ? Number(ageMax) : undefined,
      religion: religion.trim() || undefined,
      caste: caste.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      maritalStatus: maritalStatus || undefined,
      motherTongue: motherTongue.trim() || undefined,
      education: education.trim() || undefined,
    }),
    [
      page,
      limit,
      sortBy,
      order,
      search,
      profileNumber,
      gender,
      ageMin,
      ageMax,
      religion,
      caste,
      city,
      state,
      maritalStatus,
      motherTongue,
      education,
    ],
  );

  const { data, isLoading, error } = useProfiles(filters, view === "profiles");
  const verify = useToggleVerify();
  const publish = useTogglePublish();
  const vip = useToggleVip();
  const premium = useTogglePremium();
  const deleteProfile = useDeleteProfile();
  const [toDelete, setToDelete] = useState<AdminProfile | null>(null);
  const rows = data?.data ?? [];

  // Accounts view — lists every signup (incl. those without a profile) via
  // GET /admin/users. The backend only accepts pagination params here.
  const accountsQuery = useUsers({ page, limit, sortBy: "createdAt", order }, view === "accounts");
  const accounts = accountsQuery.data?.data ?? [];
  const toggleBlock = useToggleBlock();
  const deleteUser = useDeleteUser();
  const [toDeleteAccount, setToDeleteAccount] = useState<AdminUser | null>(null);

  const [selected, setSelected] = useState<Record<string, AdminProfile>>({});
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const selectedList = Object.values(selected);
  const selectedCount = selectedList.length;
  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected[r.id]);

  function toggleOne(p: AdminProfile, checked: boolean) {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[p.id] = p;
      else delete next[p.id];
      return next;
    });
  }

  function toggleAllOnPage(checked: boolean) {
    setSelected((prev) => {
      const next = { ...prev };
      for (const r of rows) {
        if (checked) next[r.id] = r;
        else delete next[r.id];
      }
      return next;
    });
  }

  async function shareViaWhatsApp() {
    if (selectedCount === 0) return;
    setIsSharingWhatsApp(true);
    try {
      await shareProfilesViaWhatsApp(selectedList);
    } catch (e) {
      console.error("WhatsApp share failed:", e);
      toast.error("Failed to share via WhatsApp");
    } finally {
      setIsSharingWhatsApp(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setProfileNumber("");
    setGender("");
    setAgeMin("");
    setAgeMax("");
    setReligion("");
    setCaste("");
    setCity("");
    setState("");
    setMaritalStatus("");
    setMotherTongue("");
    setEducation("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-(--color-muted-foreground)">
            {view === "profiles"
              ? "All user profiles, including unpublished."
              : "Every registered account, including signups without a profile."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/users/bulk">
              <Upload className="h-4 w-4" />
              Bulk import
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/users/new">
              <Plus className="h-4 w-4" />
              Add profile
            </Link>
          </Button>
          {view === "profiles" && (
            <>
              {selectedCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelected({})}>
                  Clear ({selectedCount})
                </Button>
              )}
              <Button
                size="sm"
                className="bg-[#25D366] text-white hover:bg-[#1da851]"
                onClick={shareViaWhatsApp}
                disabled={selectedCount === 0 || isSharingWhatsApp}
              >
                {isSharingWhatsApp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <WhatsAppIcon className="h-4 w-4" />
                )}
                {isSharingWhatsApp
                  ? "Sharing…"
                  : `WhatsApp${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="inline-flex rounded-[var(--radius)] border border-(--color-border) p-0.5">
        <button
          type="button"
          onClick={() => {
            setView("profiles");
            setPage(1);
          }}
          className={`rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "profiles"
              ? "bg-(--color-primary) text-(--color-primary-foreground)"
              : "text-(--color-muted-foreground) hover:text-(--color-foreground)"
          }`}
        >
          Profiles
        </button>
        <button
          type="button"
          onClick={() => {
            setView("accounts");
            setPage(1);
          }}
          className={`rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "accounts"
              ? "bg-(--color-primary) text-(--color-primary-foreground)"
              : "text-(--color-muted-foreground) hover:text-(--color-foreground)"
          }`}
        >
          All accounts
        </button>
      </div>

      {view === "profiles" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Input
              className="w-40"
              placeholder="Profile no. (Maher001)"
              value={profileNumber}
              onChange={(e) => {
                setProfileNumber(e.target.value);
                setPage(1);
              }}
            />
            <Input
              className="flex-1 min-w-[220px]"
              placeholder="Search about / occupation…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value as "" | Gender);
                setPage(1);
              }}
              className="w-36"
            >
              <option value="">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <Select
              value={maritalStatus}
              onChange={(e) => {
                setMaritalStatus(e.target.value as "" | MaritalStatus);
                setPage(1);
              }}
              className="w-44"
            >
              <option value="">All marital status</option>
              <option value="Never_Married">Never Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
              <option value="Awaiting_Divorce">Awaiting Divorce</option>
              <option value="Second_Marriage">Second Marriage</option>
            </Select>
            <Input
              className="w-24"
              type="number"
              placeholder="Age min"
              value={ageMin}
              onChange={(e) => {
                setAgeMin(e.target.value);
                setPage(1);
              }}
            />
            <Input
              className="w-24"
              type="number"
              placeholder="Age max"
              value={ageMax}
              onChange={(e) => {
                setAgeMax(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              className="w-40"
              placeholder="Religion"
              value={religion}
              onChange={(e) => {
                setReligion(e.target.value);
                setPage(1);
              }}
            />
            <Input
              className="w-40"
              placeholder="Caste"
              value={caste}
              onChange={(e) => {
                setCaste(e.target.value);
                setPage(1);
              }}
            />
            <Input
              className="w-40"
              placeholder="City"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
            />
            <Input
              className="w-40"
              placeholder="State"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setPage(1);
              }}
            />
            <Input
              className="w-44"
              placeholder="Mother tongue"
              value={motherTongue}
              onChange={(e) => {
                setMotherTongue(e.target.value);
                setPage(1);
              }}
            />
            <Input
              className="w-44"
              placeholder="Education"
              value={education}
              onChange={(e) => {
                setEducation(e.target.value);
                setPage(1);
              }}
            />
            <Select
              value={`${sortBy}:${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split(":");
                setSortBy(s as SortKey);
                setOrder(o as "asc" | "desc");
              }}
              className="w-44"
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="age:asc">Age ↑</option>
              <option value="age:desc">Age ↓</option>
            </Select>
            <Select
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-28"
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </Select>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      )}

      {view === "accounts" && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(limit)}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="w-28"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </Select>
          <Select
            value={order}
            onChange={(e) => {
              setOrder(e.target.value as "asc" | "desc");
              setPage(1);
            }}
            className="w-40"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </Select>
        </div>
      )}

      <div className="rounded-[var(--radius)] border border-(--color-border) bg-(--color-card) overflow-x-auto">
        {view === "profiles" && (
          <Table>
            <THead>
              <TR>
                <TH className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all on page"
                    className="h-4 w-4 cursor-pointer accent-(--color-primary)"
                    checked={allOnPageSelected}
                    onChange={(e) => toggleAllOnPage(e.target.checked)}
                  />
                </TH>
                <TH>Photo</TH>
                <TH>Profile No.</TH>
                <TH>Name</TH>
                <TH>Gender</TH>
                <TH>Age</TH>
                <TH>Phone</TH>
                <TH>Email</TH>
                <TH>City</TH>
                <TH>State</TH>
                <TH>Religion</TH>
                <TH>Caste</TH>
                <TH>Education</TH>
                <TH>Occupation</TH>
                <TH>Income</TH>
                <TH>Height</TH>
                <TH>Marital</TH>
                <TH>Mother tongue</TH>
                <TH>Verified</TH>
                <TH>Published</TH>
                <TH>Created</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TR key={i}>
                    {Array.from({ length: 22 }).map((__, j) => (
                      <TD key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TD>
                    ))}
                  </TR>
                ))}
              {!isLoading && rows.length === 0 && (
                <TR>
                  <TD colSpan={22} className="text-center text-(--color-muted-foreground) py-8">
                    No profiles found.
                  </TD>
                </TR>
              )}
              {!isLoading &&
                rows.map((p) => {
                  const primary = p.images?.find((i) => i.isPrimary) ?? p.images?.[0];
                  const primarySrc = buildImageUrl(API_BASE, primary?.url);
                  const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "\u2014";
                  return (
                    <TR key={p.id}>
                      <TD>
                        <input
                          type="checkbox"
                          aria-label={`Select ${p.profileNumber ?? name}`}
                          className="h-4 w-4 cursor-pointer accent-(--color-primary)"
                          checked={!!selected[p.id]}
                          onChange={(e) => toggleOne(p, e.target.checked)}
                        />
                      </TD>
                      <TD>
                        <Link href={`/users/${p.id}`}>
                          {primarySrc ? (
                            <Image
                              src={primarySrc}
                              alt=""
                              width={48}
                              height={64}
                              unoptimized
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="h-16 w-12 rounded bg-(--color-surface-muted)" />
                          )}
                        </Link>
                      </TD>
                      <TD>
                        <Link href={`/users/${p.id}`} className="font-medium hover:underline">
                          {p.profileNumber ?? "\u2014"}
                        </Link>
                      </TD>
                      <TD>
                        <Link href={`/users/${p.id}`} className="font-medium hover:underline">
                          {name}
                        </Link>
                      </TD>
                      <TD>{p.gender}</TD>
                      <TD>{p.age}</TD>
                      <TD className="text-(--color-muted-foreground)">{p.phone}</TD>
                      <TD className="text-(--color-muted-foreground)">{p.email}</TD>
                      <TD>{p.city}</TD>
                      <TD>{p.state}</TD>
                      <TD>{p.religion}</TD>
                      <TD>{p.caste}</TD>
                      <TD>{p.education}</TD>
                      <TD>{p.occupation}</TD>
                      <TD>{p.income}</TD>
                      <TD>{p.height}</TD>
                      <TD>{p.maritalStatus?.replace("_", " ")}</TD>
                      <TD>{p.motherTongue}</TD>
                      <TD>
                        <div className="flex flex-col gap-1">
                          {p.isProfileVerified ? (
                            <Badge className="border-transparent bg-[#0b3d91] text-white w-fit">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="w-fit">
                              No
                            </Badge>
                          )}
                          {p.isVip && (
                            <Badge className="border-transparent bg-[#d4af37] text-black w-fit">
                              VIP
                            </Badge>
                          )}
                          {p.isPremium && (
                            <Badge className="border-transparent bg-yellow-400 text-black w-fit">
                              Premium
                            </Badge>
                          )}
                        </div>
                      </TD>
                      <TD>
                        {p.isPublished ? (
                          <Badge variant="success">Yes</Badge>
                        ) : (
                          <Badge variant="warning">Draft</Badge>
                        )}
                      </TD>
                      <TD className="text-(--color-muted-foreground)">
                        {relativeTime(p.createdAt)}
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => verify.mutate(p.id)}
                            disabled={verify.isPending}
                          >
                            {p.isProfileVerified ? "Unverify" : "Verify"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => vip.mutate(p.id)}
                            disabled={vip.isPending}
                          >
                            {p.isVip ? "Un-VIP" : "VIP"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => premium.mutate(p.id)}
                            disabled={premium.isPending}
                          >
                            {p.isPremium ? "Un-Premium" : "Premium"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (!p.isPublished && (p.images?.length ?? 0) < 1) {
                                toast.error("At least one photo is required before publishing.");
                                return;
                              }
                              publish.mutate(p.id);
                            }}
                            disabled={publish.isPending}
                          >
                            {p.isPublished ? "Unpublish" : "Publish"}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setToDelete(p)}>
                            Delete
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
            </TBody>
          </Table>
        )}

        {view === "accounts" && (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH>Gender</TH>
                <TH>Email verified</TH>
                <TH>Profile</TH>
                <TH>Published</TH>
                <TH>Profile verified</TH>
                <TH>Status</TH>
                <TH>Created</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {accountsQuery.isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TR key={i}>
                    {Array.from({ length: 11 }).map((__, j) => (
                      <TD key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TD>
                    ))}
                  </TR>
                ))}
              {!accountsQuery.isLoading && accounts.length === 0 && (
                <TR>
                  <TD colSpan={11} className="text-center text-(--color-muted-foreground) py-8">
                    No accounts found.
                  </TD>
                </TR>
              )}
              {!accountsQuery.isLoading &&
                accounts.map((u) => {
                  const name = `${u.firstName} ${u.lastName}`;
                  const hasProfile = u.hasProfile ?? !!u.profile;
                  return (
                    <TR key={u.id}>
                      <TD>
                        <Link
                          href={`/users/${u.id}/account`}
                          className="font-medium hover:underline"
                        >
                          {name}
                        </Link>
                      </TD>
                      <TD className="text-(--color-muted-foreground)">{u.email}</TD>
                      <TD className="text-(--color-muted-foreground)">{u.phone}</TD>
                      <TD>{u.gender}</TD>
                      <TD>
                        {u.isVerified ? (
                          <Badge variant="success">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TD>
                      <TD>
                        {hasProfile ? (
                          <Link href={`/users/${u.id}`} className="font-medium hover:underline">
                            {u.profile?.profileNumber ?? "View"}
                          </Link>
                        ) : (
                          <Badge variant="outline">None</Badge>
                        )}
                      </TD>
                      <TD>
                        {!hasProfile ? (
                          <span className="text-(--color-muted-foreground)">—</span>
                        ) : u.profile?.isPublished ? (
                          <Badge variant="success">Yes</Badge>
                        ) : (
                          <Badge variant="warning">Draft</Badge>
                        )}
                      </TD>
                      <TD>
                        {!hasProfile ? (
                          <span className="text-(--color-muted-foreground)">—</span>
                        ) : u.profile?.isVerified ? (
                          <Badge variant="success">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TD>
                      <TD>
                        {u.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="danger">Blocked</Badge>
                        )}
                      </TD>
                      <TD className="text-(--color-muted-foreground)">
                        {relativeTime(u.createdAt)}
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/users/${u.id}/account`}>View</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleBlock.mutate(u.id)}
                            disabled={toggleBlock.isPending}
                          >
                            {u.isActive ? "Block" : "Unblock"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setToDeleteAccount(u)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
            </TBody>
          </Table>
        )}
      </div>

      {error && <p className="text-sm text-(--color-danger)">{(error as Error).message}</p>}
      {accountsQuery.error && (
        <p className="text-sm text-(--color-danger)">{(accountsQuery.error as Error).message}</p>
      )}

      <PaginationBar
        page={
          view === "accounts"
            ? (accountsQuery.data?.meta?.page ?? page)
            : (data?.meta?.page ?? page)
        }
        limit={
          view === "accounts"
            ? (accountsQuery.data?.meta?.limit ?? limit)
            : (data?.meta?.limit ?? limit)
        }
        total={
          view === "accounts" ? (accountsQuery.data?.meta?.total ?? 0) : (data?.meta?.total ?? 0)
        }
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete profile?"
        description={`This clears all matrimony details and images for ${toDelete?.profileNumber ?? "this profile"}. The login account is kept. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (toDelete) await deleteProfile.mutateAsync(toDelete.id);
        }}
      />

      <ConfirmDialog
        open={!!toDeleteAccount}
        onOpenChange={(o) => !o && setToDeleteAccount(null)}
        title="Delete account?"
        description={`This permanently removes the account for ${toDeleteAccount ? `${toDeleteAccount.firstName} ${toDeleteAccount.lastName}` : "this user"} along with their profile and images. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (toDeleteAccount) await deleteUser.mutateAsync(toDeleteAccount.id);
        }}
      />
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}
