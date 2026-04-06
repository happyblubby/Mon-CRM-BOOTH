import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const colorVariants = {
  purple: {
    gradient: "from-purple-500 to-purple-600",
    bg: "bg-purple-900/20",
    text: "text-purple-400",
    shadow: "shadow-purple-500/10"
  },
  emerald: {
    gradient: "from-emerald-500 to-emerald-600", 
    bg: "bg-emerald-900/20",
    text: "text-emerald-400",
    shadow: "shadow-emerald-500/10"
  },
  blue: {
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-900/20", 
    text: "text-blue-400",
    shadow: "shadow-blue-500/10"
  },
  orange: {
    gradient: "from-orange-500 to-orange-600",
    bg: "bg-orange-900/20",
    text: "text-orange-400", 
    shadow: "shadow-orange-500/10"
  }
};

export default function StatsCard({ title, value, icon: Icon, color, change }) {
  const variant = colorVariants[color];
  
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`relative overflow-hidden border border-slate-700 shadow-lg ${variant.shadow} bg-slate-800/50 backdrop-blur-sm hover:shadow-xl hover:border-slate-600 transition-all duration-300 cursor-pointer`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
            <div className="space-y-2 sm:space-y-3 flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-400 leading-tight">{title}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-100 leading-none">{value}</p>
              {change && (
                <p className={`text-xs sm:text-sm font-medium ${variant.text} leading-tight`}>
                  {change}
                </p>
              )}
            </div>
            <div className={`p-2 sm:p-3 rounded-2xl ${variant.bg} self-end sm:self-start`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${variant.text}`} />
            </div>
          </div>
          
          {/* Decorative gradient */}
          <div className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${variant.gradient} opacity-10 rounded-full transform translate-x-12 sm:translate-x-16 -translate-y-12 sm:-translate-y-16`} />
        </CardContent>
      </Card>
    </motion.div>
  );
}