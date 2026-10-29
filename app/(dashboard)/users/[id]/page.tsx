"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import DownloadProfilePDF from "@/components/forms/DownloadProfilePDF";
import {
  useProfile,
  useProfileCompletion,
  useTogglePublish,
  useToggleVerify,
  useToggleVip,
  useTogglePremium,
  useToggleImagePrivacy,
  useDeleteProfile,
} from "@/lib/hooks/admin";
import { formatDate, buildImageUrl, toDisplayImageSrc } from "@/lib/utils";
import { shareProfilesViaWhatsApp } from "@/lib/profile-share";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: p, isLoading, error } = useProfile(id);
  const { data: completion } = useProfileCompletion(id);
  const verify = useToggleVerify();
  const publish = useTogglePublish();
  const vip = useToggleVip();
  const premium = useTogglePremium();
  const togglePrivacy = useToggleImagePrivacy();
  const deleteProfile = useDeleteProfile();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <Skeleton className="h-64" />;
  if (error || !p) {
    return (
      <div className="space-y-4">
        <Back />
        <p className="text-sm text-(--color-danger)">Profile not found.</p>
      </div>
    );
  }

  const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || `Profile ${id}`;

  return (
    <div className="space-y-6">
      <Back />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          <div className="text-sm text-(--color-muted-foreground) mt-1">
            {p.age} yrs · {p.city}, {p.state} · {p.occupation}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {p.profileNumber && <Badge variant="outline">{p.profileNumber}</Badge>}
            <Badge
              className={
                p.isProfileVerified
                  ? "border-transparent bg-[#0b3d91] text-white"
                  : undefined
              }
              variant={p.isProfileVerified ? "default" : "outline"}
            >
              {p.isProfileVerified ? "Verified" : "Unverified"}
            </Badge>
            {p.isVip && (
              <Badge className="border-transparent bg-[#d4af37] text-black">VIP</Badge>
            )}
            {p.isPremium && (
              <Badge className="border-transparent bg-yellow-400 text-black">Premium</Badge>
            )}
            <Badge variant={p.isPublished ? "success" : "warning"}>
              {p.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <DownloadProfilePDF profile={p} />
          <Button
            variant="outline"
            className="bg-[#25D366]/10"
            onClick={() => {
              void shareProfilesViaWhatsApp([p]).catch((e) => {
                console.error("WhatsApp share failed:", e);
                toast.error("Failed to share via WhatsApp");
              });
            }}
          >
            WhatsApp
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/users/${id}/edit`}>Edit</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/users/${id}/account`}>Account</Link>
          </Button>
          <Button variant="outline" onClick={() => verify.mutate(id)} disabled={verify.isPending}>
            {p.isProfileVerified ? "Unverify" : "Verify"}
          </Button>
          <Button variant="outline" onClick={() => vip.mutate(id)} disabled={vip.isPending}>
            {p.isVip ? "Remove VIP" : "Mark VIP"}
          </Button>
          <Button
            variant="outline"
            onClick={() => premium.mutate(id)}
            disabled={premium.isPending}
          >
            {p.isPremium ? "Remove Premium" : "Mark Premium"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (!p.isPublished && (p.images?.length ?? 0) < 1) {
                toast.error("At least one photo is required before publishing.");
                return;
              }
              publish.mutate(id);
            }}
            disabled={publish.isPending}
          >
            {p.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(p.images ?? []).length === 0 && (
              <p className="text-sm text-(--color-muted-foreground)">No photos uploaded.</p>
            )}
            {(p.images ?? [])
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((img) => {
                const src = buildImageUrl(API_BASE, img.url);
                return (
                  <div key={img.id} className="space-y-2">
                    <div className="relative">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={toDisplayImageSrc(src) ?? src}
                          alt=""
                          className="aspect-[3/4] w-full rounded object-cover bg-(--color-surface-muted)"
                        />
                      ) : (
                        <div className="aspect-[3/4] w-full rounded bg-(--color-surface-muted)" />
                      )}
                      <div className="absolute top-1 left-1 flex gap-1">
                        {img.isPrimary && (
                          <Badge variant="default" className="text-[10px]">
                            Primary
                          </Badge>
                        )}
                        {img.isPrivate && (
                          <Badge variant="secondary" className="text-[10px]">
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => togglePrivacy.mutate({ imageId: img.id, profileId: id })}
                      disabled={togglePrivacy.isPending}
                    >
                      {img.isPrivate ? "Make Public" : "Make Private"}
                    </Button>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {completion && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Profile completion</span>
                  <span className="text-(--color-muted-foreground) font-normal">
                    {completion.overallPercentage}% · {completion.totalCompleted}/
                    {completion.totalRequired}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-2 w-full rounded-full bg-(--color-surface-muted)">
                  <div
                    className="h-2 rounded-full bg-(--color-primary)"
                    style={{ width: `${completion.overallPercentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {completion.sections.map((s) => (
                    <div
                      key={s.section}
                      className="flex items-center justify-between gap-2 rounded border border-(--color-border) px-3 py-2 text-sm"
                    >
                      <span className="capitalize text-(--color-muted-foreground)">
                        {s.section.replace(/_/g, " ")}
                      </span>
                      <Badge variant={s.percentage === 100 ? "success" : "outline"}>
                        {s.completed}/{s.total}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Personal</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Row k="Profile no." v={p.profileNumber ?? "—"} />
              <Row k="Age" v={String(p.age)} />
              <Row k="Gender" v={p.gender} />
              <Row k="Height" v={p.height} />
              <Row k="Complexion" v={p.complexion} />
              <Row k="Marital status" v={p.maritalStatus.replace(/_/g, " ")} />
              <Row
                k="Has children"
                v={
                  typeof p.hasChildren === "boolean"
                    ? p.hasChildren
                      ? "Yes"
                      : "No"
                    : "—"
                }
              />
              <Row k="Mother tongue" v={p.motherTongue} />
              <Row k="Languages known" v={p.languagesKnown?.join(", ")} />
              <Row k="Family type" v={p.familyType?.replace(/_/g, " ")} />
              <Row k="User ID" v={p.userId ?? p.id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Education &amp; career</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Row k="Education" v={p.education} />
              <Row k="University" v={p.educationUniversity} />
              <Row k="Education city" v={p.educationCity} />
              <Row k="Occupation" v={p.occupation} />
              <Row k="Income" v={p.income} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Background</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Row k="Religion" v={p.religion} />
              <Row k="Caste" v={p.caste} />
              <Row k="Caste preference" v={p.castePreference} />
              <Row k="Marriage preference" v={p.marriagePreference} />
              <Row k="City" v={p.city} />
              <Row k="State" v={p.state} />
              <Row k="Home town" v={p.homeTown} />
              <Row k="Created" v={formatDate(p.createdAt)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Address</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Row k="Address city" v={p.addressCity} />
              <Row k="Address area" v={p.addressArea} />
              <Row k="Current address (private)" v={p.currentAddress} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Family</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Row k="Father name" v={p.fatherName} />
              <Row k="Father occupation" v={p.fatherOccupation} />
              <Row k="Mother name" v={p.motherName} />
              <Row k="Mother occupation" v={p.motherOccupation} />
              <Row k="Total siblings" v={p.totalSiblings} />
              <Row k="Brother education" v={p.brotherEducation} />
              <Row k="Sister education" v={p.sisterEducation} />
              {(p.siblings ?? []).map((s, i) => (
                <Row
                  key={i}
                  k={`Sibling ${i + 1}`}
                  v={[s.name, s.relation, s.ageRelation, s.maritalStatus, s.education, s.profession]
                    .filter(Boolean)
                    .join(" — ")}
                />
              ))}
              {(p.children ?? []).map((c, i) => (
                <Row
                  key={`child-${i}`}
                  k={`Child ${i + 1}`}
                  v={[
                    c.age ? `Age ${c.age}` : null,
                    c.gender,
                    typeof c.stayingWithYou === "boolean"
                      ? c.stayingWithYou
                        ? "Staying with you"
                        : "Not staying with you"
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" — ")}
                />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contact numbers (private)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Row k="Father phone" v={p.fatherPhone} />
              <Row k="Mother phone" v={p.motherPhone} />
              <Row k="Other phone" v={p.otherPhone} />
              <Row k="Coordinator number" v={p.coordinatorNumber} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">About</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 whitespace-pre-wrap">{p.about}</CardContent>
          </Card>
          {p.otherDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Other details</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 whitespace-pre-wrap">
                {p.otherDetails}
              </CardContent>
            </Card>
          )}
          {p.interests?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Interests</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {p.interests.map((i) => (
                  <Badge key={i} variant="secondary">
                    {i}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete profile?"
        description={`This clears all matrimony details and images for ${p.profileNumber ?? "this profile"}. The login account is kept. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deleteProfile.mutateAsync(id);
          router.push("/users");
        }}
      />
    </div>
  );
}

function Back() {
  return (
    <Link
      href="/users"
      className="text-sm text-(--color-muted-foreground) inline-flex items-center gap-1 hover:text-(--color-foreground)"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to users
    </Link>
  );
}

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex justify-between gap-2 border-b border-(--color-border) pb-2 last:border-0">
      <span className="text-(--color-muted-foreground)">{k}</span>
      <span className="font-medium text-right">{v ? v : "—"}</span>
    </div>
  );
}
