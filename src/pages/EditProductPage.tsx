import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  ArrowLeft,
  Check,
  IndianRupee,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { authApi, productsApi } from "@/lib/api";

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

const EditProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [productEditingEnabled, setProductEditingEnabled] = useState(true);
  const [formData, setFormData] = useState({
    category: "",
    condition: "",
    title: "",
    description: "",
    price: "",
    negotiable: true,
    images: [] as string[],
  });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const session = authApi.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      if (id) {
        await fetchProduct(session.user.id);
      }
    };

    checkAuthAndFetch();

    // Listen for logout
    const handleLogout = () => {
      navigate("/auth");
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [id, navigate]);

  // Check if product editing is enabled
  useEffect(() => {
    const checkFeature = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/settings/public/status`);
        if (response.ok) {
          const data = await response.json();
          setProductEditingEnabled(data.product_editing_enabled !== false);
        }
      } catch {
        // If it fails, assume enabled (fail open)
      }
    };
    
    checkFeature();
  }, []);

  const fetchProduct = async (userId: string) => {
    if (!id) return;

    try {
      const data = await productsApi.getById(id);
      
      // Check if user owns this product
      if (data.user_id !== userId) {
        toast.error("You don't have permission to edit this product");
        navigate("/dashboard");
        return;
      }

      setFormData({
        category: data.category,
        condition: data.condition,
        title: data.title,
        description: data.description || "",
        price: data.price.toString(),
        negotiable: data.negotiable ?? true,
        images: Array.isArray(data.images) ? data.images : [],
      });
      setIsLoading(false);
    } catch (error: any) {
      toast.error(error.message || "Product not found");
      navigate("/dashboard");
    }
  };

  const handleSubmit = async () => {
    if (!user || !id) return;

    if (!formData.title || !formData.category || !formData.condition) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);

    try {
      const price = formData.category === "giveaways" ? 0 : parseInt(formData.price) || 0;
      
      await productsApi.update(id, {
        title: formData.title,
        description: formData.description || null,
        price: price,
        category: formData.category,
        condition: formData.condition,
        negotiable: formData.negotiable,
        images: formData.images,
      });

      toast.success("Listing updated successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to update listing");
    } finally {
      setIsSaving(false);
    }
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

  // Check if product editing is disabled
  if (!productEditingEnabled) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="text-center max-w-md">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Product editing is currently disabled. Please check back later or contact support.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
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
              Edit Listing
            </h1>
            <p className="text-muted-foreground mt-1">
              Update your product information
            </p>
          </div>

          <div className="space-y-8">
            {/* Category Selection */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Category
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: category.id })}
                    className={`group p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      formData.category === category.id
                        ? "border-secondary bg-secondary/5"
                        : "border-border hover:border-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          formData.category === category.id
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <category.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground text-sm">
                          {category.title}
                        </h3>
                      </div>
                      {formData.category === category.id && (
                        <Check className="w-4 h-4 text-secondary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Selection */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Condition
              </h2>
              <div className="space-y-3">
                {conditions.map((condition) => (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: condition.id })}
                    className={`w-full group p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      formData.condition === condition.id
                        ? "border-secondary bg-secondary/5"
                        : "border-border hover:border-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{condition.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">
                          {condition.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {condition.description}
                        </p>
                      </div>
                      {formData.condition === condition.id && (
                        <Check className="w-4 h-4 text-secondary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">
                Product Details
              </h2>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Product Images</Label>
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
                <Label htmlFor="description">Description</Label>
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

              {/* Price */}
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

              {/* Negotiable Toggle */}
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

            {/* Save Button */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="sell"
                onClick={handleSubmit}
                disabled={isSaving || !formData.title || !formData.category || !formData.condition}
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditProductPage;
