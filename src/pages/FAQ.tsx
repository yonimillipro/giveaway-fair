import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Gift, Trophy, Shield, CreditCard, Users, Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FAQ = () => {
  const faqCategories = [
    {
      title: "Getting Started",
      icon: Gift,
      questions: [
        {
          question: "What is GiveawayHub?",
          answer:
            "GiveawayHub is a platform that connects brands with engaged audiences through exciting giveaways. Users can enter giveaways for free and win amazing prizes from verified companies.",
        },
        {
          question: "How do I create an account?",
          answer:
            "Click the 'Sign Up' button in the navigation bar. You can register using your email address. Once registered, you'll need to verify your email to participate in giveaways.",
        },
        {
          question: "Is it free to participate in giveaways?",
          answer:
            "Yes! All giveaways on GiveawayHub are completely free to enter. We never charge users to participate in any giveaway on our platform.",
        },
        {
          question: "Do I need to complete my profile?",
          answer:
            "While you can browse giveaways without a complete profile, some giveaways may require you to have a verified email or follow specific companies to enter.",
        },
      ],
    },
    {
      title: "Participating in Giveaways",
      icon: Trophy,
      questions: [
        {
          question: "How do I enter a giveaway?",
          answer:
            "Simply browse our giveaways, click on one you're interested in, and complete the entry requirements. Requirements may include following the company, verifying your email, or connecting your social media accounts.",
        },
        {
          question: "Can I enter multiple giveaways at once?",
          answer:
            "Absolutely! You can enter as many giveaways as you want. There's no limit to the number of giveaways you can participate in.",
        },
        {
          question: "What are entry requirements?",
          answer:
            "Entry requirements vary by giveaway. Common requirements include email verification, following the hosting company, or connecting social media accounts like Twitter, Instagram, TikTok, or YouTube.",
        },
        {
          question: "How are winners selected?",
          answer:
            "Winners are selected randomly using a fair and transparent selection system. Each valid entry has an equal chance of winning.",
        },
      ],
    },
    {
      title: "Winning & Prizes",
      icon: CreditCard,
      questions: [
        {
          question: "How will I know if I've won?",
          answer:
            "Winners are notified via email at the address associated with their account. Make sure your email is verified and check your spam folder regularly.",
        },
        {
          question: "How do I claim my prize?",
          answer:
            "Once notified, you'll receive instructions on how to claim your prize. This typically involves confirming your shipping address or providing additional details required by the sponsor.",
        },
        {
          question: "How long do I have to claim my prize?",
          answer:
            "Prize claim periods vary by giveaway. Typically, you'll have 7-14 days to respond to the winner notification. Check the specific giveaway terms for details.",
        },
        {
          question: "Are prizes shipped internationally?",
          answer:
            "Shipping availability depends on the individual giveaway and sponsor. Check each giveaway's terms and conditions for eligible countries.",
        },
      ],
    },
    {
      title: "Account & Security",
      icon: Shield,
      questions: [
        {
          question: "How do I reset my password?",
          answer:
            "Click 'Forgot Password' on the login page and enter your email address. You'll receive a link to reset your password.",
        },
        {
          question: "Is my personal information secure?",
          answer:
            "Yes, we take security seriously. Your data is encrypted and we never share your personal information with third parties without your consent. Read our Privacy Policy for more details.",
        },
        {
          question: "Can I delete my account?",
          answer:
            "Yes, you can request account deletion by contacting our support team. Please note that this action is irreversible and you'll lose access to all your entries and history.",
        },
        {
          question: "Why do I need to verify my email?",
          answer:
            "Email verification helps us ensure that only real users participate in giveaways, making the platform fair for everyone. It's also how we contact winners!",
        },
      ],
    },
    {
      title: "For Companies",
      icon: Users,
      questions: [
        {
          question: "How can my company host a giveaway?",
          answer:
            "Contact us through our Contact page or email us at business@giveawayhub.com. Our team will guide you through the process of setting up your giveaway campaign.",
        },
        {
          question: "What are the benefits of hosting on GiveawayHub?",
          answer:
            "You'll gain access to our engaged community, increase brand awareness, grow your social following, and collect valuable leads—all while our platform handles the technical aspects.",
        },
        {
          question: "How much does it cost to host a giveaway?",
          answer:
            "Pricing varies based on the campaign scope and features you need. Contact our sales team for a customized quote tailored to your marketing goals.",
        },
        {
          question: "Can I target specific audiences?",
          answer:
            "Yes! We offer various targeting options including geographic location, interests, and demographic filters to help you reach your ideal audience.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <HelpCircle className="w-4 h-4" />
                Help Center
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Frequently Asked Questions
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Find answers to common questions about participating in giveaways, winning prizes, and more.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-12 md:py-16 container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {faqCategories.map((category) => (
              <Card
                key={category.title}
                className="border-2 overflow-hidden hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-6 bg-muted/30 border-b">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                      <category.icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-semibold">{category.title}</h2>
                  </div>
                  <Accordion type="single" collapsible className="px-6">
                    {category.questions.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`${category.title}-${index}`}
                        className="border-b last:border-0"
                      >
                        <AccordionTrigger className="text-left hover:text-primary py-5 text-base">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Telegram Community Section */}
        <section className="py-12 md:py-16 container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-2 border-[hsl(200,80%,50%)]/30 bg-gradient-to-br from-[hsl(200,80%,50%)]/5 to-[hsl(200,80%,60%)]/10 overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="flex-shrink-0 p-4 rounded-2xl bg-[hsl(200,80%,50%)] text-white shadow-lg">
                  <MessageCircle className="w-10 h-10" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">Join Our Telegram Community</h2>
                  <p className="text-muted-foreground mb-4 max-w-xl">
                    Connect with thousands of giveaway enthusiasts! Get instant notifications about new giveaways, 
                    exclusive tips, winner announcements, and chat directly with our community members and support team.
                  </p>
                  <ul className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(200,80%,50%)]" />
                      Instant giveaway alerts
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(200,80%,50%)]" />
                      Winner announcements
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(200,80%,50%)]" />
                      Community support
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(200,80%,50%)]" />
                      Exclusive tips
                    </li>
                  </ul>
                </div>
                <div className="flex-shrink-0">
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-[hsl(200,80%,50%)] hover:bg-[hsl(200,80%,45%)] text-white font-semibold gap-2"
                  >
                    <a href="https://t.me/GiveawayHubCommunity" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-5 h-5" />
                      Join Telegram
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Still Have Questions CTA */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto border-0 shadow-xl bg-gradient-to-br from-primary to-primary/90">
              <CardContent className="p-8 md:p-12 text-center">
                <Mail className="w-14 h-14 text-primary-foreground/90 mx-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
                  Still Have Questions?
                </h2>
                <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                  Can't find the answer you're looking for? Our support team is here to help you with any questions.
                </p>
                <Button asChild size="lg" variant="secondary" className="font-semibold">
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
