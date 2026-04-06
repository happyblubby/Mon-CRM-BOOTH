import React, { useState, useEffect } from "react";
import { Invoice, Client } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function EditInvoice() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id');
    if (!invoiceId) {
      navigate(createPageUrl("CRM"));
      return;
    }

    try {
      const [invoiceData, clientsData] = await Promise.all([
        Invoice.get(invoiceId),
        Client.list()
      ]);

      // Convert numbers to strings for form inputs
      const formattedInvoice = { ...invoiceData };
      for (const key of ['amount', 'tax_free_amount', 'vat_amount', 'amount_paid']) {
        if (formattedInvoice[key] != null) {
          formattedInvoice[key] = formattedInvoice[key].toString();
        }
      }

      setInvoice(formattedInvoice);
      setClients(clientsData);
    } catch (error) {
      console.error("Error loading invoice data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClientChange = (clientName) => {
    const selectedClient = clients.find(c => c.name === clientName);
    updateField("client_name", clientName);
    if (selectedClient) {
      updateField("client_email", selectedClient.email || "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice) return;
    setIsSubmitting(true);
    
    try {
      const dataToSubmit = {
        ...invoice,
        amount: invoice.amount ? parseFloat(invoice.amount) : 0,
        tax_free_amount: invoice.tax_free_amount ? parseFloat(invoice.tax_free_amount) : undefined,
        vat_amount: invoice.vat_amount ? parseFloat(invoice.vat_amount) : undefined,
        amount_paid: invoice.amount_paid ? parseFloat(invoice.amount_paid) : 0,
      };
      
      await Invoice.update(invoice.id, dataToSubmit);
      navigate(createPageUrl(`InvoiceDetails?id=${invoice.id}`));
    } catch (error) {
      console.error("Error updating invoice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  
  if (!invoice) {
    return <div className="p-6">Invoice not found.</div>;
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
            onClick={() => navigate(createPageUrl(`InvoiceDetails?id=${invoice.id}`))}
            className="rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Edit Invoice
            </h1>
            <p className="text-gray-600 text-lg mt-2">Update invoice #{invoice.invoice_number}</p>
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
                      <Select value={invoice.client_name} onValueChange={handleClientChange}>
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
                        value={invoice.client_email}
                        onChange={(e) => updateField("client_email", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-emerald-400"
                        placeholder="client@example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="invoice_number" className="text-sm font-medium text-gray-700">
                        Invoice Number
                      </Label>
                      <Input
                        id="invoice_number"
                        value={invoice.invoice_number}
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
                        value={invoice.tax_free_amount || ""}
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
                        value={invoice.vat_amount || ""}
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
                        value={invoice.amount}
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
                        value={invoice.amount_paid}
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
                        value={invoice.issue_date || ""}
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
                        value={invoice.due_date || ""}
                        onChange={(e) => updateField("due_date", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select value={invoice.status} onValueChange={(value) => updateField("status", value)}>
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

                    <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="send_reminders"
                            checked={invoice.send_reminders}
                            onChange={(e) => updateField("send_reminders", e.target.checked)}
                            className="form-checkbox h-4 w-4 text-emerald-600 transition duration-150 ease-in-out rounded-md"
                          />
                          <Label htmlFor="send_reminders" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Send Payment Reminders
                          </Label>
                        </div>
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
                    value={invoice.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-emerald-400 min-h-24"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={invoice.notes || ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-emerald-400 min-h-20"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => navigate(createPageUrl(`InvoiceDetails?id=${invoice.id}`))}
                    className="px-8 py-3 rounded-2xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3 rounded-2xl shadow-lg shadow-emerald-500/25"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Changes
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