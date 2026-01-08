import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Briefcase, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Careers = () => {
  const openings = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "San Francisco, CA",
      type: "Full-time",
    },
    {
      title: "Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Customer Success Specialist",
      department: "Support",
      location: "Remote",
      type: "Full-time",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Careers</h1>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Join our team and help us build the future of giveaways. We're always looking for talented people.
          </p>

          <div className="mb-12 p-8 rounded-xl bg-muted/50 text-center">
            <h2 className="text-2xl font-bold mb-4">Why Work With Us?</h2>
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <div className="font-semibold mb-1">Remote First</div>
                <div className="text-muted-foreground">Work from anywhere in the world</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Competitive Pay</div>
                <div className="text-muted-foreground">Industry-leading compensation</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Great Benefits</div>
                <div className="text-muted-foreground">Health, dental, and more</div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
          <div className="space-y-4">
            {openings.map((job) => (
              <div
                key={job.title}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <Button>Apply Now</Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center text-muted-foreground">
            <p>Don't see a role that fits? Send your resume to careers@giveawayhub.com</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
