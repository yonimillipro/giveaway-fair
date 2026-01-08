import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Gift, UserPlus, Trophy, Bell } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Create an Account",
      description: "Sign up for free and complete your profile to get started with GiveawayHub.",
    },
    {
      icon: Gift,
      title: "Browse Giveaways",
      description: "Explore exciting giveaways from top brands and find prizes you love.",
    },
    {
      icon: Bell,
      title: "Complete Requirements",
      description: "Follow the entry requirements like following companies or verifying your email.",
    },
    {
      icon: Trophy,
      title: "Win Amazing Prizes",
      description: "Winners are selected randomly and notified via email. Good luck!",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">How It Works</h1>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Participating in giveaways is easy! Follow these simple steps to start winning amazing prizes.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary shrink-0">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Step {index + 1}</div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 rounded-xl bg-muted/50 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Winning?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of users who have already won amazing prizes on GiveawayHub.
            </p>
            <a
              href="/auth"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started Now
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
