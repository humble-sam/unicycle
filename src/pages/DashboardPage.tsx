import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, productsApi } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  updated_at: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const session = authApi.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchProducts(session.user.id);
    };

    checkAuthAndFetch();

    // Listen for logout
    const handleLogout = () => {
      navigate("/auth");
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate]);

  const fetchProducts = async (userId: string) => {
    setIsLoading(true);
    try {
      const result = await productsApi.getAll({ userId, limit: 100 });
      setProducts(result.products || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch your listings",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleDelete = async (productId: string) => {
    setDeletingId(productId);
    try {
      await productsApi.delete(productId);
      setProducts(products.filter((p) => p.id !== productId));
      toast({
        title: "Deleted",
        description: "Listing deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    }
    setDeletingId(null);
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean | null) => {
    setTogglingId(productId);
    try {
      await productsApi.toggle(productId);
      setProducts(products.map((p) =>
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ));
      toast({
        title: currentStatus ? "Hidden" : "Published",
        description: currentStatus
          ? "Listing is now hidden from buyers"
          : "Listing is now visible to buyers",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update listing status",
        variant: "destructive",
      });
    }
    setTogglingId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const conditionLabels: Record<string, string> = {
    "like-new": "Like New",
    "good": "Good",
    "well-used": "Well Used",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Listings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your product listings
            </p>
          </div>
          <Button variant="sell" onClick={() => navigate("/sell")}>
            <Plus className="w-4 h-4 mr-2" />
            New Listing
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No listings yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start selling by creating your first listing
            </p>
            <Button variant="sell" onClick={() => navigate("/sell")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Listing
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden md:table-cell">Condition</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          <img
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[200px]">
                            {product.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {product.category}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">
                        {product.price === 0 ? "Free" : `₹${product.price.toLocaleString()}`}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">
                        {conditionLabels[product.condition] || product.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={product.is_active ? "default" : "secondary"}
                        className={product.is_active ? "bg-secondary text-secondary-foreground" : ""}
                      >
                        {product.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatDate(product.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/edit/${product.id}`)}
                          title="Edit listing"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(product.id, product.is_active)}
                          disabled={togglingId === product.id}
                          title={product.is_active ? "Hide listing" : "Show listing"}
                        >
                          {togglingId === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : product.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={deletingId === product.id}
                            >
                              {deletingId === product.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{product.title}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(product.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;
