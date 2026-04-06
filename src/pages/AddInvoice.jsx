
import React, { useState, useEffect } from "react";
import { Invoice, Client } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, FileText, Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AddInvoice() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    client_name: "",
    client_email: "",
    invoice_number: "",
    amount: "", // TTC
    tax_free_amount: "", // HT
    vat_amount: "", // TVA
    amount_paid: "",
    status: "draft",
    due_date: "",
    issue_date: "",
    description: "",
    notes: "",
    pdf_url: "",
    extracted_data: null,
    payment_history: [],
    send_reminders: false,
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const clientsData = await Client.list();
      setClients(clientsData);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const handleClientChange = (clientName) => {
    const selectedClient = clients.find(c => c.name === clientName);
    updateField("client_name", clientName);
    if (selectedClient) {
      updateField("client_email", selectedClient.email || "");
    } else {
      updateField("client_email", ""); // Clear email if client not found or unselected
    }
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessingPDF(true);
    try {
      // Upload the file
      const { file_url } = await UploadFile({ file });
      updateField("pdf_url", file_url);
      
      // Extract data from PDF
      const schema = {
        type: "object",
        properties: {
          invoice_number: { type: "string" },
          client_name: { type: "string" },
          client_email: { type: "string" },
          amount: { type: "number", description: "Total amount including tax (TTC)" },
          tax_free_amount: { type: "number", description: "Amount before tax (HT)" },
          vat_amount: { type: "number", description: "VAT amount (TVA)" },
          amount_paid: { type: "number" },
          due_date: { type: "string" },
          issue_date: { type: "string" },
          description: { type: "string" },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                rate: { type: "number" },
                amount: { type: "number" }
              }
            }
          },
          payment_status: { type: "string" },
          notes: { type: "string" },
          payment_history: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                amount: { type: "number" },
                method: { type: "string" }
              }
            }
          }
        }
      };
      
      const extractResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });
      
      if (extractResult.status === "success" && extractResult.output) {
        const extracted = extractResult.output;
        updateField("extracted_data", extracted);
        
        // Auto-fill form with extracted data
        if (extracted.invoice_number) updateField("invoice_number", extracted.invoice_number);
        if (extracted.client_name) updateField("client_name", extracted.client_name);
        if (extracted.client_email) updateField("client_email", extracted.client_email);
        if (extracted.amount) updateField("amount", extracted.amount.toString());
        if (extracted.tax_free_amount) updateField("tax_free_amount", extracted.tax_free_amount.toString());
        if (extracted.vat_amount) updateField("vat_amount", extracted.vat_amount.toString());
        if (extracted.amount_paid) updateField("amount_paid", extracted.amount_paid.toString());
        if (extracted.due_date) updateField("due_date", extracted.due_date);
        if (extracted.issue_date) updateField("issue_date", extracted.issue_date);
        if (extracted.description) updateField("description", extracted.description);
        if (extracted.payment_history && Array.isArray(extracted.payment_history)) updateField("payment_history", extracted.payment_history);
        if (extracted.notes) updateField("notes", extracted.notes);

        // Set status based on payment
        if (extracted.payment_status) {
          const status = extracted.payment_status.toLowerCase();
          if (status.includes('paid')) updateField("status", "paid");
          else if (status.includes('sent')) updateField("status", "sent");
        } else if (extracted.amount_paid && extracted.amount) {
          if (extracted.amount_paid >= extracted.amount) {
            updateField("status", "paid");
          } else if (extracted.amount_paid > 0) {
            updateField("status", "sent");
          }
        }
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
    } finally {
      setIsProcessingPDF(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const dataToSubmit = {
        ...invoiceData,
        amount: invoiceData.amount ? parseFloat(invoiceData.amount) : 0,
        tax_free_amount: invoiceData.tax_free_amount ? parseFloat(invoiceData.tax_free_amount) : undefined,
        vat_amount: invoiceData.vat_amount ? parseFloat(invoiceData.vat_amount) : undefined,
        amount_paid: invoiceData.amount_paid ? parseFloat(invoiceData.amount_paid) : 0,
        client_email: invoiceData.client_email,
        payment_history: invoiceData.payment_history,
        send_reminders: invoiceData.send_reminders,
      };
      
      await Invoice.create(dataToSubmit);
      navigate(createPageUrl("CRM"));
    } catch (error) {
      console.error("Error creating invoice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

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
              Add Invoice
            </h1>
            <p className="text-gray-600 text-lg mt-2">Create a new invoice or upload existing PDF</p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-6 h-6 text-emerald-600" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {/* PDF Upload */}
              <div className="mb-8 p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                    {isProcessingPDF ? (
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {isProcessingPDF ? "Processing PDF..." : "Upload Invoice PDF"}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {isProcessingPDF 
                        ? "Extracting data from your PDF document..." 
                        : "Upload a PDF invoice to automatically extract information"
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
                    Invoice Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="client_name" className="text-sm font-medium text-gray-700">
                        Client *
                      </Label>
                      <Select value={invoiceData.client_name} onValueChange={handleClientChange}>
                        <SelectTrigger className="rounded-xl border-gray-200 focus:border-emerald-400">
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
                      <Label htmlFor="client_email" className="text-sm font-medium text-gray-700">
                        Client Email
                      </Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={invoiceData.client_email}
                        onChange={(e) => updateField("client_email", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-emerald-400"
                        placeholder="client@example.com"
                        readOnly // Suggest making this read-only if linked to client selection
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="invoice_number" className="text-sm font-medium text-gray-700">
                        Invoice Number
                      </Label>
                      <Input
                        id="invoice_number"
                        value={invoiceData.invoice_number}
                        onChange={(e) => updateField("invoice_number", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-emerald-400"
                        placeholder="INV-2024-001"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
                    Financial Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tax_free_amount" className="text-sm font-medium text-gray-700">
                        Tax-Free Amount (HT)
                      </Label>
                      <Input
                        id="tax_free_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoiceData.tax_free_amount}
                        onChange={(e) => updateField("tax_free_amount", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-emerald-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vat_amount" className="text-sm font-medium text-gray-700">
                        VAT Amount
                      </Label>
                      <Input
                        id="vat_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoiceData.vat_amount}
                        onChange={(e) => updateField("vat_amount", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-emerald-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                        Total Amount (TTC) *
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoiceData.amount}
                        onChange={(e) => updateField("amount", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-emerald-400 font-bold"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount_paid" className="text-sm font-medium text-gray-700">
                        Amount Paid
                      </Label>
                      <Input
                        id="amount_paid"
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoiceData.amount_paid}
                        onChange={(e) => updateField("amount_paid", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Dates & Status */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
                    Dates & Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="issue_date" className="text-sm font-medium text-gray-700">
                        Issue Date
                      </Label>
                      <Input
                        id="issue_date"
                        type="date"
                        value={invoiceData.issue_date}
                        onChange={(e) => updateField("issue_date", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="due_date" className="text-sm font-medium text-gray-700">
                        Due Date
                      </Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={invoiceData.due_date}
                        onChange={(e) => updateField("due_date", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select value={invoiceData.status} onValueChange={(value) => updateField("status", value)}>
                        <SelectTrigger className="rounded-xl border-gray-200 focus:border-emerald-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Checkbox for Send Reminders */}
                    <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="send_reminders"
                            checked={invoiceData.send_reminders}
                            onChange={(e) => updateField("send_reminders", e.target.checked)}
                            className="form-checkbox h-4 w-4 text-emerald-600 transition duration-150 ease-in-out rounded-md"
                          />
                          <Label htmlFor="send_reminders" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Send Payment Reminders
                          </Label>
                        </div>
                        <p className="text-xs text-gray-500">Automatically send reminders to the client if the invoice is overdue.</p>
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
                    value={invoiceData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-emerald-400 min-h-24"
                    placeholder="Services provided, products sold..."
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={invoiceData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-emerald-400 min-h-20"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Payment History (display only, updated via PDF extraction) */}
                {invoiceData.payment_history && invoiceData.payment_history.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
                      Payment History (Extracted)
                    </h3>
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      {invoiceData.payment_history.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0 border-gray-100">
                          <p className="text-sm text-gray-700">Date: {payment.date}</p>
                          <p className="text-sm text-gray-700">Amount: ${payment.amount ? payment.amount.toFixed(2) : '0.00'}</p>
                          <p className="text-sm text-gray-700">Method: {payment.method || 'N/A'}</p>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 mt-2">This section is for displaying payment history extracted from the PDF.</p>
                    </div>
                  </div>
                )}


                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
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
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Create Invoice
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
