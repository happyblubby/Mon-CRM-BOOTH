
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, DollarSign, TrendingUp, AlertCircle, FileSignature } from "lucide-react";
import { motion } from "framer-motion";

export default function CRMStats({ clients, invoices, quotes, contracts, onStatClick }) {
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const pendingRevenue = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + ((inv.amount || 0) - (inv.amount_paid || 0)), 0);
  
  const overDueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false;
    return inv.due_date && new Date(inv.due_date) < new Date();
  }).length;

  const activeQuotes = quotes.filter(q => q.status === 'sent').length;
  const signedContracts = contracts.filter(c => c.status === 'signed').length;

  const stats = [
    {
      title: "Total Clients",
      value: clients.length,
      icon: Users,
      color: "purple",
      change: `${clients.filter(c => c.status === 'active').length} active`,
      clickAction: () => onStatClick && onStatClick('clients')
    },
    {
      title: "Revenue Collected",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "emerald",
      change: `${invoices.filter(i => i.status === 'paid').length} paid invoices`,
      clickAction: () => onStatClick && onStatClick('invoices', 'paid')
    },
    {
      title: "Signed Contracts",
      value: signedContracts,
      icon: FileSignature,
      color: "red",
      change: `${contracts.length} total contracts`,
      clickAction: () => onStatClick && onStatClick('contracts', 'signed')
    },
    {
      title: "Pending / Overdue",
      value: `${invoices.filter(i => ['sent', 'partially_paid'].includes(i.status)).length} / ${overDueInvoices}`,
      icon: TrendingUp,
      color: "blue",
      change: "Pending / Overdue Invoices",
      clickAction: () => onStatClick && onStatClick('invoices', 'pending')
    },
  ];

  const colorVariants = {
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      shadow: "shadow-purple-500/20"
    },
    emerald: {
      bg: "bg-emerald-50", 
      text: "text-emerald-600",
      shadow: "shadow-emerald-500/20"
    },
    blue: {
      bg: "bg-blue-50", 
      text: "text-blue-600",
      shadow: "shadow-blue-500/20"
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600", 
      shadow: "shadow-orange-500/20"
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      shadow: "shadow-red-500/20"
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const variant = colorVariants[stat.color];
        
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={stat.clickAction}
            className="cursor-pointer"
          >
            <Card className={`relative overflow-hidden border-0 shadow-lg ${variant.shadow} bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm font-medium ${variant.text}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl ${variant.bg}`}>
                    <stat.icon className={`w-6 h-6 ${variant.text}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
