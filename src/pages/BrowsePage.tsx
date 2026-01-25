import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  MapPin,
  Laptop,
  BookOpen,
  Sofa,
  UtensilsCrossed,
  Car,
  Gift,
  LayoutGrid,
  Loader2
} from "lucide-react";
import { productsApi } from "@/lib/api";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[] | null;
  college: string | null;
  created_at: string;
  condition: string;
  negotiable: boolean | null;
  category: string;
}

const categoryFilters = [
  { id: "all", label: "All Categories", icon: LayoutGrid },
  { id: "electronics", label: "Electronics", icon: Laptop },
  { id: "books-stationary", label: "Books & Stationary", icon: BookOpen },
  { id: "furniture", label: "Furniture", icon: Sofa },
  { id: "kitchen-items", label: "Kitchen", icon: UtensilsCrossed },
  { id: "vehicles", label: "Vehicles", icon: Car },
  { id: "giveaways", label: "Giveaways", icon: Gift },
];

const locationFilters = [
  { id: "my-college", label: "Within My College" },
  { id: "city", label: "Other Colleges in City" },
  { id: "all", label: "All Locations" },
];

const sortOptions = [
  { id: "recent", label: "Most Recent" },
  { id: "price-low", label: "Price: Low to High" },
  { id: "price-high", label: "Price: High to Low" },
];

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
};

const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedSort, setSelectedSort] = useState("recent");

  // Fetch products from database
  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, selectedLocation, selectedSort]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const result = await productsApi.getAll({
        search: searchQuery,
        category: selectedCategory === "all" ? undefined : selectedCategory,
        sort: selectedSort,
        limit: 100
      });
      setProducts(result.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", categoryId);
    }
    setSearchParams(searchParams);
  };

  // Backend handles search, but we can do a secondary local filter for location if needed
  // UI Grid: Use 2 columns on mobile for better density

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Search Header */}
        <section className="bg-primary py-8 md:py-12">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
                Find What You Need
              </h1>
              <p className="text-primary-foreground/70 flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />
                Browse items from students across colleges
              </p>
            </div>
            <div className="flex justify-center">
              <SearchBar
                placeholder="Search for items..."
                onSearch={setSearchQuery}
              />
            </div>
          </div>
        </section>

        {/* Launch Banner - Giveaways Highlight */}
        <section className="bg-gradient-to-r from-mint/20 via-mint/10 to-mint/20 border-b border-mint/30">
          <div className="container py-4">
            <button
              onClick={() => handleCategoryChange("giveaways")}
              className="w-full flex items-center justify-center gap-3 group"
            >
              <div className="flex items-center gap-2 animate-pulse">
                <Gift className="w-5 h-5 text-mint-dark" />
                <span className="text-sm font-semibold text-mint-dark">LAUNCH SPECIAL</span>
              </div>
              <span className="text-foreground font-medium">
                Check out free giveaways from seniors!
              </span>
              <Badge className="bg-mint text-mint-dark border-0 group-hover:scale-105 transition-transform">
                Free Items
              </Badge>
            </button>
          </div>
        </section>

        {/* Category Filters */}
        <section className="bg-muted/30 border-b border-border">
          <div className="container py-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categoryFilters.map((filter) => {
                const Icon = filter.icon;
                const isGiveaway = filter.id === "giveaways";
                return (
                  <Button
                    key={filter.id}
                    variant={selectedCategory === filter.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleCategoryChange(filter.id)}
                    className={`whitespace-nowrap gap-2 ${isGiveaway && selectedCategory !== filter.id
                      ? "bg-mint/20 text-mint-dark border border-mint/40 hover:bg-mint/30"
                      : ""
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isGiveaway ? "animate-pulse" : ""}`} />
                    {filter.label}
                    {isGiveaway && <span className="text-xs">🎁</span>}
                  </Button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Location & Sort Bar */}
        <section className="sticky top-16 z-40 bg-background border-b border-border">
          <div className="container py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Location Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {locationFilters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={selectedLocation === filter.id ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLocation(filter.id)}
                    className="whitespace-nowrap"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Sort & Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="h-9 pl-3 pr-8 text-sm rounded-lg border border-input bg-background appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || selectedCategory !== "all") && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-sm text-muted-foreground">Filters:</span>
                {searchQuery && (
                  <Badge variant="outline" className="gap-1">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery("")}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryFilters.find(c => c.id === selectedCategory)?.label}
                    <button onClick={() => handleCategoryChange("all")}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-8 md:py-12">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{products.length}</span> items found
                {selectedCategory !== "all" && (
                  <span> in {categoryFilters.find(c => c.id === selectedCategory)?.label}</span>
                )}
              </p>
              <Button variant="ghost" size="sm" onClick={fetchProducts} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-secondary" />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, index) => {
                  const validCondition = ["like-new", "good", "well-used"].includes(product.condition)
                    ? product.condition as "like-new" | "good" | "well-used"
                    : "good";
                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      image={product.images?.[0] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop"}
                      college={product.college || "Unknown College"}
                      postedAt={formatTimeAgo(product.created_at)}
                      condition={validCondition}
                      negotiable={product.negotiable ?? false}
                      delay={index * 50}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <SlidersHorizontal className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No items found
                </h3>
                <p className="text-muted-foreground mb-6">
                  {products.length === 0
                    ? "Be the first to list an item on UniCycle!"
                    : "Try adjusting your search or filters"
                  }
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    handleCategoryChange("all");
                    setSelectedLocation("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BrowsePage;
