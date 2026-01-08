import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Users, Target, Heart } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">About Us</h1>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            We're on a mission to connect brands with engaged audiences through exciting giveaways.
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <p>
              GiveawayHub was founded with a simple idea: make it easy for brands to connect with their
              audience while giving users the chance to win amazing prizes. Since our launch, we've
              helped thousands of companies run successful giveaway campaigns and brought joy to
              countless winners.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 mb-16">
            <div className="text-center p-6 rounded-xl border bg-card">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
              <p className="text-muted-foreground text-sm">
                To create the most trusted platform for fair and transparent giveaways.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl border bg-card">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Our Team</h3>
              <p className="text-muted-foreground text-sm">
                A passionate group of developers, designers, and marketers.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl border bg-card">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Our Values</h3>
              <p className="text-muted-foreground text-sm">
                Transparency, fairness, and putting our users first in everything we do.
              </p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Happy Winners</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Partner Brands</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$1M+</div>
              <div className="text-muted-foreground">Prizes Awarded</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
