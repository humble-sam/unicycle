import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            UniCycle | Terms and Conditions
          </h1>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using UniCycle, you agree to be bound by these Terms and Conditions. UniCycle is a platform designed exclusively to facilitate peer-to-peer (P2P) transactions between students.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. "As-Is" Transactions & No Liability</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">The "Check Before You Buy" Rule:</strong> All items listed on UniCycle are sold on an "As-Is, Where-Is" basis. UniCycle acts solely as a venue and does not inspect, verify, or guarantee the condition, safety, or legality of any item listed.
                </p>
                <p>
                  <strong className="text-foreground">Verification:</strong> It is the sole responsibility of the buyer to physically inspect the product, test its functionality (especially for electronics), and verify its authenticity before handing over any payment.
                </p>
                <p>
                  <strong className="text-foreground">No Refunds:</strong> Once a transaction is completed between two students, UniCycle cannot facilitate refunds, returns, or exchanges.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-3">
                UniCycle, its developers, and affiliated college bodies shall not be held responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                <li>Defective or damaged products.</li>
                <li>Misrepresentation of items by sellers.</li>
                <li>Financial losses or fraudulent transactions.</li>
                <li>Any physical disputes or safety issues arising from meetups.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. User Conduct & Safety</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Campus Meetups:</strong> For safety, we strongly recommend that all transactions and handovers take place in public, well-lit areas on the college campus (e.g., the Library, Canteen, or Main Gate) during daylight hours.
                </p>
                <p>
                  <strong className="text-foreground">Account Accuracy:</strong> You agree to provide accurate information (Full Name, College, City) during registration. Impersonation of another student is grounds for an immediate permanent ban.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Prohibited Items</h2>
              <p className="text-muted-foreground mb-3">
                Users are strictly prohibited from listing:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                <li>Illegal substances or drug paraphernalia.</li>
                <li>Weapons or hazardous materials.</li>
                <li>Academic dishonesty tools (e.g., leaked exam papers).</li>
                <li>Any item that violates the specific Code of Conduct of your respective University.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Modifications</h2>
              <p className="text-muted-foreground leading-relaxed">
                UniCycle reserves the right to modify these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
