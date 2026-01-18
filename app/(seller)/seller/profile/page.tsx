"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getImageUrl } from "@/lib/appwrite/storage";
import { useSellerProfile } from "@/lib/providers/SellerProfileProvider";
import { useSession } from "@/lib/auth/useSession";
import {
  EmailVerificationField,
  VerificationSuccessBanner,
} from "@/components/features/auth/EmailVerification";

type Feedback = { type: "success" | "error"; message: string } | null;
type SellerProfile = {
  $id: string;
  $updatedAt?: string;
  name?: string;
  email?: string;
  avatarId?: string | null;
  avatarUrl?: string | null;
};

import { Suspense } from "react";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ p: 10 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const { account } = useSession();
  const emailVerified = account?.emailVerification;

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    setProfileState,
  } = useSellerProfile();
  const [profileData, setProfileData] = useState<SellerProfile | null>(
    profile as SellerProfile | null
  );
  const [loadError, setLoadError] = useState<string | null>(profileError);
  const [infoForm, setInfoForm] = useState({ name: "", email: "" });
  const [initialInfoForm, setInitialInfoForm] = useState({
    name: "",
    email: "",
  }); // Track initial state
  const [infoFeedback, setInfoFeedback] = useState<Feedback>(null);
  const [infoSaving, setInfoSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<Feedback>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);

  // Check for verification success
  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowVerifiedBanner(true);
      window.dispatchEvent(new Event("session-changed"));
      window.history.replaceState({}, "", "/seller/profile");
      setTimeout(() => setShowVerifiedBanner(false), 10000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (profile) {
      setProfileData(profile as SellerProfile);
      setLoadError(null);
    }
  }, [profile]);

  useEffect(() => {
    if (profileError) {
      setLoadError(profileError);
    }
  }, [profileError]);

  useEffect(() => {
    if (!profileData) {
      return;
    }
    const formData = {
      name: profileData.name ?? "",
      email: profileData.email ?? "",
    };
    setInfoForm(formData);
    setInitialInfoForm(formData); // Set initial state for comparison
  }, [profileData]);

  // Detect if form has changes
  const hasInfoChanges = useMemo(() => {
    return (
      infoForm.name !== initialInfoForm.name ||
      infoForm.email !== initialInfoForm.email ||
      pendingAvatarFile !== null
    );
  }, [infoForm, initialInfoForm, pendingAvatarFile]);

  // Get only changed fields
  const getChangedFields = useCallback(() => {
    const changes: { name?: string; email?: string } = {};

    if (infoForm.name.trim() !== initialInfoForm.name) {
      changes.name = infoForm.name.trim();
    }

    if (infoForm.email.trim() !== initialInfoForm.email) {
      changes.email = infoForm.email.trim();
    }

    return changes;
  }, [infoForm, initialInfoForm]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Smart password validation
  const canSubmitPassword = useMemo(() => {
    return (
      passwordForm.current.trim() !== "" &&
      passwordForm.next.trim() !== "" &&
      passwordForm.next === passwordForm.confirm &&
      passwordForm.next.length >= 8
    );
  }, [passwordForm]);

  const passwordsMatch =
    passwordForm.next === "" || passwordForm.next === passwordForm.confirm;

  const handleResendVerification = async () => {
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body?.error || "Failed to send verification email");
    }
  };

  const avatarUrl = useMemo(() => {
    if (avatarPreview) {
      return avatarPreview;
    }
    if (profileData?.avatarId) {
      try {
        return getImageUrl("avatars", profileData.avatarId);
      } catch (error) {
        console.error("Failed to resolve avatar URL", error);
        return profileData?.avatarUrl ?? null;
      }
    }
    return profileData?.avatarUrl ?? null;
  }, [avatarPreview, profileData?.avatarId, profileData?.avatarUrl]);

  const initials = useMemo(() => {
    const name = profileData?.name?.trim();
    if (!name) {
      return "SE";
    }
    const letters = name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase())
      .join("");
    return letters.slice(0, 2) || "SE";
  }, [profileData?.name]);

  const handleInfoFieldChange =
    (field: "name" | "email") => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInfoForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleInfoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileData) {
      return;
    }

    // Get only changed fields
    const changedFields = getChangedFields();
    const hasAvatarChange = pendingAvatarFile !== null;

    // If nothing changed, don't submit
    if (Object.keys(changedFields).length === 0 && !hasAvatarChange) {
      setInfoFeedback({ type: "error", message: "No changes to save" });
      return;
    }

    setInfoSaving(true);
    setInfoFeedback(null);
    setAvatarFeedback(null);

    try {
      const updatedFields: string[] = [];

      // Only send changed fields
      if (Object.keys(changedFields).length > 0) {
        const res = await fetch("/api/seller/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(changedFields),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error || "Failed to update profile");
        }

        const nextProfile = body?.profile as SellerProfile | undefined;
        if (!nextProfile) {
          throw new Error("Profile payload missing from response");
        }
        setProfileData(nextProfile);
        setLoadError(null);
        setProfileState(nextProfile);

        // Track what was updated
        if (changedFields.name) updatedFields.push("Name");
        if (changedFields.email) {
          updatedFields.push("Email (verification sent)");
          window.dispatchEvent(new Event("session-changed"));
        }
      }

      // Handle avatar upload
      if (hasAvatarChange) {
        setAvatarUploading(true);
        try {
          const updatedProfile = await uploadAvatarFile(pendingAvatarFile!);
          if (avatarPreview && avatarPreview.startsWith("blob:")) {
            URL.revokeObjectURL(avatarPreview);
          }
          setAvatarPreview(updatedProfile?.avatarUrl ?? null);
          setProfileState(updatedProfile);
          setPendingAvatarFile(null);
          updatedFields.push("Avatar");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } catch (uploadError: any) {
          const message = uploadError?.message || "Failed to update avatar";
          setAvatarFeedback({ type: "error", message });
          throw new Error(message);
        } finally {
          setAvatarUploading(false);
        }
      }

      // Create specific success message
      const successMessage =
        updatedFields.length > 0
          ? `✓ Updated: ${updatedFields.join(", ")}`
          : "Profile updated successfully";

      setInfoFeedback({ type: "success", message: successMessage });

      // Update initial form state
      setInitialInfoForm({
        name: infoForm.name,
        email: infoForm.email,
      });
    } catch (error: any) {
      setInfoFeedback({
        type: "error",
        message: error?.message || "Profile update failed",
      });
    } finally {
      setInfoSaving(false);
    }
  };

  const handleInfoReset = () => {
    if (!profileData) {
      return;
    }
    // Reset to initial values
    setInfoForm({
      name: initialInfoForm.name,
      email: initialInfoForm.email,
    });
    setInfoFeedback(null);
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setPendingAvatarFile(null);
    setAvatarFeedback(null);
    setAvatarUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadAvatarFile = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("filename", file.name);

      const res = await fetch("/api/seller/profile/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || "Failed to update avatar");
      }

      const nextProfile = body?.profile as SellerProfile | undefined;
      if (!nextProfile) {
        throw new Error("Profile payload missing from response");
      }

      setProfileData(nextProfile);
      setLoadError(null);
      setProfileState(nextProfile);
      return nextProfile;
    },
    [setProfileState]
  );

  const handleAvatarButtonClick = () => {
    setAvatarFeedback(null);
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setAvatarFeedback(null);
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setPendingAvatarFile(file);
  };

  const handlePasswordFieldChange =
    (field: "current" | "next" | "confirm") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setPasswordForm((prev) => ({ ...prev, [field]: value }));
    };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordFeedback(null);

    try {
      const res = await fetch("/api/seller/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
          confirmPassword: passwordForm.confirm,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || "Failed to update password");
      }

      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordFeedback({
        type: "success",
        message: "✓ Password updated successfully",
      });
    } catch (error: any) {
      setPasswordFeedback({
        type: "error",
        message: error?.message || "Password update failed",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (profileLoading && !profileData) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Alert severity="error" variant="outlined">
          {loadError || "Unable to load your profile. Please refresh the page."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #ece8de",
          borderRadius: 3,
          p: { xs: 2.5, sm: 3 },
          display: "grid",
          gap: 3,
          bgcolor: "#fff",
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h6" fontWeight={900}>
            Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Personal info stays private; store details are public.
          </Typography>

          <VerificationSuccessBanner
            show={showVerifiedBanner}
            onClose={() => setShowVerifiedBanner(false)}
          />

          {infoFeedback && (
            <Alert severity={infoFeedback.type} variant="outlined">
              {infoFeedback.message}
            </Alert>
          )}
          {avatarFeedback && (
            <Alert severity={avatarFeedback.type} variant="outlined">
              {avatarFeedback.message}
            </Alert>
          )}
          {loadError && (
            <Alert severity="error" variant="outlined">
              {loadError}
            </Alert>
          )}
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: "#2d3b48",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "1rem",
              overflow: "hidden",
            }}
          >
            {avatarUrl ? (
              <Box
                component="img"
                src={avatarUrl}
                alt={`${infoForm.name || "Seller"} avatar`}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </Box>
          <div>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleAvatarButtonClick}
              disabled={avatarUploading}
              sx={{ mr: 1 }}
            >
              {avatarUploading ? "Uploading..." : "Change avatar"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
            {pendingAvatarFile && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.5 }}
              >
                New avatar will be applied after saving.
              </Typography>
            )}
          </div>
        </Stack>

        <Box
          component="form"
          onSubmit={handleInfoSubmit}
          sx={{ display: "grid", gap: 3 }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Stack spacing={2}>
              <TextField
                label="Full name"
                placeholder="Seller name"
                value={infoForm.name}
                onChange={handleInfoFieldChange("name")}
                fullWidth
                required
              />
              <EmailVerificationField
                label="Email"
                placeholder="seller@email.com"
                value={infoForm.email}
                onChange={handleInfoFieldChange("email")}
                fullWidth
                required
                isVerified={emailVerified}
                showVerificationStatus={true}
                onResendVerification={handleResendVerification}
              />
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              disabled={infoSaving}
              onClick={handleInfoReset}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              disabled={!hasInfoChanges || infoSaving}
            >
              {infoSaving ? "Saving..." : "Save changes"}
            </Button>
          </Stack>
        </Box>

        <Divider />

        <Accordion
          expanded={passwordExpanded}
          onChange={(_, expanded) => setPasswordExpanded(expanded)}
          sx={{ borderRadius: 2, border: "1px solid #ece8de" }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" fontWeight={800}>
                Change password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Keep your account secure by updating your password regularly.
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack component="form" spacing={2} onSubmit={handlePasswordSubmit}>
              {passwordFeedback && (
                <Alert severity={passwordFeedback.type} variant="outlined">
                  {passwordFeedback.message}
                </Alert>
              )}
              <TextField
                label="Current password"
                type="password"
                value={passwordForm.current}
                onChange={handlePasswordFieldChange("current")}
                fullWidth
                required
              />
              <TextField
                label="New password"
                type="password"
                value={passwordForm.next}
                onChange={handlePasswordFieldChange("next")}
                fullWidth
                required
                helperText="Minimum 8 characters"
              />
              <TextField
                label="Confirm new password"
                type="password"
                value={passwordForm.confirm}
                onChange={handlePasswordFieldChange("confirm")}
                fullWidth
                required
                error={passwordForm.confirm !== "" && !passwordsMatch}
                helperText={
                  passwordForm.confirm && !passwordsMatch
                    ? "Passwords don't match"
                    : ""
                }
              />
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  disableElevation
                  disabled={!canSubmitPassword || passwordSaving}
                >
                  {passwordSaving ? "Updating..." : "Update password"}
                </Button>
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
}

