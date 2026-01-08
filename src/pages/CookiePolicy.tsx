import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
          <h1>Cookie Policy</h1>
          <p className="text-muted-foreground">Last updated: January 8, 2026</p>

          <h2>What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your computer or mobile device when
            you visit a website. They are widely used to make websites work more efficiently and
            provide information to the owners of the site.
          </p>

          <h2>How We Use Cookies</h2>
          <p>GiveawayHub uses cookies for the following purposes:</p>

          <h3>Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core
            functionality such as security, network management, and account access. You cannot
            opt-out of these cookies.
          </p>

          <h3>Analytics Cookies</h3>
          <p>
            We use analytics cookies to understand how visitors interact with our website. This
            helps us improve our services and user experience. These cookies collect information
            anonymously.
          </p>

          <h3>Preference Cookies</h3>
          <p>
            These cookies remember your preferences and settings, such as your preferred language
            or theme (light/dark mode), to provide a more personalized experience.
          </p>

          <h3>Marketing Cookies</h3>
          <p>
            Marketing cookies are used to track visitors across websites. The intention is to
            display ads that are relevant and engaging for individual users.
          </p>

          <h2>Managing Cookies</h2>
          <p>
            Most web browsers allow you to control cookies through their settings. You can usually
            find these settings in the "Options" or "Preferences" menu of your browser. You can
            also use the following links to manage cookies in popular browsers:
          </p>
          <ul>
            <li>Chrome: Settings → Privacy and security → Cookies</li>
            <li>Firefox: Options → Privacy & Security → Cookies</li>
            <li>Safari: Preferences → Privacy → Cookies</li>
            <li>Edge: Settings → Privacy → Cookies</li>
          </ul>

          <h2>Third-Party Cookies</h2>
          <p>
            Some cookies are placed by third-party services that appear on our pages. We do not
            control these cookies and recommend reviewing the privacy policies of these third
            parties.
          </p>

          <h2>Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. We will notify you of any changes
            by posting the new Cookie Policy on this page.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about our use of cookies, please contact us at
            privacy@giveawayhub.com.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
