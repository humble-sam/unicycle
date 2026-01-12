import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, wishlistApi } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[] | null;
  college: string | null;
  created_at: string;
  condition: string;
  negotiable: boolean | null;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
};

const WishlistPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const session = authApi.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchWishlist();
    };

    checkAuthAndFetch();

    // Listen for logout
    const handleLogout = () => {
      navigate("/auth");
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate]);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const items = await wishlistApi.getAll();
      setProducts(items);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setProducts([]);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
            <p className="text-muted-foreground">
              Items you've saved for later
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-muted-foreground mb-6">
              Start browsing and save items you're interested in
            </p>
            <Button variant="sell" onClick={() => navigate("/browse")}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => {
              const validCondition = ["like-new", "good", "well-used"].includes(product.condition)
                ? (product.condition as "like-new" | "good" | "well-used")
                : "good";
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  image={product.images?.[0] || "/placeholder.svg"}
                  college={product.college || "Unknown College"}
                  postedAt={formatTimeAgo(product.created_at)}
                  condition={validCondition}
                  negotiable={product.negotiable ?? false}
                  delay={index * 50}
                />
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default WishlistPage;
