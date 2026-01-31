import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Menu, X, LayoutDashboard, UserCircle, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { authApi } from "@/lib/api";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check initial auth state
    setIsLoggedIn(authApi.isAuthenticated());

    // Listen for logout events
    const handleLogout = () => {
      setIsLoggedIn(false);
    };

    window.addEventListener('auth:logout', handleLogout);

    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        setIsLoggedIn(!!e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Re-check auth state on route change
  useEffect(() => {
    setIsLoggedIn(authApi.isAuthenticated());
  }, [location]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/50">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <img
            src="/unicycle-logo.svg?v=2"
            alt="UniCycle"
            className="w-9 h-9 rounded-xl shadow-md group-hover:shadow-lg transition-shadow"
          />
          <span className="text-xl font-bold text-foreground tracking-tight">
            Uni<span className="text-secondary">Cycle</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center gap-8 flex-1 mx-8">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-secondary ${isActive("/") ? "text-secondary" : "text-muted-foreground"
              }`}
          >
            Home
          </Link>
          <Link
            to="/browse"
            className={`text-sm font-medium transition-colors hover:text-secondary ${isActive("/browse") ? "text-secondary" : "text-muted-foreground"
              }`}
          >
            Browse
          </Link>
          <Link
            to="/terms"
            className={`text-sm font-medium transition-colors hover:text-secondary ${isActive("/terms") ? "text-secondary" : "text-muted-foreground"
              }`}
          >
            Terms & Conditions
          </Link>
          <Link
            to="/privacy"
            className={`text-sm font-medium transition-colors hover:text-secondary ${isActive("/privacy") ? "text-secondary" : "text-muted-foreground"
              }`}
          >
            Privacy Policy
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0 ml-auto">
          <Link to="/sell">
            <Button variant="sell" size="default">
              Sell on UniCycle
            </Button>
          </Link>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link to="/wishlist">
                <Button variant="outline" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="icon">
                  <LayoutDashboard className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" size="icon">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-foreground ml-auto"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border animate-slide-up">
          <nav className="container py-4 flex flex-col gap-2">
            <Link
              to="/"
              className="py-3 px-4 rounded-lg text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/browse"
              className="py-3 px-4 rounded-lg text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              to="/terms"
              className="py-3 px-4 rounded-lg text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Terms & Conditions
            </Link>
            <Link
              to="/privacy"
              className="py-3 px-4 rounded-lg text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Privacy Policy
            </Link>
            <div className="border-t border-border my-2" />
            <Link to="/sell" onClick={() => setIsMenuOpen(false)}>
              <Button variant="sell" className="w-full">
                Sell on UniCycle
              </Button>
            </Link>
            {isLoggedIn ? (
              <>
                <Link to="/wishlist" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    My Wishlist
                  </Button>
                </Link>
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    My Dashboard
                  </Button>
                </Link>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    <UserCircle className="h-4 w-4 mr-2" />
                    My Profile
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Sign In / Register
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
