
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  progress?: number;
  trendText?: string;
  trendColor?: string;
}

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  subtext,
  progress,
  trendText,
  trendColor = "text-emerald-400"
}: StatsCardProps) => {
  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-lg font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-purple-400" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}</div>
        {progress !== undefined && (
          <div className="space-y-2 mt-2">
            <Progress value={progress} className="h-2" />
          </div>
        )}
        {subtext && <p className="text-sm text-gray-400">{subtext}</p>}
        {trendText && <p className={`text-sm ${trendColor}`}>{trendText}</p>}
      </CardContent>
    </Card>
  );
};
