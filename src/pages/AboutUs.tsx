import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Users, Target, Heart, Award, Globe, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AboutUs = () => {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To create the most trusted platform for fair and transparent giveaways.",
    },
    {
      icon: Users,
      title: "Our Team",
      description: "A passionate group of developers, designers, and marketers.",
    },
    {
      icon: Heart,
      title: "Our Values",
      description: "Transparency, fairness, and putting our users first in everything we do.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Happy Winners", icon: Award },
    { value: "500+", label: "Partner Brands", icon: Globe },
    { value: "$1M+", label: "Prizes Awarded", icon: Zap },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Heart className="w-4 h-4" />
                Our Story
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                About Us
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We're on a mission to connect brands with engaged audiences through exciting giveaways.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    GiveawayHub was founded with a simple idea: make it easy for brands to connect with their
                    audience while giving users the chance to win amazing prizes. Since our launch, we've
                    helped thousands of companies run successful giveaway campaigns and brought joy to
                    countless winners.
                  </p>
                  <p className="text-lg leading-relaxed text-muted-foreground mt-4">
                    Our platform is built on the principles of transparency, fairness, and user satisfaction.
                    We believe that everyone deserves a fair chance to win, and we work tirelessly to ensure
                    our selection process is completely random and unbiased.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">What Drives Us</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {values.map((value) => (
                  <Card
                    key={value.title}
                    className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
                  >
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <value.icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                        {value.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Our Impact</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {stats.map((stat) => (
                  <Card
                    key={stat.label}
                    className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80"
                  >
                    <CardContent className="p-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <stat.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                        {stat.value}
                      </div>
                      <div className="text-muted-foreground font-medium">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
