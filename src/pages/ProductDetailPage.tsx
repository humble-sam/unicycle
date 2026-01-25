import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authApi, productsApi } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Tag,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
  AlertCircle,
  Heart,
  Flag,
  LogIn,
} from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { reportsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Product {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  negotiable: boolean | null;
  images: string[] | null;
  college: string | null;
  is_active: boolean | null;
  created_at: string;
  seller_name?: string;
  seller_avatar?: string;
  seller_college?: string;
  seller_phone?: string;
  seller_email?: string;
}

const conditionLabels: Record<string, string> = {
  "like-new": "Like New",
  "good": "Good",
  "well-used": "Well Used",
};

const conditionColors: Record<string, string> = {
  "like-new": "bg-secondary/10 text-secondary border-secondary/20",
  "good": "bg-blue-50 text-blue-600 border-blue-200",
  "well-used": "bg-amber-50 text-amber-600 border-amber-200",
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { isInWishlist, toggleWishlist, isLoading: wishlistLoading } = useWishlist();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const { toast } = useToast();

  // Touch swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    const session = authApi.getSession();
    setCurrentUserId(session?.user?.id || null);
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const productData = await productsApi.getById(id);
        setProduct(productData);
      } catch (error) {
        console.error("Error fetching product:", error);
      }
      setIsLoading(false);
    };

    fetchProduct();
  }, [id]);

  const images = product?.images?.length ? product.images : ["/placeholder.svg"];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      nextImage();
    }
    if (isRightSwipe && images.length > 1) {
      prevImage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This product may have been removed or is no longer available.
            </p>
            <Button variant="sell" onClick={() => navigate("/browse")}>
              Browse Products
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwnProduct = currentUserId === product.user_id;
  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 md:py-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div
              className="relative aspect-square rounded-2xl overflow-hidden bg-muted touch-pan-y"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={images[currentImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover select-none"
                draggable={false}
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-background/90 flex items-center justify-center hover:bg-background active:scale-95 transition-all shadow-md"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-background/90 flex items-center justify-center hover:bg-background active:scale-95 transition-all shadow-md"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6 sm:w-5 sm:h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/90 px-3 py-1.5 rounded-full text-sm font-medium">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                  {/* Swipe hint for mobile */}
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/70 px-2 py-1 rounded sm:hidden">
                    Swipe to navigate
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Grid */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                        ? "border-secondary ring-2 ring-secondary/20"
                        : "border-transparent hover:border-border"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={`${conditionColors[product.condition] || conditionColors["good"]} border`}>
                {conditionLabels[product.condition] || product.condition}
              </Badge>
              {product.negotiable && (
                <Badge variant="outline" className="gap-1">
                  <Tag className="w-3 h-3" />
                  Negotiable
                </Badge>
              )}
              {product.price === 0 && (
                <Badge className="bg-mint text-mint-dark border-0">FREE</Badge>
              )}
            </div>

            {/* Wishlist Button */}
            {!isOwnProduct && (
              <div className="space-y-2">
                <Button
                  variant={isWishlisted ? "destructive" : "outline"}
                  className="w-full gap-2"
                  onClick={() => toggleWishlist(product.id)}
                  disabled={wishlistLoading}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
                  {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-orange-600 hover:text-orange-700"
                  onClick={() => setReportDialogOpen(true)}
                >
                  <Flag className="w-4 h-4" />
                  Report Product
                </Button>
              </div>
            )}

            {/* Title & Price */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {product.title}
              </h1>
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {product.price === 0 ? "FREE" : `₹${product.price.toLocaleString()}`}
              </p>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {product.college && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {product.college}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Posted {formatTimeAgo(product.created_at)}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t border-border">
                <h2 className="font-semibold text-foreground mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* Seller Card */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-semibold text-foreground mb-4">Seller Information</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {product.seller_avatar ? (
                    <img
                      src={product.seller_avatar}
                      alt={product.seller_name || "Seller"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {product.seller_name || "UniCycle Seller"}
                  </p>
                  {product.seller_college && (
                    <p className="text-sm text-muted-foreground">{product.seller_college}</p>
                  )}
                </div>
              </div>

              {isOwnProduct ? (
                <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground text-center">
                  This is your listing
                </div>
              ) : (
                <div className="space-y-3">
                  {product.seller_phone ? (
                    <>
                      <Button
                        variant="sell"
                        className="w-full gap-2"
                        onClick={async () => {
                          try {
                            await productsApi.contact(product.id);
                            window.open(`tel:${product.seller_phone}`, "_blank");
                            toast({
                              title: "Contacting Seller",
                              description: "Wait for response, the product is delisted now.",
                            });
                            // Refresh product state to show it's inactive if needed
                            setProduct(prev => prev ? { ...prev, is_active: false } : null);
                          } catch (error) {
                            window.open(`tel:${product.seller_phone}`, "_blank");
                          }
                        }}
                      >
                        <Phone className="w-4 h-4" />
                        Call Seller
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={async () => {
                          try {
                            await productsApi.contact(product.id);
                            const message = encodeURIComponent(
                              `Hi! I'm interested in your listing "${product.title}" on UniCycle.`
                            );
                            window.open(`https://wa.me/${product.seller_phone!.replace(/\D/g, "")}?text=${message}`, "_blank");
                            toast({
                              title: "Message Sent",
                              description: "Wait for response, the product is delisted now.",
                            });
                            setProduct(prev => prev ? { ...prev, is_active: false } : null);
                          } catch (error) {
                            const message = encodeURIComponent(
                              `Hi! I'm interested in your listing "${product.title}" on UniCycle.`
                            );
                            window.open(`https://wa.me/${product.seller_phone!.replace(/\D/g, "")}?text=${message}`, "_blank");
                          }
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    </>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground text-center">
                      Seller has not provided contact info
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Safety Tips */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border text-sm">
              <p className="font-medium text-foreground mb-1">Safety Tips</p>
              <ul className="text-muted-foreground space-y-1">
                <li>- Meet in a public place on campus</li>
                <li>- Inspect the item before payment</li>
                <li>- Don't share personal financial details</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Product</DialogTitle>
            <DialogDescription>
              Help us keep UniCycle safe by reporting inappropriate content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="fraud">Fraud or Scam</SelectItem>
                  <SelectItem value="duplicate">Duplicate Listing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Additional Details (optional)</Label>
              <Textarea
                id="description"
                placeholder="Please provide more information..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!reportReason) {
                  toast({
                    title: 'Error',
                    description: 'Please select a reason',
                    variant: 'destructive',
                  });
                  return;
                }
                setReporting(true);
                try {
                  await reportsApi.reportProduct(product.id, reportReason, reportDescription);
                  toast({
                    title: 'Report Submitted',
                    description: 'Thank you for your report. We will review it shortly.',
                  });
                  setReportDialogOpen(false);
                  setReportReason('');
                  setReportDescription('');
                } catch (error: any) {
                  toast({
                    title: 'Error',
                    description: error.message || 'Failed to submit report',
                    variant: 'destructive',
                  });
                } finally {
                  setReporting(false);
                }
              }}
              disabled={!reportReason || reporting}
            >
              {reporting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailPage;
