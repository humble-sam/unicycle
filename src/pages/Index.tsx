import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productsApi } from "@/lib/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { 
  Laptop, 
  BookOpen, 
  Sofa, 
  UtensilsCrossed,
  Car,
  Gift,
  ArrowRight, 
  Shield, 
  Users, 
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";


const categories = [
  { title: "Electronics", icon: Laptop, count: 245, href: "/browse?category=electronics" },
  { title: "Books & Stationary", icon: BookOpen, count: 334, href: "/browse?category=books-stationary" },
  { title: "Furniture", icon: Sofa, count: 92, href: "/browse?category=furniture" },
  { title: "Kitchen Items", icon: UtensilsCrossed, count: 67, href: "/browse?category=kitchen-items" },
  { title: "Vehicles", icon: Car, count: 34, href: "/browse?category=vehicles" },
  { title: "Giveaways", icon: Gift, count: 45, href: "/browse?category=giveaways" },
];


const Index = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [giveawayItems, setGiveawayItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        // Fetch recently listed products (limit 4)
        const recentResult = await productsApi.getAll({ 
          sort: 'recent', 
          limit: 4 
        });
        setFeaturedProducts(recentResult.products || []);

        // Fetch giveaway items (limit 6)
        const giveawayResult = await productsApi.getAll({ 
          category: 'giveaways', 
          limit: 6 
        });
        setGiveawayItems(giveawayResult.products || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // Set empty arrays on error
        setFeaturedProducts([]);
        setGiveawayItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api, giveawayItems]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  const handleSearch = (query: string) => {
    navigate(`/browse?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-primary py-16 md:py-24">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              {/* Tagline */}
              <p className="text-sm sm:text-base font-medium text-secondary mb-3 animate-fade-in tracking-wide">
                From One Student to Another
              </p>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 sm:mb-6 animate-slide-up">
                Buy & Sell Within Your
                <span className="block text-secondary">Campus Community</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 mb-8 sm:mb-10 px-4 sm:px-0 animate-slide-up" style={{ animationDelay: "100ms" }}>
                Your campus marketplace for pre-loved items. Connect with fellow students 
                and find what you need.
              </p>

              <div className="flex justify-center animate-slide-up" style={{ animationDelay: "200ms" }}>
                <SearchBar placeholder="Search for items in your college..." onSearch={handleSearch} />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-8 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <span className="text-primary-foreground/60 text-sm">Popular:</span>
                {["MacBook", "iPhone", "Textbooks", "Cycle"].map((term) => (
                  <Link
                    key={term}
                    to={`/browse?q=${term.toLowerCase()}`}
                    className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Launch Banner - Giveaways Highlight */}
        <section className="bg-gradient-to-r from-mint/20 via-mint/10 to-mint/20 border-b border-mint/30">
          <div className="container py-4">
            <Link
              to="/browse?category=giveaways"
              className="w-full flex items-center justify-center gap-3 group"
            >
              <div className="flex items-center gap-2 animate-pulse">
                <Gift className="w-5 h-5 text-mint-dark" />
                <span className="text-sm font-semibold text-mint-dark">🎉 LAUNCH SPECIAL</span>
              </div>
              <span className="text-foreground font-medium">
                Check out free giveaways from seniors!
              </span>
              <Badge className="bg-mint text-mint-dark border-0 group-hover:scale-105 transition-transform">
                Free Items
              </Badge>
            </Link>
          </div>
        </section>

        {/* Giveaways Carousel Section */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-mint/5 to-background">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-mint-dark" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    Free Giveaways 🎁
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Seniors leaving behind useful stuff for free!
                  </p>
                </div>
              </div>
              <Link to="/browse?category=giveaways">
                <Button variant="outline" size="sm" className="border-mint text-mint-dark hover:bg-mint/10">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading giveaways...
              </div>
            ) : giveawayItems.length > 0 ? (
              <Carousel
                setApi={setApi}
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 3000,
                    stopOnInteraction: true,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {giveawayItems.map((item) => (
                    <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-[280px] md:basis-[320px]">
                      <Link to={`/products/${item.id}`} className="block group">
                        <div className="relative overflow-hidden rounded-xl border border-mint/30 bg-card hover:shadow-lg transition-all duration-300 hover:border-mint">
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <img
                              src={Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <Badge className="absolute top-3 left-3 bg-mint text-mint-dark border-0 font-semibold">
                              FREE
                            </Badge>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-mint-dark transition-colors">
                              {item.title}
                            </h3>
                            <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                              <span>{item.college || item.seller_college || 'Campus'}</span>
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4 border-mint/50 hover:bg-mint/10 hover:border-mint" />
                <CarouselNext className="hidden md:flex -right-4 border-mint/50 hover:bg-mint/10 hover:border-mint" />
              </Carousel>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No giveaways available yet. Be the first to list a free item!
              </div>
            )}

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === current
                      ? "w-6 bg-mint-dark"
                      : "w-2 bg-mint/40 hover:bg-mint/60"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Browse by Category
              </h2>
              <p className="text-muted-foreground">
                Find exactly what you're looking for
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.title}
                  {...category}
                  delay={index * 50}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 md:py-20 bg-muted/50">
          <div className="container">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Recently Listed
                </h2>
                <p className="text-muted-foreground">
                  Fresh finds from your campus community
                </p>
              </div>
              <Link to="/browse">
                <Button variant="ghost" className="hidden md:flex items-center gap-2">
                  View All <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading products...
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    price={product.price}
                    image={Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "/placeholder.svg"}
                    college={product.college || product.seller_college || 'Campus'}
                    postedAt={new Date(product.created_at).toLocaleDateString()}
                    condition={product.condition}
                    negotiable={product.negotiable || false}
                    delay={index * 100}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No products listed yet.</p>
                <Link to="/sell">
                  <Button variant="sell">
                    Be the first to list an item! <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}

            <div className="mt-8 text-center md:hidden">
              <Link to="/browse">
                <Button variant="outline">
                  View All Products <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why UniCycle Section */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Why Choose UniCycle?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're built specifically for students, by students
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: "Verified Students Only",
                  description: "Trade with confidence knowing everyone is a verified student from recognized institutions.",
                },
                {
                  icon: Users,
                  title: "Campus-Based Trading",
                  description: "Find items within your campus or nearby colleges. Meet safely on campus for exchanges.",
                },
                {
                  icon: Zap,
                  title: "Quick & Easy",
                  description: "List items in under 2 minutes. No complicated processes, just simple student-to-student trading.",
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="text-center p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-5">
                    <feature.icon className="w-7 h-7 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-primary">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
                Ready to Sell Something?
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Turn your unused items into cash. List your first item in under 2 minutes.
              </p>
              <Link to="/sell">
                <Button variant="hero" size="xl">
                  Start Selling Now <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
