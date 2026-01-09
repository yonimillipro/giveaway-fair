import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Cookie, Shield, BarChart3, Target } from "lucide-react";
import { toast } from "sonner";

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookiePreferences = () => {
  const [settings, setSettings] = useState<CookieSettings>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    const savedPreferences = localStorage.getItem("cookie-preferences");
    
    if (savedPreferences) {
      setSettings(JSON.parse(savedPreferences));
    } else if (consent === "accepted") {
      setSettings({ essential: true, analytics: true, marketing: true });
    } else if (consent === "declined") {
      setSettings({ essential: true, analytics: false, marketing: false });
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("cookie-consent", settings.analytics || settings.marketing ? "accepted" : "declined");
    localStorage.setItem("cookie-preferences", JSON.stringify(settings));
    toast.success("Cookie preferences saved successfully!");
  };

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    setSettings(allAccepted);
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-preferences", JSON.stringify(allAccepted));
    toast.success("All cookies accepted!");
  };

  const handleRejectAll = () => {
    const allRejected = { essential: true, analytics: false, marketing: false };
    setSettings(allRejected);
    localStorage.setItem("cookie-consent", "declined");
    localStorage.setItem("cookie-preferences", JSON.stringify(allRejected));
    toast.success("Optional cookies rejected!");
  };

  const cookieTypes = [
    {
      id: "essential",
      icon: Shield,
      title: "Essential Cookies",
      description: "Required for the website to function properly. Cannot be disabled.",
      disabled: true,
    },
    {
      id: "analytics",
      icon: BarChart3,
      title: "Analytics Cookies",
      description: "Help us understand how visitors interact with our website.",
      disabled: false,
    },
    {
      id: "marketing",
      icon: Target,
      title: "Marketing Cookies",
      description: "Used to deliver personalized advertisements.",
      disabled: false,
    },
  ];

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Cookie Preferences</CardTitle>
            <CardDescription>Manage your cookie settings and privacy preferences</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {cookieTypes.map((cookie) => (
          <div
            key={cookie.id}
            className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50"
          >
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-background shrink-0">
                <cookie.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <Label htmlFor={cookie.id} className="text-sm font-medium cursor-pointer">
                  {cookie.title}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">{cookie.description}</p>
              </div>
            </div>
            <Switch
              id={cookie.id}
              checked={settings[cookie.id as keyof CookieSettings]}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, [cookie.id]: checked }))
              }
              disabled={cookie.disabled}
            />
          </div>
        ))}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button variant="outline" onClick={handleRejectAll} className="flex-1">
            Reject All
          </Button>
          <Button variant="outline" onClick={handleAcceptAll} className="flex-1">
            Accept All
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CookiePreferences;
