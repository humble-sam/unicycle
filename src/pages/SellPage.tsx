import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Laptop,
  BookOpen,
  Sofa,
  UtensilsCrossed,
  Car,
  Gift,
  ArrowRight,
  ArrowLeft,
  Check,
  IndianRupee,
  MapPin,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { authApi, productsApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const categories = [
  { id: "electronics", title: "Electronics", icon: Laptop, description: "Laptops, phones, gadgets, and accessories" },
  { id: "books-stationary", title: "Books & Stationary", icon: BookOpen, description: "Textbooks, notes, pens, and office supplies" },
  { id: "furniture", title: "Furniture", icon: Sofa, description: "Desks, chairs, and room furniture" },
  { id: "kitchen-items", title: "Kitchen Items", icon: UtensilsCrossed, description: "Utensils, appliances, and cookware" },
  { id: "vehicles", title: "Vehicles", icon: Car, description: "Cycles, bikes, scooters, and cars" },
  { id: "giveaways", title: "Giveaways", icon: Gift, description: "Free items for fellow students" },
];

const conditions = [
  {
    id: "like-new",
    title: "Like New",
    description: "Barely used, no visible wear. Works perfectly.",
    emoji: "✨",
  },
  {
    id: "good",
    title: "Good",
    description: "Some signs of use but works well. Minor scratches.",
    emoji: "👍",
  },
  {
    id: "well-used",
    title: "Well Used",
    description: "Clearly used but fully functional. Great value.",
    emoji: "💪",
  },
];

const SellPage = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ college: string | null } | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    condition: "",
    title: "",
    description: "",
    price: "",
    negotiable: true,
    images: [] as string[],
  });
  const [productCreationEnabled, setProductCreationEnabled] = useState(true);
  const navigate = useNavigate();

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const session = authApi.getSession();
      if (session?.user) {
        setUser(session.user);
        setUserProfile({ college: session.user.profile?.college || null });
      }
    };

    checkAuth();

    // Listen for logout
    const handleLogout = () => {
      setUser(null);
      setUserProfile(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // Check if product creation is enabled
  useEffect(() => {
    const checkFeature = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/settings/public/status`);
        if (response.ok) {
          const data = await response.json();
          setProductCreationEnabled(data.product_creation_enabled !== false);
        }
      } catch {
        // If it fails, assume enabled (fail open)
      }
    };
    
    checkFeature();
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to list an item");
      navigate("/auth");
      return;
    }

    if (!formData.title || !formData.category || !formData.condition) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const price = formData.category === "giveaways" ? 0 : parseInt(formData.price) || 0;

      await productsApi.create({
        title: formData.title,
        description: formData.description || undefined,
        price: price,
        category: formData.category,
        condition: formData.condition,
        negotiable: formData.negotiable,
        images: formData.images,
        college: userProfile?.college || undefined,
      });

      toast.success("Your item has been listed successfully!", {
        description: "You'll be notified when someone is interested.",
      });
      navigate("/browse");
    } catch (error: any) {
      toast.error(error.message || "Failed to create listing");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.category !== "";
      case 2:
        return formData.condition !== "";
      case 3:
        if (formData.category === "giveaways") {
          return formData.title.length > 0;
        }
        return formData.title && formData.price;
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Redirect to auth if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Sign in Required
            </h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to sell items on UniCycle
            </p>
            <Button variant="sell" onClick={() => navigate("/auth")}>
              Sign In to Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if product creation is disabled
  if (!productCreationEnabled) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="text-center max-w-md">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Product creation is currently disabled. Please check back later or contact support.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-3xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Sell on UniCycle
              </h1>
              <Badge variant="outline" className="text-muted-foreground">
                Step {step} of 4
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-500 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Category */}
          {step === 1 && (
            <div className="animate-slide-up">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                What are you selling?
              </h2>
              <p className="text-muted-foreground mb-8">
                Choose the category that best describes your item
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: category.id })}
                    className={`group p-6 rounded-2xl border-2 text-left transition-all duration-200 animate-slide-up ${
                      formData.category === category.id
                        ? "border-secondary bg-secondary/5 shadow-md"
                        : "border-border hover:border-secondary/50 hover:shadow-sm"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          formData.category === category.id
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-secondary/10 group-hover:text-secondary"
                        }`}
                      >
                        <category.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          {category.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                      {formData.category === category.id && (
                        <Check className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Condition */}
          {step === 2 && (
            <div className="animate-slide-up">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                What's the condition?
              </h2>
              <p className="text-muted-foreground mb-8">
                Be honest – it helps build trust with buyers
              </p>

              <div className="space-y-4">
                {conditions.map((condition, index) => (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: condition.id })}
                    className={`w-full group p-6 rounded-2xl border-2 text-left transition-all duration-200 animate-slide-up ${
                      formData.condition === condition.id
                        ? "border-secondary bg-secondary/5 shadow-md"
                        : "border-border hover:border-secondary/50 hover:shadow-sm"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{condition.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          {condition.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {condition.description}
                        </p>
                      </div>
                      {formData.condition === condition.id && (
                        <Check className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="animate-slide-up">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Add the details
              </h2>
              <p className="text-muted-foreground mb-8">
                Good descriptions help you sell faster
              </p>

              <div className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Product Images (optional)</Label>
                  <ImageUpload
                    userId={user?.id || ""}
                    images={formData.images}
                    onImagesChange={(images) => setFormData({ ...formData, images })}
                    maxImages={5}
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., MacBook Air M1 2020 - Space Gray"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <textarea
                    id="description"
                    placeholder="Add any details about your item..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="flex min-h-[100px] w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-base transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
                  />
                </div>

                {/* Price - Hide for giveaways */}
                {formData.category !== "giveaways" && (
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        placeholder="Enter your asking price"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                {formData.category === "giveaways" && (
                  <div className="p-4 rounded-xl bg-mint/10 border border-mint/30">
                    <p className="text-sm text-mint-dark font-medium">
                      🎁 This item will be listed as FREE in the Giveaways section
                    </p>
                  </div>
                )}

                {/* Negotiable Toggle - Hide for giveaways */}
                {formData.category !== "giveaways" && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                    <div>
                      <p className="font-medium text-foreground">Open to Negotiation</p>
                      <p className="text-sm text-muted-foreground">
                        Let buyers know you're flexible on price
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, negotiable: !formData.negotiable })
                      }
                      className={`w-12 h-7 rounded-full transition-colors duration-200 ${
                        formData.negotiable ? "bg-secondary" : "bg-muted-foreground/30"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-background shadow-md transition-transform duration-200 ${
                          formData.negotiable ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="animate-slide-up">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Review & Publish
              </h2>
              <p className="text-muted-foreground mb-8">
                Make sure everything looks good before going live
              </p>

              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                {/* Preview Images */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {formData.images.map((url, index) => (
                      <div key={url} className="aspect-square rounded-xl overflow-hidden bg-muted">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Details */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {formData.title || "Your Item Title"}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="verified">
                          {categories.find((c) => c.id === formData.category)?.title}
                        </Badge>
                        <Badge variant="outline">
                          {conditions.find((c) => c.id === formData.condition)?.title}
                        </Badge>
                        {formData.category !== "giveaways" && formData.negotiable && (
                          <Badge variant="outline">Negotiable</Badge>
                        )}
                        {formData.category === "giveaways" && (
                          <Badge className="bg-mint text-mint-dark border-0">FREE</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {formData.category === "giveaways"
                        ? "FREE"
                        : `₹${Number(formData.price || 0).toLocaleString()}`
                      }
                    </p>
                  </div>

                  {formData.description && (
                    <p className="text-muted-foreground">{formData.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {userProfile?.college
                        ? `Listed at ${userProfile.college}`
                        : "Will be listed at your registered college"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="mt-6 p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Pro Tip</p>
                    <p className="text-sm text-muted-foreground">
                      Add a clear image URL to help buyers see your item. Items with images sell faster!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className="gap-2"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                variant="sell"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="sell"
                onClick={handleSubmit}
                className="gap-2"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish Listing
                    <Check className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SellPage;
