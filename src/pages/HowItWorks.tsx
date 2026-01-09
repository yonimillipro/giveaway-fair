import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Gift, UserPlus, Trophy, Bell, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Create an Account",
      description: "Sign up for free and complete your profile to get started with GiveawayHub.",
      step: 1,
    },
    {
      icon: Gift,
      title: "Browse Giveaways",
      description: "Explore exciting giveaways from top brands and find prizes you love.",
      step: 2,
    },
    {
      icon: Bell,
      title: "Complete Requirements",
      description: "Follow the entry requirements like following companies or verifying your email.",
      step: 3,
    },
    {
      icon: Trophy,
      title: "Win Amazing Prizes",
      description: "Winners are selected randomly and notified via email. Good luck!",
      step: 4,
    },
  ];

  const features = [
    {
      title: "100% Free to Enter",
      description: "All giveaways on our platform are completely free to enter.",
    },
    {
      title: "Verified Companies",
      description: "We only partner with trusted and verified brands.",
    },
    {
      title: "Fair Selection",
      description: "Winners are selected randomly using a transparent system.",
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
                <Sparkles className="w-4 h-4" />
                Simple Steps to Win
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                How It Works
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Participating in giveaways is easy! Follow these simple steps to start winning amazing prizes from top brands.
              </p>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-16 container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid gap-6 md:grid-cols-2">
              {steps.map((step, index) => (
                <Card
                  key={step.title}
                  className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <step.icon className="w-7 h-7" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
                Why Choose GiveawayHub?
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {features.map((feature) => (
                  <Card key={feature.title} className="text-center border-0 shadow-md bg-card">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-primary to-primary/90">
              <CardContent className="p-8 md:p-12 text-center">
                <Trophy className="w-16 h-16 text-primary-foreground/90 mx-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
                  Ready to Start Winning?
                </h2>
                <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                  Join thousands of users who have already won amazing prizes on GiveawayHub. Create your free account today!
                </p>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="font-semibold"
                >
                  <Link to="/auth">
                    Get Started Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
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

export default HowItWorks;
