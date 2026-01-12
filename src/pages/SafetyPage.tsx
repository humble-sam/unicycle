import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Shield, 
  MapPin, 
  Users, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Eye,
  Phone,
  Ban,
  MessageSquare
} from "lucide-react";

const SafetyPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Safety Guidelines</h1>
          </div>
          <p className="text-muted-foreground mb-8">Your safety is our top priority. Follow these guidelines for secure transactions.</p>

          <div className="space-y-10">
            {/* Meeting Safety */}
            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Meeting Safely</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                When meeting someone to complete a transaction, always prioritize your personal safety:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Meet on Campus:</strong> Always arrange meetups in public, well-lit areas on your college campus such as the library, canteen, student center, or main gate.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Daytime Meetings:</strong> Schedule transactions during daylight hours when more people are around.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Bring a Friend:</strong> When possible, bring a friend or roommate along, especially for higher-value items.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Tell Someone:</strong> Let a friend or family member know where you're going, who you're meeting, and when you expect to return.</span>
                </li>
              </ul>
            </section>

            {/* Verification */}
            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-secondary" />
                <h2 className="text-2xl font-semibold text-foreground">Verify Before You Buy</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Protect yourself from fraud by thoroughly inspecting items before completing any transaction:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Inspect Thoroughly:</strong> Check the item's condition in person. Test electronics, flip through textbooks, and verify everything matches the listing description.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Ask Questions:</strong> Don't hesitate to ask the seller about the item's history, any defects, or reason for selling.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Check Serial Numbers:</strong> For expensive electronics, verify serial numbers and check that the item isn't reported stolen.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Request Documentation:</strong> For textbooks, ask for receipts or proof of purchase if available.</span>
                </li>
              </ul>
            </section>

            {/* Payment Safety */}
            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Secure Payments</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Handle money safely during transactions:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Use UPI:</strong> Prefer digital payments through UPI apps (Google Pay, PhonePe, Paytm) for instant, traceable transactions.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Verify Payment First:</strong> Sellers should confirm payment is received before handing over the item. Buyers should inspect items before paying.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Avoid Advance Payments:</strong> Never pay full amount in advance without seeing the item. Small deposits may be reasonable for reserved items.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Count Cash Carefully:</strong> If paying in cash, count it together with the other person to avoid disputes.</span>
                </li>
              </ul>
            </section>

            {/* Communication */}
            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-secondary" />
                <h2 className="text-2xl font-semibold text-foreground">Safe Communication</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Protect your personal information while communicating with other users:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Keep It On Platform:</strong> Use UniCycle's messaging when available. Avoid sharing personal phone numbers until you're comfortable.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Verify Student Status:</strong> Confirm the other person is a genuine student. Check their profile for college verification.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Trust Your Instincts:</strong> If something feels off about a conversation or deal, it's okay to walk away.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Screenshot Conversations:</strong> Keep records of your chats in case any disputes arise later.</span>
                </li>
              </ul>
            </section>

            {/* Red Flags */}
            <section className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                <h2 className="text-2xl font-semibold text-foreground">Red Flags to Watch For</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Be cautious if you encounter any of these warning signs:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Prices Too Good to Be True:</strong> Extremely low prices on expensive items may indicate scams or stolen goods.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Pressure to Act Fast:</strong> Scammers often create urgency. Take your time to verify everything.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Refusal to Meet in Person:</strong> If someone insists on shipping or won't meet on campus, be very cautious.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Requests for Unusual Payment:</strong> Be wary of requests for gift cards, cryptocurrency, or wire transfers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Inconsistent Information:</strong> If details in the listing don't match what the seller says, something may be wrong.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Requests for Personal Info:</strong> Never share your password, bank details, or OTPs with anyone.</span>
                </li>
              </ul>
            </section>

            {/* Reporting */}
            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Report Suspicious Activity</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Help keep UniCycle safe for everyone:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Report Listings:</strong> Use the report button on any listing that seems fraudulent, inappropriate, or violates our guidelines.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Report Users:</strong> If someone behaves inappropriately or attempts fraud, report their profile to our team.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Contact Support:</strong> For urgent safety concerns, email us at <a href="mailto:hello@unicycle.digital" className="text-primary hover:underline">hello@unicycle.digital</a>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Contact Authorities:</strong> In case of theft, fraud, or physical danger, contact campus security or local police immediately.</span>
                </li>
              </ul>
            </section>

            {/* Emergency */}
            <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Emergency Contacts</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Keep these numbers handy in case of emergencies:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="font-semibold text-foreground">Police Emergency</p>
                  <p className="text-2xl font-bold text-primary">100</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="font-semibold text-foreground">Women Helpline</p>
                  <p className="text-2xl font-bold text-primary">1091</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="font-semibold text-foreground">Cyber Crime</p>
                  <p className="text-2xl font-bold text-primary">1930</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="font-semibold text-foreground">UniCycle Support</p>
                  <p className="text-sm text-primary">hello@unicycle.digital</p>
                </div>
              </div>
            </section>

            {/* Final Note */}
            <section className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">Stay Safe, Trade Smart</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                UniCycle is committed to providing a safe platform for students. By following these guidelines 
                and using common sense, you can enjoy a secure buying and selling experience. 
                Remember: if a deal seems too good to be true, it probably is.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SafetyPage;
