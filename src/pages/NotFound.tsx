import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Home, Search, Trophy, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center">
        <CardContent className="pt-12 pb-8 px-8">
          {/* Animated Gift Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <Gift className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 left-0 right-0 mx-auto w-fit">
              <span className="text-6xl font-bold text-muted-foreground/20">404</span>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Oops! This Giveaway Doesn't Exist
          </h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for might have ended, been removed, or never existed. 
            Don't worry though — there are plenty of amazing giveaways waiting for you!
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full gap-2"
              size="lg"
            >
              <Home className="w-4 h-4" />
              Browse Active Giveaways
            </Button>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="flex-1 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/promotions')}
                className="flex-1 gap-2"
              >
                <Trophy className="w-4 h-4" />
                View Deals
              </Button>
            </div>
          </div>

          {/* Fun Stats Teaser */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              While you're here, check out what's happening:
            </p>
            <div className="flex justify-center gap-6 text-center">
              <div>
                <Gift className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Active Giveaways</p>
              </div>
              <div>
                <Trophy className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Winners Daily</p>
              </div>
              <div>
                <Search className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Easy to Enter</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
