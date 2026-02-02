import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  totalEntries: number;
  activeGiveaways: number;
  wins: number;
  loading?: boolean;
}

export const StatsCards = ({
  totalEntries,
  activeGiveaways,
  wins,
  loading = false,
}: StatsCardsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-md rounded-xl">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-20 hidden sm:block" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Entries",
      value: totalEntries,
      description: "Your total participation",
      icon: Users,
      gradient: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "Active",
      value: activeGiveaways,
      description: "Available to join",
      icon: Gift,
      gradient: "from-green-500/10 to-emerald-500/10",
      iconColor: "text-green-500",
    },
    {
      title: "Wins",
      value: wins,
      description: "Total victories",
      icon: Trophy,
      gradient: "from-yellow-500/10 to-orange-500/10",
      iconColor: "text-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className={`shadow-md hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden bg-gradient-to-br ${stat.gradient} border-0`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              {stat.value}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};