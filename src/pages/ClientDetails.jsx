
import React, { useState, useEffect } from "react";
import { Client, Invoice, Quote, Contract } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Users, Mail, Phone, Building, FileText, DollarSign, Calendar, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast"; // New import
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // New import
import InvoicesOverview from '../components/crm/InvoicesOverview'; // New import
import QuotesOverview from '../components/crm/QuotesOverview';     // New import
import ContractsOverview from "../components/crm/ContractsOverview"; // New import

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  prospect: "bg-blue-100 text-blue-800 border-blue-200"
};

const typeColors = {
  individual: "bg-purple-100 text-purple-800 border-purple-200",
  corporate: "bg-emerald-100 text-emerald-800 border-emerald-200"
};

export default function ClientDetails() {
  const navigate = useNavigate();
  const { toast } = useToast(); // Initialize useToast
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [contracts, setContracts] = useState([]); // New state for contracts
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClientData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const clientId = urlParams.get('id');
      if (!clientId) {
        navigate(createPageUrl("CRM"));
        toast({
          title: "Client ID Missing",
          description: "No client ID found in URL. Redirecting to CRM.",
          variant: "destructive",
        });
        return;
      }

      try {
        const clientData = await Client.get(clientId);
        
        // Ensure clientData exists before proceeding with filters based on its name
        if (!clientData) {
          throw new Error("Client not found.");
        }

        const [invoicesData, quotesData, contractsData] = await Promise.all([
          Invoice.filter({ client_name: clientData.name }),
          Quote.filter({ client_name: clientData.name }),
          Contract.filter({ client_id: clientId })
        ]);
        
        setClient(clientData);
        setInvoices(invoicesData);
        setQuotes(quotesData);
        setContracts(contractsData);

      } catch (error) {
        console.error("Error loading client details:", error);
        toast({
          title: "Error loading client data",
          description: "Could not fetch client details or related documents. " + error.message,
          variant: "destructive",
        });
        setClient(null); // Set client to null if not found
      } finally {
        setIsLoading(false);
      }
    };

    loadClientData();
  }, [navigate, toast]); // Added toast to dependency array

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 text-center">
        <h2 className="text-2xl font-bold">Client not found</h2>
        <Button onClick={() => navigate(createPageUrl("CRM"))} className="mt-4">Go to CRM</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
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
              className="rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
                {client.name}
              </h1>
              <p className="text-gray-600 text-lg mt-2">Client Profile</p>
            </div>
          </div>
          <Link to={createPageUrl(`EditClient?id=${client.id}`)}>
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg shadow-purple-500/25">
              <Edit className="w-5 h-5 mr-2" />
              Edit Client
            </Button>
          </Link>
        </motion.div>

        {/* Client Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-8"
          >
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={statusColors[client.status]}>{client.status}</Badge>
                  <Badge className={typeColors[client.client_type]}>{client.client_type}</Badge>
                </div>
                {client.company && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Building className="w-4 h-4" />
                    <span>{client.company}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.notes && (
                  <div className="pt-4 border-t mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{client.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Financials
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">${(client.total_revenue || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{client.total_events || 0}</p>
                  <p className="text-xs text-gray-500">Total Events</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Associated Data */}
              <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
                  <TabsTrigger value="quotes">Quotes ({quotes.length})</TabsTrigger>
                  <TabsTrigger value="contracts">Contracts ({contracts.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="invoices" className="mt-4">
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        Invoices
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InvoicesOverview invoices={invoices} searchTerm="" onUpdate={() => {}} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="quotes" className="mt-4">
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        Quotes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <QuotesOverview quotes={quotes} searchTerm="" onUpdate={() => {}} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="contracts" className="mt-4">
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-orange-600" /> {/* Changed icon/color for contracts */}
                        Contracts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ContractsOverview contracts={contracts} searchTerm="" onUpdate={() => {}} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
