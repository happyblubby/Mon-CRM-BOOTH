import React, { useState, useEffect } from "react";
import { Quote } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Download, DollarSign, Calendar, User, Info, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-orange-100 text-orange-800 border-orange-200"
};

export default function QuoteDetails() {
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuote();
  }, []);

  const loadQuote = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const quoteId = urlParams.get('id');
    if (!quoteId) {
      navigate(createPageUrl("CRM"));
      return;
    }

    try {
      const quoteData = await Quote.get(quoteId);
      setQuote(quoteData);
    } catch (error) {
      console.error("Error loading quote details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 text-center">
        <h2 className="text-2xl font-bold">Quote not found</h2>
        <Button onClick={() => navigate(createPageUrl("CRM"))} className="mt-4">Go to CRM</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("CRM"))}
              className="rounded-2xl border-2 hover:border-blue-300 hover:bg-blue-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Quote {quote.quote_number}
              </h1>
              <p className="text-gray-600 text-lg mt-2">To: {quote.client_name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {quote.pdf_url && (
              <a href={quote.pdf_url} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="px-6 py-3 rounded-2xl border-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </Button>
              </a>
            )}
            <Link to={createPageUrl(`EditQuote?id=${quote.id}`)}>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/25">
                <Edit className="w-5 h-5 mr-2" />
                Edit Quote
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Quote Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-start justify-between border-b p-6">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  Quote Summary
                </CardTitle>
              </div>
              <Badge className={statusColors[quote.status]}>{quote.status}</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm font-medium text-blue-800">Quote Amount</p>
                  <p className="text-2xl font-bold text-blue-600">${(quote.amount || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-6 border-t">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p className="font-medium text-gray-800">{quote.issue_date ? format(parseISO(quote.issue_date), 'MMM d, yyyy') : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Valid Until</p>
                    <p className="font-medium text-gray-800">{quote.valid_until ? format(parseISO(quote.valid_until), 'MMM d, yyyy') : 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {quote.description && (
                <div className="pt-6 border-t">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Info className="w-5 h-5"/> Description</h4>
                  <p className="text-gray-600">{quote.description}</p>
                </div>
              )}
              
              {quote.notes && (
                <div className="pt-6 border-t">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><FileText className="w-5 h-5"/> Notes</h4>
                  <p className="text-gray-600">{quote.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}