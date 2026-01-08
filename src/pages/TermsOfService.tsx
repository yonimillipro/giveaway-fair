import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 8, 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using GiveawayHub, you agree to be bound by these Terms of Service
            and all applicable laws and regulations. If you do not agree with any of these terms,
            you are prohibited from using or accessing this site.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 18 years old to use our services. By using GiveawayHub, you
            represent and warrant that you are at least 18 years of age and have the legal
            capacity to enter into these Terms.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate, complete, and current
            information. You are responsible for safeguarding your password and for all activities
            that occur under your account.
          </p>

          <h2>4. Giveaway Rules</h2>
          <ul>
            <li>One entry per person per giveaway unless otherwise specified</li>
            <li>Winners are selected randomly and fairly</li>
            <li>Prizes are non-transferable and cannot be exchanged for cash</li>
            <li>Winners must respond within 48 hours or a new winner may be selected</li>
            <li>Fraudulent entries will result in disqualification and account suspension</li>
          </ul>

          <h2>5. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Create multiple accounts to increase chances of winning</li>
            <li>Use automated systems or bots to enter giveaways</li>
            <li>Impersonate others or provide false information</li>
            <li>Attempt to manipulate or interfere with giveaway outcomes</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>
            The content, features, and functionality of GiveawayHub are owned by us and are
            protected by international copyright, trademark, and other intellectual property laws.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            GiveawayHub shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages resulting from your use of or inability to use the service.
          </p>

          <h2>8. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. We will provide
            notice of any material changes by posting the new Terms on this page.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at legal@giveawayhub.com.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
