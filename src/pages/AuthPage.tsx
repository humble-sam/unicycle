import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Mail,
  User,
  Lock,
  Building2,
  MapPin,
  Phone,
  ArrowRight,
  GraduationCap,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const colleges = [
  "University of Delhi — Delhi",
  "University of Mumbai — Mumbai",
  "Savitribai Phule Pune University — Pune",
  "University of Calcutta — Kolkata",
  "University of Madras — Chennai",
  "Bangalore University — Bengaluru",
  "Osmania University — Hyderabad",
  "Chaudhary Charan Singh University — Meerut",
  "Dr. Bhimrao Ambedkar University — Agra",
  "University of Rajasthan — Jaipur",
  "Magadh University — Bodh Gaya",
  "Patna University — Patna",
  "Lucknow University — Lucknow",
  "Banaras Hindu University — Varanasi",
  "University of Allahabad — Prayagraj",
  "Ranchi University — Ranchi",
  "Veer Bahadur Singh Purvanchal University — Jaunpur",
  "Deen Dayal Upadhyaya Gorakhpur University — Gorakhpur",
  "Jai Prakash University — Chhapra",
  "Tilka Manjhi Bhagalpur University — Bhagalpur",
  "Mahatma Gandhi Kashi Vidyapith — Varanasi",
  "Utkal University — Bhubaneswar",
  "Berhampur University — Berhampur",
  "North Maharashtra University — Jalgaon",
  "Shivaji University — Kolhapur",
  "Kakatiya University — Warangal",
  "Andhra University — Visakhapatnam",
  "Sri Venkateswara University — Tirupati",
  "University of Mysore — Mysuru",
  "Gulbarga University — Kalaburagi",
  "Dr. Ram Manohar Lohia Avadh University — Ayodhya",
  "Bundelkhand University — Jhansi",
  "Chhatrapati Shahu Ji Maharaj University — Kanpur",
  "Sampurnanand Sanskrit University — Varanasi",
  "Mahatma Jyotiba Phule Rohilkhand University — Bareilly",
  "Siddharth University — Kapilvastu (Siddharthnagar)",
  "Raja Mahendra Pratap Singh State University — Aligarh",
  "Shakumbhari Devi University — Saharanpur",
  "Gautam Buddha University — Greater Noida",
  "Maharaja Suheldev State University — Azamgarh",
  "Maa Shakumbhari University — Saharanpur",
];

