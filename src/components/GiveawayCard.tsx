import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Gift } from 'lucide-react';
import { format } from 'date-fns';

interface GiveawayCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  prizeValue?: number;
  endDate: string;
  entriesCount?: number;
  hasJoined?: boolean;
  onJoin?: (id: string) => void;
  onView?: (id: string) => void;
}

export const GiveawayCard = ({
  id,
  title,
  description,
  imageUrl,
  prizeValue,
  endDate,
  entriesCount = 0,
  hasJoined = false,
  onJoin,
  onView,
}: GiveawayCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-glow transition-all duration-300 group">
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
            <Gift className="w-16 h-16 text-primary-foreground opacity-50" />
          </div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2">{title}</CardTitle>
          {prizeValue && (
            <Badge variant="secondary" className="shrink-0">
              ${prizeValue}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(endDate), 'MMM dd')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{entriesCount} entries</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="gap-2">
        {hasJoined ? (
          <Button variant="secondary" className="w-full" disabled>
            Already Joined
          </Button>
        ) : onJoin ? (
          <Button onClick={() => onJoin(id)} className="w-full">
            Join Giveaway
          </Button>
        ) : null}
        {onView && (
          <Button variant="outline" onClick={() => onView(id)}>
            View
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};