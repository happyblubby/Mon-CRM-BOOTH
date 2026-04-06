
import React, { useState, useEffect } from "react";
import { Client, Invoice, Quote, TeamMember, Contract } from "@/api/entities";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, FileText, DollarSign, TrendingUp, AlertCircle, Eye, FileSignature } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { SendEmail } from "@/api/integrations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { differenceInDays, parseISO, isPast } from "date-fns";

import ClientsOverview from "../components/crm/ClientsOverview";
import InvoicesOverview from "../components/crm/InvoicesOverview";
import QuotesOverview from "../components/crm/QuotesOverview";
import ContractsOverview from "../components/crm/ContractsOverview";
import CRMStats from "../components/crm/CRMStats";

export default function CRM() {
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [remindersToSend, setRemindersToSend] = useState([]);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const { toast } = useToast();

  const location = useLocation();
  const navigate = useNavigate();

  // Simple state management for tabs and filters
  const [selectedTab, setSelectedTab] = useState('clients');
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [quoteFilter, setQuoteFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');

  // Initialize from URL on component mount and on URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    const filterFromUrl = urlParams.get('filter');

    // Reset all filters first to ensure correct state when changing tabs via URL
    setInvoiceFilter('all');
    setQuoteFilter('all');
    setContractFilter('all');

    if (tabFromUrl) {
      setSelectedTab(tabFromUrl);
    }
    if (filterFromUrl) {
      if (tabFromUrl === 'invoices') {
        setInvoiceFilter(filterFromUrl);
      } else if (tabFromUrl === 'quotes') {
        setQuoteFilter(filterFromUrl);
      } else if (tabFromUrl === 'contracts') {
        setContractFilter(filterFromUrl);
      }
    }
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, []); // Only run once on mount

  const loadData = async () => {
    try {
      const [clientsData, invoicesData, quotesData, contractsData] = await Promise.all([
        Client.list("-created_date"),
        Invoice.list("-created_date"),
        Quote.list("-created_date"),
        Contract.list("-created_date"),
      ]);
      
      setClients(clientsData);
      setInvoices(invoicesData);
      setQuotes(quotesData);
      setContracts(contractsData);
      
      checkReminders(invoicesData);
    } catch (error) {
      console.error("Error loading CRM data:", error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load CRM data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkReminders = (invoices) => {
    const today = new Date();
    const reminders = invoices.filter(inv => {
      const isOverdue = inv.due_date && isPast(parseISO(inv.due_date));
      const needsReminder = inv.send_reminders && 
                            ['sent', 'partially_paid', 'overdue'].includes(inv.status) &&
                            isOverdue;
                            
      if (!needsReminder) return false;
      
      const lastSent = inv.last_reminder_sent_date ? parseISO(inv.last_reminder_sent_date) : null;
      return !lastSent || differenceInDays(today, lastSent) >= 7;
    });
    setRemindersToSend(reminders);
  };
  
  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    let successCount = 0;
    
    for (const invoice of remindersToSend) {
      try {
        const remainingAmount = (invoice.amount || 0) - (invoice.amount_paid || 0);
        await SendEmail({
          to: invoice.client_email,
          subject: `Reminder: Payment for Invoice ${invoice.invoice_number}`,
          body: `<p>Hi ${invoice.client_name},</p><p>This is a friendly reminder that payment for invoice <strong>${invoice.invoice_number}</strong> is due. Amount remaining: <strong>$${remainingAmount.toLocaleString()}</strong></p><p>Thank you,</p><p>PhotoEvent Pro</p>`
        });
        
        const today = new Date().toISOString().split('T')[0];
        await Invoice.update(invoice.id, { last_reminder_sent_date: today });
        successCount++;
      } catch (error) {
        console.error(`Failed to send reminder for invoice ${invoice.id}:`, error);
        toast({
          title: "Reminder Sending Failed",
          description: `Failed to send reminder for invoice ${invoice.invoice_number || invoice.id}.`,
          variant: "destructive",
        });
      }
    }
    
    toast({
      title: "Reminders Sent",
      description: `Successfully sent ${successCount} of ${remindersToSend.length} reminders.`,
    });
    
    setIsSendingReminders(false);
    setRemindersToSend([]); // Clear reminders after attempting to send
    loadData(); // Reload data to update last_reminder_sent_date
  };

  // Handle stat clicks to show filtered data
  const handleStatClick = (type, filter = 'all') => {
    const params = { tab: type };
    if (filter !== 'all') {
      params.filter = filter;
    }
    navigate(createPageUrl('CRM', params));
  };

  // Filter invoices based on the current filter
  const getFilteredInvoices = () => {
    if (invoiceFilter === 'paid') {
      return invoices.filter(inv => inv.status === 'paid');
    } else if (invoiceFilter === 'pending') {
      return invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');
    } else if (invoiceFilter === 'overdue') {
      return invoices.filter(inv => {
        if (['paid', 'cancelled'].includes(inv.status)) return false;
        return inv.due_date && isPast(parseISO(inv.due_date));
      });
    }
    return invoices;
  };

  // Filter quotes based on the current filter
  const getFilteredQuotes = () => {
    if (quoteFilter === 'active') {
      return quotes.filter(q => q.status === 'sent');
    }
    return quotes;
  };

  // Filter contracts based on the current filter
  const getFilteredContracts = () => {
    if (contractFilter === 'signed') {
      return contracts.filter(c => c.status === 'signed');
    }
    return contracts;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent mb-1 sm:mb-2">
              CRM Dashboard
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              Manage clients, invoices, and quotes
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link to={createPageUrl("AddClient")} className="w-full sm:w-auto">
              <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 sm:px-6 rounded-xl shadow-lg shadow-purple-500/25 w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </Link>
            <Link to={createPageUrl("AddInvoice")} className="w-full sm:w-auto">
              <Button variant="outline" className="px-4 py-3 sm:px-6 rounded-xl border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Invoice
              </Button>
            </Link>
            <Link to={createPageUrl("AddQuote")} className="w-full sm:w-auto">
              <Button variant="outline" className="px-4 py-3 sm:px-6 rounded-xl border-2 border-blue-300 text-blue-700 hover:bg-blue-50 w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Quote
              </Button>
            </Link>
            <Link to={createPageUrl("AddContract")} className="w-full sm:w-auto">
              <Button variant="outline" className="px-4 py-3 sm:px-6 rounded-xl border-2 border-red-300 text-red-700 hover:bg-red-50 w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Contract
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Reminders Prompt */}
        {remindersToSend.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="font-bold text-yellow-800">Payment Reminders</AlertTitle>
              <AlertDescription className="text-yellow-700 flex items-center justify-between">
                You have {remindersToSend.length} overdue invoice(s) that need a reminder.
                <Button 
                  size="sm" 
                  onClick={handleSendReminders} 
                  disabled={isSendingReminders}
                  className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
                >
                  {isSendingReminders ? 'Sending...' : 'Send Reminders'}
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CRMStats 
            clients={clients} 
            invoices={invoices} 
            quotes={quotes} 
            contracts={contracts}
            onStatClick={handleStatClick} 
          />
        </motion.div>

        {/* Search */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search clients, invoices, quotes, contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Show active filters */}
        {(invoiceFilter !== 'all' || quoteFilter !== 'all' || contractFilter !== 'all') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-600">Active Filters:</span>
                  {invoiceFilter !== 'all' && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Invoices: {invoiceFilter.charAt(0).toUpperCase() + invoiceFilter.slice(1)}
                      <button 
                        onClick={() => handleStatClick('invoices', 'all')}
                        className="ml-2 hover:text-emerald-900"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {quoteFilter !== 'all' && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Quotes: {quoteFilter.charAt(0).toUpperCase() + quoteFilter.slice(1)}
                      <button 
                        onClick={() => handleStatClick('quotes', 'all')}
                        className="ml-2 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {contractFilter !== 'all' && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Contracts: {contractFilter.charAt(0).toUpperCase() + contractFilter.slice(1)}
                      <button 
                        onClick={() => handleStatClick('contracts', 'all')}
                        className="ml-2 hover:text-red-900"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-1 sm:p-2">
              <TabsTrigger value="clients" className="rounded-lg sm:rounded-xl data-[state=active]:bg-purple-500 data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-2.5">
                <Users className="w-4 h-4 mr-1 sm:mr-2" />
                Clients ({clients.length})
              </TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-lg sm:rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-2.5">
                <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                Invoices ({invoices.length})
              </TabsTrigger>
              <TabsTrigger value="quotes" className="rounded-lg sm:rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-2.5">
                <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
                Quotes ({quotes.length})
              </TabsTrigger>
              <TabsTrigger value="contracts" className="rounded-lg sm:rounded-xl data-[state=active]:bg-red-500 data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-2.5">
                <FileSignature className="w-4 h-4 mr-1 sm:mr-2" />
                Contracts ({contracts.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="clients" className="mt-6 sm:mt-8">
              <ClientsOverview 
                clients={clients} 
                searchTerm={searchTerm} 
                onUpdate={loadData}
              />
            </TabsContent>
            
            <TabsContent value="invoices" className="mt-6 sm:mt-8">
              <InvoicesOverview 
                invoices={getFilteredInvoices()} 
                searchTerm={searchTerm} 
                onUpdate={loadData}
              />
            </TabsContent>
            
            <TabsContent value="quotes" className="mt-6 sm:mt-8">
              <QuotesOverview 
                quotes={getFilteredQuotes()} 
                searchTerm={searchTerm} 
                onUpdate={loadData}
              />
            </TabsContent>

            <TabsContent value="contracts" className="mt-6 sm:mt-8">
              <ContractsOverview 
                contracts={getFilteredContracts()} 
                searchTerm={searchTerm} 
                onUpdate={loadData}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
