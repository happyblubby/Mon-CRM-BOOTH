
import React, { useState, useEffect } from "react";
import { Invoice } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Download, FileText, DollarSign, Calendar, User, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { Send, FilePlus, History, Bell } from "lucide-react";
import { SendEmail } from "@/api/integrations";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { format, parseISO, isPast } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  partially_paid: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

export default function InvoiceDetails() {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInvoice();
  }, []);

  const loadInvoice = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id');
    if (!invoiceId) {
      navigate(createPageUrl("CRM"));
      return;
    }

    try {
      const data = await Invoice.get(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error("Error loading invoice details:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleReminders = async (enabled) => {
    if (!invoice) return; // Ensure invoice is loaded
    try {
      await Invoice.update(invoice.id, { send_reminders: enabled });
      setInvoice(prev => ({ ...prev, send_reminders: enabled }));
      toast({
        title: "Settings Updated",
        description: `Automatic reminders have been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error("Error updating reminders setting:", error);
      toast({
        title: "Error",
        description: "Failed to update reminder settings.",
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = async () => {
    if (!invoice || !invoice.client_email) {
      toast({
        title: "Missing Client Email",
        description: "Cannot send reminder without a client email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const remainingAmount = (invoice.amount || 0) - (invoice.amount_paid || 0);
      await SendEmail({
        to: invoice.client_email,
        subject: `Reminder: Payment for Invoice ${invoice.invoice_number}`,
        body: `
          <p>Hi ${invoice.client_name},</p>
          <p>This is a friendly reminder that invoice <strong>${invoice.invoice_number}</strong> for the amount of <strong>$${(invoice.amount || 0).toLocaleString()}</strong> is due.</p>
          <p>Amount remaining: <strong>$${remainingAmount.toLocaleString()}</strong></p>
          <p>Please let us know if you have any questions.</p>
          <p>Thank you,</p>
          <p>PhotoEvent Pro</p>
        `
      });
      
      const today = new Date().toISOString().split('T')[0];
      await Invoice.update(invoice.id, { last_reminder_sent_date: today });
      setInvoice(prev => ({ ...prev, last_reminder_sent_date: today }));

      toast({
        title: "Reminder Sent",
        description: `An email reminder has been sent to ${invoice.client_email}.`
      });

    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send the reminder email.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 text-center">
        <h2 className="text-2xl font-bold">Invoice not found</h2>
        <Button onClick={() => navigate(createPageUrl("CRM"))} className="mt-4">Go to CRM</Button>
      </div>
    );
  }
  
  const remainingAmount = (invoice.amount || 0) - (invoice.amount_paid || 0);
  const currentStatus = remainingAmount <= 0 && invoice.amount > 0 ? 'paid' : (invoice.due_date && isPast(parseISO(invoice.due_date)) ? 'overdue' : invoice.status);

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
              className="rounded-2xl border-2 hover:border-emerald-300 hover:bg-emerald-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
                Invoice {invoice.invoice_number}
              </h1>
              <p className="text-gray-600 text-lg mt-2">To: {invoice.client_name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {invoice.pdf_url && (
              <a href={invoice.pdf_url} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="px-6 py-3 rounded-2xl border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </Button>
              </a>
            )}
            <Link to={createPageUrl(`EditInvoice?id=${invoice.id}`)}>
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/25">
                <Edit className="w-5 h-5 mr-2" />
                Edit Invoice
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Invoice Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Invoice Details Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium text-gray-900">{invoice.client_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Issue Date</p>
                  <p className="font-medium text-gray-900">{invoice.issue_date ? format(parseISO(invoice.issue_date), 'MMM d, yyyy') : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-900">{invoice.due_date ? format(parseISO(invoice.due_date), 'MMM d, yyyy') : 'N/A'}</p>
                </div>
                {invoice.description && (
                  <div className="md:col-span-2 space-y-1">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium text-gray-900">{invoice.description}</p>
                  </div>
                )}
                {invoice.notes && (
                  <div className="md:col-span-2 space-y-1">
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium text-gray-900">{invoice.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Breakdown Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">Financial Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Tax-Free Amount (HT)</span>
                  <span className="font-medium text-gray-800">${(invoice.tax_free_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>VAT Amount</span>
                  <span className="font-medium text-gray-800">${(invoice.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                  <span>Total (TTC)</span>
                  <span>${(invoice.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span>Amount Paid</span>
                  <span className="font-medium">${(invoice.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between items-center text-lg font-bold text-red-600">
                  <span>Amount Due</span>
                  <span>${remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            {invoice.payment_history?.length > 0 ? (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {invoice.payment_history.map((payment, index) => (
                      <li key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{format(parseISO(payment.date), 'MMM d, yyyy')}</span>
                        <span className="text-gray-600">{payment.notes}</span>
                        <span className="font-bold text-green-600">${(payment.amount || 0).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-center py-4">No payments have been logged yet.</p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 space-y-8"
          >
            {/* Actions Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FilePlus className="w-5 h-5 text-emerald-600" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600">
                      <DollarSign className="w-4 h-4 mr-2" /> Log Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log a New Payment</DialogTitle>
                    </DialogHeader>
                    <LogPaymentForm invoice={invoice} onPaymentLogged={loadInvoice} />
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSendReminder}
                  disabled={isSending || !invoice.client_email}
                >
                  <Send className="w-4 h-4 mr-2" /> 
                  {isSending ? "Sending..." : "Send Reminder"}
                </Button>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mt-2">
                  <Label htmlFor="send_reminders" className="text-sm font-medium text-gray-700">
                    Auto Reminders
                  </Label>
                  <Switch
                    id="send_reminders"
                    checked={invoice.send_reminders}
                    onCheckedChange={handleToggleReminders}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function LogPaymentForm({ invoice, onPaymentLogged }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newPaymentAmount = parseFloat(amount);
    if (isNaN(newPaymentAmount) || newPaymentAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a positive number.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      const currentHistory = invoice.payment_history || [];
      const newHistory = [...currentHistory, { amount: newPaymentAmount, date, notes }];
      const newAmountPaid = newHistory.reduce((sum, p) => sum + p.amount, 0);

      let newStatus = invoice.status;
      if (newAmountPaid >= invoice.amount) {
        newStatus = "paid";
      } else if (newAmountPaid > 0) {
        newStatus = "partially_paid";
      }

      await Invoice.update(invoice.id, {
        payment_history: newHistory,
        amount_paid: newAmountPaid,
        status: newStatus
      });

      toast({ title: "Payment logged successfully!" });
      onPaymentLogged(); // Trigger parent to reload invoice data

    } catch (error) {
      console.error("Error logging payment:", error);
      toast({ title: "Failed to log payment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="payment_amount">Amount</Label>
        <Input 
          id="payment_amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payment_date">Payment Date</Label>
        <Input
          id="payment_date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payment_notes">Notes (Optional)</Label>
        <Input
          id="payment_notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging..." : "Log Payment"}
        </Button>
      </div>
    </form>
  );
}
