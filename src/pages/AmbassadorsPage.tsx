import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  GraduationCap,
  Star,
  CheckCircle2,
  Send,
  Instagram,
  Linkedin,
  Building2,
  Phone,
  Loader2,
  Sparkles,
  Award,
  Heart,
  Megaphone
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// College list (same as AuthPage)
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

interface Ambassador {
  id: string;
  college: string;
  bio: string;
  social_instagram: string;
  social_linkedin: string;
  full_name: string;
  avatar_url: string;
}

interface ApplicationStatus {
  hasApplied: boolean;
  application?: {
    status: 'pending' | 'approved' | 'rejected';
    college: string;
  };
}

const AmbassadorsPage = () => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [takenColleges, setTakenColleges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    college: "",
    full_name: "",
    phone: "",
    year_of_study: "",
    why_ambassador: "",
    social_instagram: "",
    social_linkedin: ""
  });
  const [collegeSearch, setCollegeSearch] = useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const collegeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    
    const session = authApi.getSession();
    setIsLoggedIn(!!session);
    
    if (session) {
      fetchApplicationStatus();
      // Pre-fill name from profile
      const user = authApi.getStoredUser();
      if (user?.profile?.full_name) {
        setFormData(prev => ({ ...prev, full_name: user.profile.full_name }));
      }
      if (user?.profile?.phone) {
        setFormData(prev => ({ ...prev, phone: user.profile.phone }));
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(event.target as Node)) {
        setShowCollegeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [ambassadorsRes, collegesRes] = await Promise.all([
        fetch(`${API_URL}/ambassadors`),
        fetch(`${API_URL}/ambassadors/colleges`)
      ]);

      if (ambassadorsRes.ok) {
        const data = await ambassadorsRes.json();
        setAmbassadors(data);
      }

      if (collegesRes.ok) {
        const data = await collegesRes.json();
        setTakenColleges(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ambassadors/my-application`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplicationStatus(data);
      }
    } catch (error) {
      console.error('Error fetching application status:', error);
    }
  };

  const availableColleges = colleges.filter(c => !takenColleges.includes(c));
  const filteredColleges = availableColleges.filter(c => 
    c.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.college || !formData.full_name || !formData.why_ambassador) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.why_ambassador.length < 50) {
      toast.error("Please write at least 50 characters about why you want to be an ambassador");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ambassadors/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      toast.success("Application submitted successfully! We'll review it soon.");
      setShowForm(false);
      fetchApplicationStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    { icon: Award, title: "Exclusive Perks", description: "Get early access to features and special rewards" },
    { icon: Megaphone, title: "Build Your Brand", description: "Grow your network and leadership skills" },
    { icon: Heart, title: "Help Students", description: "Make campus trading easier for everyone" },
    { icon: Star, title: "Recognition", description: "Get featured on the platform and social media" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-secondary/20 via-primary/10 to-background py-16 md:py-24">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Users className="h-4 w-4" />
                Join the Movement
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Campus <span className="text-secondary">Ambassadors</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Be the face of UniCycle at your college. Help fellow students discover 
                the smart way to buy and sell on campus.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 border-b border-border">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                    <benefit.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Current Ambassadors */}
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Ambassadors</h2>
              <p className="text-muted-foreground">
                {ambassadors.length > 0 
                  ? `Meet the students leading UniCycle at ${ambassadors.length} ${ambassadors.length === 1 ? 'campus' : 'campuses'}`
                  : "Be the first ambassador at your campus!"
                }
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : ambassadors.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ambassadors.map((ambassador) => (
                  <div 
                    key={ambassador.id}
                    className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-secondary/30 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16 border-2 border-secondary/20">
                        <AvatarImage src={ambassador.avatar_url ? `${API_URL.replace('/api', '')}${ambassador.avatar_url}` : undefined} />
                        <AvatarFallback className="bg-secondary/10 text-secondary text-lg font-semibold">
                          {ambassador.full_name?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{ambassador.full_name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <GraduationCap className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{ambassador.college}</span>
                        </div>
                        <Badge variant="secondary" className="mt-2">
                          <Star className="w-3 h-3 mr-1" />
                          Ambassador
                        </Badge>
                      </div>
                    </div>
                    {ambassador.bio && (
                      <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{ambassador.bio}</p>
                    )}
                    {(ambassador.social_instagram || ambassador.social_linkedin) && (
                      <div className="flex gap-2 mt-4">
                        {ambassador.social_instagram && (
                          <a 
                            href={`https://instagram.com/${ambassador.social_instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                          >
                            <Instagram className="w-4 h-4 text-muted-foreground" />
                          </a>
                        )}
                        {ambassador.social_linkedin && (
                          <a 
                            href={ambassador.social_linkedin.startsWith('http') ? ambassador.social_linkedin : `https://linkedin.com/in/${ambassador.social_linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                          >
                            <Linkedin className="w-4 h-4 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No ambassadors yet</h3>
                <p className="text-muted-foreground mb-4">Be the pioneer at your campus!</p>
              </div>
            )}
          </div>
        </section>

        {/* Apply Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-secondary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Become an Ambassador</h2>
                <p className="text-muted-foreground">
                  {availableColleges.length > 0 
                    ? `${availableColleges.length} colleges are waiting for their first ambassador!`
                    : "Check back soon for openings at more colleges."
                  }
                </p>
              </div>

              {!isLoggedIn ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <p className="text-muted-foreground mb-4">You need to be logged in to apply</p>
                  <Link to="/auth">
                    <Button>Sign In to Apply</Button>
                  </Link>
                </div>
              ) : applicationStatus?.hasApplied ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Application Submitted!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your application for {applicationStatus.application?.college} is{' '}
                    <Badge variant={
                      applicationStatus.application?.status === 'approved' ? 'default' :
                      applicationStatus.application?.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {applicationStatus.application?.status}
                    </Badge>
                  </p>
                  {applicationStatus.application?.status === 'pending' && (
                    <p className="text-sm text-muted-foreground">We'll notify you once it's reviewed.</p>
                  )}
                </div>
              ) : !showForm ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <p className="text-muted-foreground mb-6">
                    Ready to represent UniCycle at your college? Apply now and join our ambassador community!
                  </p>
                  <Button onClick={() => setShowForm(true)} size="lg">
                    <Send className="w-5 h-5 mr-2" />
                    Apply Now
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
                  {/* College Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="college">College/University *</Label>
                    <div className="relative" ref={collegeDropdownRef}>
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <Input
                        id="college"
                        type="text"
                        placeholder="Search available colleges..."
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
                        disabled={submitting}
                      />
                      {showCollegeDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredColleges.length > 0 ? (
                            filteredColleges.map((college) => (
                              <button
                                key={college}
                                type="button"
                                className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors text-sm"
                                onClick={() => {
                                  setFormData({ ...formData, college });
                                  setCollegeSearch("");
                                  setShowCollegeDropdown(false);
                                }}
                              >
                                {college}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-muted-foreground">
                              {takenColleges.includes(collegeSearch) 
                                ? "This college already has an ambassador"
                                : "No matching colleges found"
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.college && (
                      <Badge variant="secondary" className="mt-2">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {formData.college}
                      </Badge>
                    )}
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      disabled={submitting}
                    />
                  </div>

                  {/* Phone & Year of Study */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Your phone number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-10"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year_of_study">Year of Study</Label>
                      <Input
                        id="year_of_study"
                        type="text"
                        placeholder="e.g., 2nd Year B.Tech"
                        value={formData.year_of_study}
                        onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Why Ambassador */}
                  <div className="space-y-2">
                    <Label htmlFor="why_ambassador">Why do you want to be an ambassador? *</Label>
                    <Textarea
                      id="why_ambassador"
                      placeholder="Tell us about yourself, your experience, and why you'd be a great ambassador for UniCycle at your campus... (minimum 50 characters)"
                      value={formData.why_ambassador}
                      onChange={(e) => setFormData({ ...formData, why_ambassador: e.target.value })}
                      className="min-h-[120px]"
                      disabled={submitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.why_ambassador.length}/50 characters minimum
                    </p>
                  </div>

                  {/* Social Links */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="social_instagram">Instagram Username</Label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="social_instagram"
                          type="text"
                          placeholder="@username"
                          value={formData.social_instagram}
                          onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value.replace('@', '') })}
                          className="pl-10"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social_linkedin">LinkedIn URL</Label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="social_linkedin"
                          type="text"
                          placeholder="linkedin.com/in/username"
                          value={formData.social_linkedin}
                          onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
                          className="pl-10"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AmbassadorsPage;
