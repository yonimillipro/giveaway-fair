import * as React from "react";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Gift } from "lucide-react";
import { format } from "date-fns";

// useIsMobile is no longer strictly necessary for the layout, but kept for context if other logic relies on it.
import { useIsMobile } from "../hooks/use-mobile";

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
  onView?: (id: string) => void; // Click handler for viewing details
}

// Updated to use a single-column (flex-col) layout for optimal mobile readability.
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
  // const isMobile = useIsMobile(); // Removed for simplicity in responsive layout

  return (
    // Outer container for the border animation. Added 'relative' and 'p-[1.5px]' for border thickness.
    <div
      className="relative rounded-xl p-[1.5px] overflow-hidden group hover:shadow-glow transition-all duration-300 w-full"
      onClick={() => onView && onView(id)}
    >
      {/* 2. The Animated Border Layer */}
      <div
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl animate-border-spin"
        style={{
          background: "conic-gradient(from 0deg, #00ccff, #d500f9, #00ccff)",
        }}
      />

      {/* 3. The Actual Card Content */}
      <Card className="relative z-10 w-full h-full cursor-pointer flex flex-col transition-all duration-300">
        {/* Main Content Block: Always vertical (flex-col) for better stacking on small screens */}
        <div className={`flex flex-col`}>
          {/* Image/Placeholder Section (Always full width at the top) */}
          <div
            className="aspect-video w-full overflow-hidden bg-muted" // Standard aspect ratio for image
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                // Ensure image is contained and scales up on hover
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // prevents infinite loop
                  target.src =
                    "https://placehold.co/100x100/A0A0A0/FFFFFF?text=Gift";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <Gift className="w-12 h-12 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Details Section (Header and Content combined) - full width padding */}
          <div className={`px-4 pt-4 pb-2 flex-1`}>
            {/* Title and Prize Value (Header equivalent) */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
                {title}
              </h2>
              {prizeValue !== undefined && (
                <Badge variant="secondary" className="shrink-0 text-xs py-1">
                  ${prizeValue}
                </Badge>
              )}
            </div>

            {/* Description and Info (Content equivalent) */}
            <div className="mb-3">
              {/* Responsive description truncation */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {description}
              </p>

              {/* Responsive info block: flex wraps if needed */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-red-500">
                    {format(new Date(endDate), "MMM dd")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{entriesCount} entries</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer section (Action button) - stop click propagation */}
        <CardFooter
          className="p-4 pt-0 mt-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {hasJoined ? (
            <Button variant="secondary" className="w-full" disabled>
              Already Joined
            </Button>
          ) : onJoin ? (
            <Button onClick={() => onJoin(id)} className="w-full">
              Join Giveaway
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
};

// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Calendar, Users, Gift } from "lucide-react";
// import { format } from "date-fns";

// interface GiveawayCardProps {
//   id: string;
//   title: string;
//   description: string;
//   imageUrl?: string;
//   prizeValue?: number;
//   endDate: string;
//   entriesCount?: number;
//   hasJoined?: boolean;
//   onJoin?: (id: string) => void;
//   onView?: (id: string) => void; // Click handler for viewing details
// }

// export const GiveawayCard = ({
//   id,
//   title,
//   description,
//   imageUrl,
//   prizeValue,
//   endDate,
//   entriesCount = 0,
//   hasJoined = false,
//   onJoin,
//   onView,
// }: GiveawayCardProps) => {
//   return (
//     // The entire card is now clickable via the onView prop
//     <Card
//       className="overflow-hidden hover:shadow-glow transition-all duration-300 group cursor-pointer"
//       onClick={() => onView && onView(id)}
//     >
//       {/* Image/Placeholder section */}
//       <div className="aspect-video w-full overflow-hidden bg-muted">
//         {imageUrl ? (
//           <img
//             src={imageUrl}
//             alt={title}
//             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//           />
//         ) : (
//           <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
//             <Gift className="w-12 h-12 text-muted-foreground/50" />
//           </div>
//         )}
//       </div>

//       {/* Header section */}
//       <CardHeader>
//         <div className="flex items-start justify-between gap-2">
//           {/* CardTitle ensures responsive text truncation */}
//           <CardTitle className="line-clamp-2 text-base md:text-lg">
//             {title}
//           </CardTitle>
//           {prizeValue && (
//             <Badge variant="secondary" className="shrink-0 text-xs">
//               ${prizeValue}
//             </Badge>
//           )}
//         </div>
//       </CardHeader>

//       {/* Content section */}
//       <CardContent>
//         {/* Responsive description truncation */}
//         <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
//           {description}
//         </p>

//         {/* Responsive info block: flex wraps if needed */}
//         <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-muted-foreground">
//           <div className="flex items-center gap-1">
//             <Calendar className="w-4 h-4" />
//             <span>{format(new Date(endDate), "MMM dd")}</span>
//           </div>
//           <div className="flex items-center gap-1">
//             <Users className="w-4 h-4" />
//             <span>{entriesCount} entries</span>
//           </div>
//         </div>
//       </CardContent>

//       {/* Footer section (Action button) - stop click propagation here to prevent triggering onView */}
//       <CardFooter className="gap-2" onClick={(e) => e.stopPropagation()}>
//         {hasJoined ? (
//           <Button variant="secondary" className="w-full" disabled>
//             Already Joined
//           </Button>
//         ) : onJoin ? (
//           <Button onClick={() => onJoin(id)} className="w-full">
//             Join Giveaway
//           </Button>
//         ) : null}
//         {/* If there's an onView but no onJoin/hasJoined, the card is clickable, so a separate view button is redundant and removed. */}
//       </CardFooter>
//     </Card>
//   );
// };
// import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Calendar, Users, Gift } from 'lucide-react';
// import { format } from 'date-fns';

// interface GiveawayCardProps {
//   id: string;
//   title: string;
//   description: string;
//   imageUrl?: string;
//   prizeValue?: number;
//   endDate: string;
//   entriesCount?: number;
//   hasJoined?: boolean;
//   onJoin?: (id: string) => void;
//   onView?: (id: string) => void;
// }

// export const GiveawayCard = ({
//   id,
//   title,
//   description,
//   imageUrl,
//   prizeValue,
//   endDate,
//   entriesCount = 0,
//   hasJoined = false,
//   onJoin,
//   onView,
// }: GiveawayCardProps) => {
//   return (
//     <Card className="overflow-hidden hover:shadow-glow transition-all duration-300 group">
//       <div className="aspect-video w-full overflow-hidden bg-muted">
//         {imageUrl ? (
//           <img
//             src={imageUrl}
//             alt={title}
//             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//           />
//         ) : (
//           <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
//             <Gift className="w-16 h-16 text-primary-foreground opacity-50" />
//           </div>
//         )}
//       </div>

//       <CardHeader>
//         <div className="flex items-start justify-between gap-2">
//           <CardTitle className="line-clamp-2">{title}</CardTitle>
//           {prizeValue && (
//             <Badge variant="secondary" className="shrink-0">
//               ${prizeValue}
//             </Badge>
//           )}
//         </div>
//       </CardHeader>

//       <CardContent>
//         <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
//           {description}
//         </p>

//         <div className="flex items-center gap-4 text-sm text-muted-foreground">
//           <div className="flex items-center gap-1">
//             <Calendar className="w-4 h-4" />
//             <span>{format(new Date(endDate), 'MMM dd')}</span>
//           </div>
//           <div className="flex items-center gap-1">
//             <Users className="w-4 h-4" />
//             <span>{entriesCount} entries</span>
//           </div>
//         </div>
//       </CardContent>

//       <CardFooter className="gap-2">
//         {hasJoined ? (
//           <Button variant="secondary" className="w-full" disabled>
//             Already Joined
//           </Button>
//         ) : onJoin ? (
//           <Button onClick={() => onJoin(id)} className="w-full">
//             Join Giveaway
//           </Button>
//         ) : null}
//         {onView && (
//           <Button variant="outline" onClick={() => onView(id)}>
//             View
//           </Button>
//         )}
//       </CardFooter>
//     </Card>
//   );
// };
