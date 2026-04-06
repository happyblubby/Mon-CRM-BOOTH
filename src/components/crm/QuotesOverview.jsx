
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Calendar, Clock, Eye, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO, isPast } from "date-fns";
import { motion } from "framer-motion";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-orange-100 text-orange-800 border-orange-200"
};

export default function QuotesOverview({ quotes, searchTerm, onUpdate }) {
  const filteredQuotes = quotes.filter(quote =>
    quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getQuoteStatus = (quote) => {
    if (quote.status === 'accepted' || quote.status === 'rejected') {
      return quote.status;
    }
    if (quote.valid_until && isPast(parseISO(quote.valid_until))) {
      return 'expired';
    }
    return quote.status;
  };

  return (
    <div className="space-y-4">
      {filteredQuotes.map((quote, index) => {
        const status = getQuoteStatus(quote);
        
        return (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                            {quote.quote_number || `QTE-${quote.id?.slice(0, 8)}`}
                          </h3>
                          <Badge className={`${statusColors[status]} text-xs`}>
                            {status}
                          </Badge>
                          {status === 'expired' && (
                            <Clock className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                        
                        <p className="text-gray-600 font-medium text-sm sm:text-base truncate">{quote.client_name}</p>
                        
                        {quote.description && (
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{quote.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500">
                          {quote.issue_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Issued: {format(parseISO(quote.issue_date), 'MMM d, yyyy')}
                            </div>
                          )}
                          
                          {quote.valid_until && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Valid until: {format(parseISO(quote.valid_until), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-left sm:text-right space-y-2 pt-2 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center sm:justify-end gap-1">
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                          {(quote.amount || 0).toLocaleString()}
                        </div>
                        
                        <div className="flex gap-2">
                          <Link to={createPageUrl(`QuoteDetails?id=${quote.id}`)}>
                            <Button variant="outline" size="sm" className="rounded-xl text-xs sm:text-sm">
                              <Eye className="w-4 h-4 mr-2" /> View
                            </Button>
                          </Link>
                          <Link to={createPageUrl(`EditQuote?id=${quote.id}`)}>
                            <Button variant="outline" size="sm" className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm">
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
      
      {filteredQuotes.length === 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No quotes found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? "Try adjusting your search terms"
                : "Create your first quote to get started"
              }
            </p>
            {!searchTerm && (
              <Link to={createPageUrl("AddQuote")}>
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-2xl">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Create First Quote
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
