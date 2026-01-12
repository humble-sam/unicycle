import { useState, useEffect, useCallback } from "react";
import { authApi, wishlistApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useWishlist() {
  const { toast } = useToast();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      const session = authApi.getSession();
      if (!session?.user) {
        setUserId(null);
        setWishlistIds(new Set());
        return;
      }

      setUserId(session.user.id);

      try {
        const items = await wishlistApi.getAll();
        setWishlistIds(new Set(items.map((item: any) => item.product_id)));
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
      }
    };

    fetchWishlist();

    // Listen for auth logout
    const handleLogout = () => {
      setUserId(null);
      setWishlistIds(new Set());
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save items to your wishlist",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    const isInWishlist = wishlistIds.has(productId);

    try {
      if (isInWishlist) {
        await wishlistApi.remove(productId);

        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });

        toast({
          title: "Removed from wishlist",
          description: "Item has been removed from your wishlist",
        });
      } else {
        await wishlistApi.add(productId);

        setWishlistIds((prev) => new Set(prev).add(productId));

        toast({
          title: "Added to wishlist",
          description: "Item has been saved to your wishlist",
        });
      }
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, wishlistIds, toast]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistIds.has(productId);
  }, [wishlistIds]);

  return {
    wishlistIds,
    isLoading,
    toggleWishlist,
    isInWishlist,
    isAuthenticated: !!userId,
  };
}
