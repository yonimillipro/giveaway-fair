import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Cookie, HelpCircle, Settings, BarChart3, Heart, Megaphone, Globe, RefreshCw, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CookiePolicy = () => {
  const cookieTypes = [
    {
      icon: Settings,
      title: "Essential Cookies",
      badge: "Required",
      badgeVariant: "default" as const,
      content: "These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You cannot opt-out of these cookies."
    },
    {
      icon: BarChart3,
      title: "Analytics Cookies",
      badge: "Optional",
      badgeVariant: "secondary" as const,
      content: "We use analytics cookies to understand how visitors interact with our website. This helps us improve our services and user experience. These cookies collect information anonymously."
    },
    {
      icon: Heart,
      title: "Preference Cookies",
      badge: "Optional",
      badgeVariant: "secondary" as const,
      content: "These cookies remember your preferences and settings, such as your preferred language or theme (light/dark mode), to provide a more personalized experience."
    },
    {
      icon: Megaphone,
      title: "Marketing Cookies",
      badge: "Optional",
      badgeVariant: "secondary" as const,
      content: "Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for individual users."
    }
  ];

  const browserSettings = [
    { browser: "Chrome", path: "Settings → Privacy and security → Cookies" },
    { browser: "Firefox", path: "Options → Privacy & Security → Cookies" },
    { browser: "Safari", path: "Preferences → Privacy → Cookies" },
    { browser: "Edge", path: "Settings → Privacy → Cookies" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Learn about how we use cookies and similar technologies to improve your browsing experience.
            </p>
            <p className="text-sm text-muted-foreground mt-4">Last updated: January 8, 2026</p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* What Are Cookies */}
            <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HelpCircle className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-3">What Are Cookies?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Types of Cookies */}
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-center">How We Use Cookies</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {cookieTypes.map((cookie, index) => (
                  <Card key={index} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <cookie.icon className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant={cookie.badgeVariant}>{cookie.badge}</Badge>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{cookie.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{cookie.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Managing Cookies */}
            <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Settings className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-3">Managing Cookies</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Most web browsers allow you to control cookies through their settings. Here's how to manage cookies in popular browsers:
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {browserSettings.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Globe className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.browser}</p>
                            <p className="text-xs text-muted-foreground">{item.path}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Third-Party Cookies */}
            <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-3">Third-Party Cookies</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Some cookies are placed by third-party services that appear on our pages. We do not control these cookies and recommend reviewing the privacy policies of these third parties.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Updates */}
            <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-3">Updates to This Policy</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Section */}
            <Card className="overflow-hidden border-primary/30 bg-primary/5">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      If you have any questions about our use of cookies, please contact us at{" "}
                      <a href="mailto:privacy@giveawayhub.com" className="text-primary hover:underline font-medium">
                        privacy@giveawayhub.com
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
