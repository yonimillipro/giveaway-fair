import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Briefcase, MapPin, Clock, Rocket, Heart, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Careers = () => {
  const benefits = [
    {
      icon: Globe,
      title: "Remote First",
      description: "Work from anywhere in the world with flexible hours",
    },
    {
      icon: Heart,
      title: "Great Benefits",
      description: "Health, dental, vision, and mental health support",
    },
    {
      icon: Rocket,
      title: "Growth Focused",
      description: "Learning budget and career development opportunities",
    },
  ];

  const openings = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      tags: ["React", "TypeScript", "Tailwind"],
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "San Francisco, CA",
      type: "Full-time",
      tags: ["Figma", "UI/UX", "Design Systems"],
    },
    {
      title: "Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      tags: ["Growth", "Analytics", "Content"],
    },
    {
      title: "Customer Success Specialist",
      department: "Support",
      location: "Remote",
      type: "Full-time",
      tags: ["Support", "Communication", "SaaS"],
    },
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
                <Briefcase className="w-4 h-4" />
                Join Our Team
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Careers at GiveawayHub
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join our team and help us build the future of giveaways. We're always looking for talented people who share our passion.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Why Work With Us?</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {benefits.map((benefit) => (
                <Card
                  key={benefit.title}
                  className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <benefit.icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Open Positions</h2>
              <div className="space-y-4">
                {openings.map((job) => (
                  <Card
                    key={job.title}
                    className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl overflow-hidden"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-3">
                          <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="w-4 h-4" />
                              {job.department}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {job.type}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {job.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button className="group/btn shrink-0">
                          Apply Now
                          <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-0 shadow-lg bg-muted/50">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Don't See the Right Role?</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                We're always looking for talented individuals. Send your resume to{" "}
                <a href="mailto:careers@giveawayhub.com" className="text-primary hover:underline font-medium">
                  careers@giveawayhub.com
                </a>
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
