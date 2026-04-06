import React, { useState, useEffect } from "react";
import { Quote, Client } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, DollarSign, Upload, Loader2, Trash2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditQuote() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [error, setError] = useState(null);
  const [quoteData, setQuoteData] = useState({
    client_name: "",
    quote_number: "",
    amount: "",
    status: "draft",
    valid_until: "",
    issue_date: "",
    description: "",
    notes: "",
    pdf_url: "",
    extracted_data: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const quoteId = urlParams.get('id');
    
    if (!quoteId) {
      navigate(createPageUrl("CRM"));
      return;
    }

    try {
      const [quote, clientsData] = await Promise.all([
        Quote.get(quoteId),
        Client.list()
      ]);
      
      setQuoteData({
        ...quote,
        amount: quote.amount || ""
      });
      setClients(clientsData);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load quote details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessingPDF(true);
    try {
      const { file_url } = await UploadFile({ file });
      updateField("pdf_url", file_url);
      
      const schema = {
        type: "object",
        properties: {
          quote_number: { type: "string" },
          client_name: { type: "string" },
          amount: { type: "number" },
          valid_until: { type: "string" },
          issue_date: { type: "string" },
          description: { type: "string" },
          notes: { type: "string" }
        }
      };
      
      const extractResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });
      
      if (extractResult.status === "success" && extractResult.output) {
        const extracted = extractResult.output;
        updateField("extracted_data", extracted);
        
        if (extracted.quote_number) updateField("quote_number", extracted.quote_number);
        if (extracted.client_name) updateField("client_name", extracted.client_name);
        if (extracted.amount) updateField("amount", extracted.amount.toString());
        if (extracted.valid_until) updateField("valid_until", extracted.valid_until);
        if (extracted.issue_date) updateField("issue_date", extracted.issue_date);
        if (extracted.description) updateField("description", extracted.description);
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      setError("Failed to process PDF file");
    } finally {
      setIsProcessingPDF(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const quoteId = urlParams.get('id');
      
      const dataToSubmit = {
        ...quoteData,
        amount: quoteData.amount ? parseFloat(quoteData.amount) : 0
      };
      
      await Quote.update(quoteId, dataToSubmit);
      navigate(createPageUrl("CRM"));
    } catch (error) {
      console.error("Error updating quote:", error);
      setError("Failed to update quote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this quote? This action cannot be undone.")) {
      return;
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const quoteId = urlParams.get('id');
      
      await Quote.delete(quoteId);
      navigate(createPageUrl("CRM"));
    } catch (error) {
      console.error("Error deleting quote:", error);
      setError("Failed to delete quote. Please try again.");
    }
  };

  const updateField = (field, value) => {
    setQuoteData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
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
          className="flex items-center gap-6"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("CRM"))}
            className="rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Edit Quote
            </h1>
            <p className="text-gray-600 text-lg mt-2">
              Update quote {quoteData.quote_number || 'details'}
            </p>
          </div>
        </motion.div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-blue-600" />
                Quote Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {/* PDF Upload */}
              <div className="mb-8 p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                    {isProcessingPDF ? (
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {isProcessingPDF ? "Processing PDF..." : "Upload New Quote PDF"}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {isProcessingPDF 
                        ? "Extracting data from your PDF document..." 
                        : "Upload a new PDF to update quote information"
                      }
                    </p>
                    <Button asChild disabled={isProcessingPDF}>
                      <label htmlFor="pdf-upload" className="cursor-pointer">
                        {isProcessingPDF ? "Processing..." : "Choose PDF File"}
                      </label>
                    </Button>
                    <input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handlePDFUpload}
                      className="hidden"
                      disabled={isProcessingPDF}
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
                    Quote Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="client_name" className="text-sm font-medium text-gray-700">
                        Client *
                      </Label>
                      <Select value={quoteData.client_name} onValueChange={(value) => updateField("client_name", value)}>
                        <SelectTrigger className="rounded-xl border-gray-200 focus:border-blue-400">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.name}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quote_number" className="text-sm font-medium text-gray-700">
                        Quote Number
                      </Label>
                      <Input
                        id="quote_number"
                        value={quoteData.quote_number || ""}
                        onChange={(e) => updateField("quote_number", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-blue-400"
                        placeholder="QTE-2024-001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                        Quote Amount *
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={quoteData.amount}
                        onChange={(e) => updateField("amount", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-blue-400"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select value={quoteData.status} onValueChange={(value) => updateField("status", value)}>
                        <SelectTrigger className="rounded-xl border-gray-200 focus:border-blue-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issue_date" className="text-sm font-medium text-gray-700">
                        Issue Date
                      </Label>
                      <Input
                        id="issue_date"
                        type="date"
                        value={quoteData.issue_date || ""}
                        onChange={(e) => updateField("issue_date", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-blue-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valid_until" className="text-sm font-medium text-gray-700">
                        Valid Until
                      </Label>
                      <Input
                        id="valid_until"
                        type="date"
                        value={quoteData.valid_until || ""}
                        onChange={(e) => updateField("valid_until", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={quoteData.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-blue-400 min-h-24"
                    placeholder="Services to be provided..."
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={quoteData.notes || ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-blue-400 min-h-20"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t border-gray-100">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleDelete}
                    className="px-6 py-3 rounded-2xl border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete Quote
                  </Button>
                  
                  <div className="flex gap-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => navigate(createPageUrl("CRM"))}
                      className="px-8 py-3 rounded-2xl"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30"
                    >
                      {isSubmitting ? (
                        <>Updating...</>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Update Quote
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}