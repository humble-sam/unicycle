import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Recycle, 
  Users, 
  GraduationCap, 
  Heart, 
  Shield, 
  Zap,
  Target,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AboutPage = () => {
  const features = [
    {
      icon: Recycle,
      title: "Sustainable Trading",
      description: "Give pre-loved items a second life. Reduce waste, save money, and help the environment."
    },
    {
      icon: Users,
      title: "Student Community",
      description: "Connect with fellow students from your campus. Buy and sell within a trusted network."
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Verified student accounts and secure transactions. Meet on campus for safe exchanges."
    },
    {
      icon: Zap,
      title: "Quick & Easy",
      description: "List items in minutes, find what you need instantly. No complicated processes."
    }
  ];

  const stats = [
    { value: "100%", label: "Student Focused" },
    { value: "₹0", label: "Platform Fees" },
    { value: "24/7", label: "Available" },
    { value: "♻️", label: "Sustainable" }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-background py-16 md:py-24">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                India's Student Marketplace
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Where Students
                <span className="text-primary"> Buy</span>,
                <span className="text-secondary"> Sell</span> &
                <span className="text-primary"> Save</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                UniCycle is a peer-to-peer marketplace built exclusively for college students in India. 
                Trade textbooks, electronics, furniture, and more with your campus community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/browse">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Exploring
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Join UniCycle
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-border bg-muted/30">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe every student deserves access to affordable resources. UniCycle makes it easy for 
                students to buy and sell items within their campus community, promoting sustainability and 
                helping everyone save money during their college years.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How UniCycle Works</h2>
              <p className="text-muted-foreground">Simple steps to start trading on campus</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  title: "Create Account",
                  description: "Sign up with your college email. Verify your student status to join the community."
                },
                {
                  step: "02",
                  title: "List or Browse",
                  description: "Post items you want to sell or browse listings from other students on your campus."
                },
                {
                  step: "03",
                  title: "Meet & Trade",
                  description: "Connect with buyers/sellers, meet safely on campus, and complete your transaction."
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="text-6xl font-bold text-primary/10 absolute -top-4 left-0">{item.step}</div>
                  <div className="pt-8 pl-4">
                    <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Built for Students, by Students</h2>
                  <div className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      UniCycle was born from a simple observation: students have stuff they don't need, and other 
                      students need stuff they can't afford new.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      We've created a platform that's completely free to use, with no hidden fees or commissions. 
                      Every rupee you save or earn goes directly to you.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Join thousands of students across India who are already trading smarter with UniCycle.
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/10 rounded-3xl p-8 md:p-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">Student-Only Platform</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-secondary" />
                      </div>
                      <span className="text-foreground font-medium">Zero Platform Fees</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">Safe Campus Transactions</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Recycle className="w-5 h-5 text-secondary" />
                      </div>
                      <span className="text-foreground font-medium">Eco-Friendly Trading</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Join the Movement?
              </h2>
              <p className="text-primary-foreground/80 mb-8 text-lg">
                Start buying and selling with students on your campus today.
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="font-semibold">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
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

export default AboutPage;
