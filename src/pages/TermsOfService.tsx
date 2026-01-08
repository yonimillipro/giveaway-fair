import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText, UserCheck, User, Gift, Ban, Copyright, AlertTriangle, RefreshCw, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TermsOfService = () => {
  const sections = [
    {
      icon: FileText,
      title: "Acceptance of Terms",
      content: "By accessing or using GiveawayHub, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site."
    },
    {
      icon: UserCheck,
      title: "Eligibility",
      content: "You must be at least 18 years old to use our services. By using GiveawayHub, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into these Terms."
    },
    {
      icon: User,
      title: "User Accounts",
      content: "When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding your password and for all activities that occur under your account."
    },
    {
      icon: Gift,
      title: "Giveaway Rules",
      content: null,
      list: [
        "One entry per person per giveaway unless otherwise specified",
        "Winners are selected randomly and fairly",
        "Prizes are non-transferable and cannot be exchanged for cash",
        "Winners must respond within 48 hours or a new winner may be selected",
        "Fraudulent entries will result in disqualification and account suspension"
      ]
    },
    {
      icon: Ban,
      title: "Prohibited Conduct",
      content: "You agree not to:",
      list: [
        "Create multiple accounts to increase chances of winning",
        "Use automated systems or bots to enter giveaways",
        "Impersonate others or provide false information",
        "Attempt to manipulate or interfere with giveaway outcomes",
        "Violate any applicable laws or regulations"
      ]
    },
    {
      icon: Copyright,
      title: "Intellectual Property",
      content: "The content, features, and functionality of GiveawayHub are owned by us and are protected by international copyright, trademark, and other intellectual property laws."
    },
    {
      icon: AlertTriangle,
      title: "Limitation of Liability",
      content: "GiveawayHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service."
    },
    {
      icon: RefreshCw,
      title: "Changes to Terms",
      content: "We reserve the right to modify or replace these Terms at any time. We will provide notice of any material changes by posting the new Terms on this page."
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
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Please read these terms carefully before using GiveawayHub. By using our service, you agree to these terms.
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
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                              <span>{item}</span>
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
                      If you have any questions about these Terms, please contact us at{" "}
                      <a href="mailto:legal@giveawayhub.com" className="text-primary hover:underline font-medium">
                        legal@giveawayhub.com
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

export default TermsOfService;
