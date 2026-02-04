import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AvatarUpload from "@/components/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save, LogOut } from "lucide-react";
import { toast } from "sonner";
import { authApi, profilesApi } from "@/lib/api";

import { COLLEGES } from "@/lib/constants";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    college: "",
    phone: "",
    avatar_url: "",
  });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const session = authApi.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Set initial data from session
      if (session.user.profile) {
        setFormData({
          full_name: session.user.profile.full_name || "",
          college: session.user.profile.college || "",
          phone: session.user.profile.phone || "",
          avatar_url: session.user.profile.avatar_url || "",
        });
      }
      setIsLoading(false);
    };

    checkAuthAndFetch();

    // Listen for logout
    const handleLogout = () => {
      navigate("/auth");
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);

    try {
      await profilesApi.update({
        full_name: formData.full_name || undefined,
        college: formData.college || undefined,
        phone: formData.phone || undefined,
      });

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await authApi.signOut();
    navigate("/");
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              My Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              Update your personal information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Section */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <AvatarUpload
                userId={user?.id || ""}
                currentAvatarUrl={formData.avatar_url || null}
                onAvatarChange={(url) => setFormData({ ...formData, avatar_url: url })}
              />
            </div>

            {/* Profile Details */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">
                Personal Details
              </h2>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="text"
                  inputMode="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              {/* College */}
              <div className="space-y-2">
                <Label htmlFor="college">College / University</Label>
                <select
                  id="college"
                  value={formData.college}
                  onChange={(e) =>
                    setFormData({ ...formData, college: e.target.value })
                  }
                  className="flex h-11 w-full rounded-lg border-2 border-input bg-background px-4 py-2 text-base transition-all duration-200 focus-visible:outline-none focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  <option value="">Select your college</option>
                  {COLLEGES.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                variant="sell"
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
