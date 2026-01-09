import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <Card className="max-w-4xl mx-auto p-4 md:p-6 bg-card/95 backdrop-blur-sm border shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">We use cookies</p>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your browsing experience and analyze our traffic.{" "}
                <Link to="/cookies" className="text-primary hover:underline">
                  Learn more
                </Link>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={handleDecline} className="flex-1 md:flex-none">
              Decline
            </Button>
            <Button size="sm" onClick={handleAccept} className="flex-1 md:flex-none">
              Accept All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
