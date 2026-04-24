import { useEffect, useRef, useState } from "react"
// profile state is shared via UserProfileContext
import { Camera, Loader2, Mail, Save, Shield, Trash2, User } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import profileService from "@/features/users/services/profileService"
import { useUserProfile } from "@/features/users/context/UserProfileContext"

export default function ProfilePage() {
  const { profile, profileLoading, setProfile } = useUserProfile()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ firstName: "", lastName: "" })
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (profile) {
      setForm({ firstName: profile.firstName || "", lastName: profile.lastName || "" })
    }
  }, [profile])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await profileService.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        profileImage: profile?.profileImage ?? null,
      })
      setProfile(updated)
      toast.success("Profile updated")
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB")
      return
    }
    setUploading(true)
    try {
      const { url } = await profileService.uploadImage(file)
      setProfile(prev => ({ ...prev, profileImage: url }))
      toast.success("Profile image updated")
    } catch {
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const removeImage = async () => {
    setUploading(true)
    try {
      await profileService.removeImage()
      setProfile(prev => ({ ...prev, profileImage: null }))
      toast.success("Profile image removed")
    } catch {
      toast.error("Failed to remove image")
    } finally {
      setUploading(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    )
  }

  const displayName = profile
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "User"
    : "User"
  const initials = displayName
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="w-full space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">ACCOUNT · PROFILE</p>
        <h1 className="mt-1.5 text-[2rem] font-bold leading-tight text-navy">Identity & access.</h1>
        <p className="mt-1 text-sm text-[#5a6b98]">Manage your profile details, image, and account information.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Role", value: profile?.role || "USER", cls: "bg-[#001d45] text-white" },
          { label: "Auth", value: profile?.authProvider === "GOOGLE" ? "Google" : "Local", cls: "bg-brand text-white" },
          {
            label: "Joined",
            value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—",
            cls: "bg-emerald-500 text-white",
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.cls}`}>
            <p className="truncate text-base font-bold leading-none">{s.value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
      {/* Avatar card */}
      <div className="rounded-[20px] border border-white/60 bg-white p-6 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
        <div className="flex items-center gap-6">
          {/* Avatar with upload overlay */}
          <div className="relative shrink-0">
            <div className="h-24 w-24 rounded-2xl overflow-hidden">
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-brand to-brand/60 flex items-center justify-center text-2xl font-bold text-white">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : initials}
                </div>
              )}
              {uploading && profile?.profileImage && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Info + actions */}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-navy truncate">{displayName}</p>
            <p className="text-sm text-slate-500 truncate">{profile?.email}</p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
              <Shield className="h-3 w-3" />
              {profile?.role}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-brand/30 bg-brand/5 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/10 transition-colors disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" />
                {profile?.profileImage ? "Change Photo" : "Upload Photo"}
              </button>
              {profile?.profileImage && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={removeImage}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">JPG, PNG or GIF · max 10 MB</p>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Edit form */}
      <form onSubmit={save} className="rounded-[20px] border border-white/60 bg-white p-6 shadow-[0_14px_40px_rgba(21,32,85,0.08)] space-y-5">
        <h2 className="text-base font-semibold text-navy">Personal Information</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              First Name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                required
                value={form.firstName}
                onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                className="pl-10 h-11 rounded-xl border-slate-200"
                placeholder="First name"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Last Name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                required
                value={form.lastName}
                onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                className="pl-10 h-11 rounded-xl border-slate-200"
                placeholder="Last name"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Email Address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              disabled
              value={profile?.email || ""}
              className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-slate-400">Email address cannot be changed.</p>
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            disabled={saving}
            className="h-11 rounded-xl bg-brand text-white font-semibold hover:bg-brand/90 shadow-[0_4px_14px_rgba(244,94,43,0.25)] gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
      </div>

      {/* Account details */}
      <div className="rounded-[20px] border border-white/60 bg-white p-6 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
        <h2 className="text-base font-semibold text-navy mb-4">Account Details</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Account Type</span>
            <span className="font-medium text-navy">
              {profile?.authProvider === "GOOGLE" ? "Google Account" : "Local Account"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role</span>
            <span className="font-medium text-navy">{profile?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Member Since</span>
            <span className="font-medium text-navy">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