const cities = [
  "Delhi NCR",
  "Mumbai",
  "Kolkata",
  "Chennai",
  "Bengaluru",
  "Hyderabad",
  "Ahmedabad",
  "Pune",
  "Surat",
  "Jaipur",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Varanasi",
  "Srinagar",
  "Aurangabad",
  "Dhanbad",
  "Amritsar",
  "Navi Mumbai",
  "Allahabad (Prayagraj)",
  "Ranchi",
  "Howrah",
  "Coimbatore",
  "Jabalpur",
  "Gwalior",
  "Vijayawada",
  "Jodhpur",
  "Madurai",
  "Raipur",
  "Kota",
  "Chandigarh",
  "Guwahati",
  "Noida",
  "Greater Noida",
];

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    college: "",
    customCollege: "",
    city: "",
    phone: "",
  });
  const [collegeSearch, setCollegeSearch] = useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [isOtherCollege, setIsOtherCollege] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loginEnabled, setLoginEnabled] = useState(true);
  const collegeDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const session = authApi.getSession();
    if (session) {
      navigate("/");
    }
  }, [navigate]);

  // Check feature flags
  useEffect(() => {
    const checkFeatures = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api')}/admin/settings/public/status`);
        if (response.ok) {
          const data = await response.json();
          setRegistrationEnabled(data.registration_enabled !== false);
          setLoginEnabled(data.login_enabled !== false);
        }
      } catch {
        // If it fails, assume enabled (fail open)
      }
    };
    
    checkFeatures();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(event.target as Node)) {
        setShowCollegeDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredColleges = colleges.filter((c) =>
    c.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const collegeValue = isOtherCollege ? formData.customCollege : formData.college;

    if (!isLogin && (!formData.fullName || !collegeValue || !formData.city)) {
      toast.error("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (!formData.email || !formData.password) {
      toast.error("Please enter your email and password");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await authApi.signIn(formData.email, formData.password);
        toast.success("Welcome back!");
        navigate("/");
      } else {
        await authApi.signUp({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          college: collegeValue,
          phone: formData.phone || undefined,
        });
        toast.success("Account created successfully!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Welcome Back" : "Join UniCycle"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to access your account"
                : "Create your student account to start trading"}
            </p>
          </div>

          {/* Feature Disabled Alerts */}
          {!isLogin && !registrationEnabled && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Registration is currently disabled. Please contact support for assistance.
              </AlertDescription>
            </Alert>
          )}
          
          {isLogin && !loginEnabled && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Login is currently disabled. Please contact support for assistance.
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {!isLogin && (
                <>
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* College */}
                  <div className="space-y-2">
                    <Label htmlFor="college">College/University</Label>
                    <div className="relative" ref={collegeDropdownRef}>
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <Input
                        id="college"
                        type="text"
                        placeholder="Search your college..."
                        value={collegeSearch || formData.college}
                        onChange={(e) => {
                          setCollegeSearch(e.target.value);
                          setShowCollegeDropdown(true);
                          if (formData.college) {
                            setFormData({ ...formData, college: "" });
                          }
                        }}
                        onFocus={() => setShowCollegeDropdown(true)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                      {showCollegeDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredColleges.map((college) => (
                            <button
                              key={college}
                              type="button"
                              className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors text-sm"
                              onClick={() => {
                                setFormData({ ...formData, college, customCollege: "" });
                                setCollegeSearch("");
                                setShowCollegeDropdown(false);
                                setIsOtherCollege(false);
                              }}
                            >
                              {college}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors text-sm font-medium text-secondary border-t border-border"
                            onClick={() => {
                              setFormData({ ...formData, college: "" });
                              setCollegeSearch("");
                              setShowCollegeDropdown(false);
                              setIsOtherCollege(true);
                            }}
                          >
                            Other (Enter custom college name)
                          </button>
                        </div>
                      )}
                    </div>
                    {isOtherCollege && (
                      <div className="mt-2">
                        <Input
                          type="text"
                          placeholder="Enter your college/university name"
                          value={formData.customCollege}
                          onChange={(e) => setFormData({ ...formData, customCollege: e.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                    {(formData.college || (isOtherCollege && formData.customCollege)) && (
                      <Badge variant="verified" className="mt-2">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {isOtherCollege ? formData.customCollege : formData.college}
                      </Badge>
                    )}
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <div className="relative" ref={cityDropdownRef}>
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <Input
                        id="city"
                        type="text"
                        placeholder="Search your city..."
                        value={citySearch || formData.city}
                        onChange={(e) => {
                          setCitySearch(e.target.value);
                          setShowCityDropdown(true);
                          if (formData.city) {
                            setFormData({ ...formData, city: "" });
                          }
                        }}
                        onFocus={() => setShowCityDropdown(true)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                      {showCityDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredCities.map((city) => (
                            <button
                              key={city}
                              type="button"
                              className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors text-sm"
                              onClick={() => {
                                setFormData({ ...formData, city });
                                setCitySearch("");
                                setShowCityDropdown(false);
                              }}
                            >
                              {city}
                            </button>
                          ))}
                          {filteredCities.length === 0 && (
                            <div className="px-4 py-2.5 text-sm text-muted-foreground">
                              No cities found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.city && (
                      <Badge variant="verified" className="mt-2">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {formData.city}
                      </Badge>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="text"
                        inputMode="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={isLogin ? "Enter your password" : "Create a strong password (min 6 chars)"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="sell" 
                className="w-full" 
                size="lg" 
                disabled={isLoading || (!isLogin && !registrationEnabled) || (isLogin && !loginEnabled)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-secondary font-semibold hover:underline"
                  disabled={isLoading}
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </div>

          {/* Benefits */}
          {!isLogin && (
            <div className="mt-8 space-y-3">
              {[
                "Get a verified student badge",
                "Access to exclusive campus deals",
                "Safe transactions with fellow students",
              ].map((benefit, index) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 text-sm text-muted-foreground animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuthPage;
