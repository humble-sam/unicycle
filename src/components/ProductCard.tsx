import { Clock, MapPin, Tag, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/hooks/use-wishlist";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  college: string;
  postedAt: string;
  condition: "like-new" | "good" | "well-used";
  negotiable?: boolean;
  delay?: number;
}

const conditionColors = {
  "like-new": "bg-secondary/10 text-secondary border-secondary/20",
  "good": "bg-blue-50 text-blue-600 border-blue-200",
  "well-used": "bg-amber-50 text-amber-600 border-amber-200",
};

const conditionLabels = {
  "like-new": "Like New",
  "good": "Good",
  "well-used": "Well Used",
};

const ProductCard = ({
  id,
  title,
  price,
  image,
  college,
  postedAt,
  condition,
  negotiable = false,
  delay = 0,
}: ProductCardProps) => {
  const { isInWishlist, toggleWishlist, isLoading } = useWishlist();
  const isWishlisted = isInWishlist(id);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(id);
  };

  return (
    <Link
      to={`/product/${id}`}
      className="group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={`${conditionColors[condition]} border font-medium`}>
            {conditionLabels[condition]}
          </Badge>
          {negotiable && (
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-border">
              <Tag className="w-3 h-3 mr-1" />
              Negotiable
            </Badge>
          )}
        </div>
        <button
          onClick={handleWishlistClick}
          disabled={isLoading}
          className={`absolute top-2 right-2 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isWishlisted
              ? "bg-destructive text-destructive-foreground"
              : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-background"
          }`}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-secondary transition-colors">
          {title}
        </h3>
        
        <p className="text-xl font-bold text-primary mb-3">
          ₹{price.toLocaleString()}
        </p>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {college}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {postedAt}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
