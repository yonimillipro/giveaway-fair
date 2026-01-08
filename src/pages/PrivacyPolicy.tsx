import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Eye, Share2, Lock, Cookie, UserCheck, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Eye,
      title: "Information We Collect",
      content: "We collect information you provide directly to us, such as when you create an account, participate in giveaways, or contact us for support. This may include your name, email address, and social media handles."
    },
    {
      icon: Shield,
      title: "How We Use Your Information",
      content: null,
      list: [
        "Provide, maintain, and improve our services",
        "Process giveaway entries and notify winners",
        "Send you technical notices and support messages",
        "Respond to your comments and questions",
        "Detect and prevent fraudulent activity"
      ]
    },
    {
      icon: Share2,
      title: "Information Sharing",
      content: "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law."
    },
    {
      icon: Lock,
      title: "Data Security",
      content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction."
    },
    {
      icon: Cookie,
      title: "Cookies",
      content: "We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent."
    },
    {
      icon: UserCheck,
      title: "Your Rights",
      content: null,
      list: [
        "Access your personal data",
        "Correct inaccurate data",
        "Request deletion of your data",
        "Object to processing of your data",
        "Request data portability"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-muted-foreground mt-4">Last updated: January 8, 2026</p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto space-y-6">
            {sections.map((section, index) => (
              <Card key={index} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <section.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                      {section.content && (
                        <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                      )}
                      {section.list && (
                        <ul className="space-y-2 mt-2">
                          {section.list.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

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
                      If you have any questions about this Privacy Policy, please contact us at{" "}
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

export default PrivacyPolicy;
