import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: December 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                To provide a secure and localized marketplace for students, we collect the following information when you create an account:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Personal Identity:</strong> Full Name and Email Address.</li>
                <li><strong>Academic Context:</strong> College/University Name.</li>
                <li><strong>Geographic Data:</strong> City location to show you relevant local listings.</li>
                <li><strong>Transaction Data:</strong> Photos and descriptions of the items you list for sale.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use the collected data to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Verify that you are part of a student community.</li>
                <li>Filter search results so you see items available at your specific campus.</li>
                <li>Facilitate communication between buyers and sellers.</li>
                <li>Improve the user experience and interface of the UniCycle platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Visibility & Privacy</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Public Profile:</strong> Your name and college name will be visible to other registered users to build trust during transactions.</li>
                <li><strong>Contact Information:</strong> Your email address or phone number will only be shared with another user if you explicitly choose to "Reveal Contact" or initiate a chat to finalize a deal.</li>
                <li><strong>Private Data:</strong> We do not sell or rent your personal data to third-party marketing agencies.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Storage and Security</h2>
              <p className="text-muted-foreground">
                We implement standard security measures (such as SSL encryption) to protect your data. Since UniCycle is a student-focused platform, we encourage users to use unique passwords. However, please note that no method of electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                UniCycle uses basic cookies to keep you logged in and to remember your preferences (like your preferred college filter). You can disable cookies in your browser settings, but some features of the site may not function correctly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Third-Party Services</h2>
              <p className="text-muted-foreground">
                If we use third-party services for hosting or analytics, those providers have access to your information only to perform specific tasks on our behalf and are obligated not to disclose it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. User Rights (Access & Deletion)</h2>
              <p className="text-muted-foreground mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Update your profile information at any time.</li>
                <li>Delete your account and all associated listings. Upon deletion, your data will be removed from our active databases within a reasonable timeframe.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                UniCycle may update this Privacy Policy periodically. We will notify you of any significant changes by posting the new policy on this page.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
