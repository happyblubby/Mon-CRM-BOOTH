import React, { useState, useEffect } from "react";
import { Contract, Client, Invoice } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, FileSignature, Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function EditContract() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [contractData, setContractData] = useState(null);

  const contractId = new URLSearchParams(window.location.search).get("id");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, invoicesData, contract] = await Promise.all([
          Client.list(),
          Invoice.list(),
          Contract.get(contractId)
        ]);
        setClients(clientsData);
        setInvoices(invoicesData);
        setContractData(contract);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load contract data.");
      }
    };
    if (contractId) {
        loadData();
    }
  }, [contractId]);

  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      updateField("pdf_url", file_url);
      toast.success("Contract PDF uploaded successfully.");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const dataToSubmit = {
        ...contractData,
        amount: contractData.amount ? parseFloat(contractData.amount) : 0,
      };
      
      await Contract.update(contractId, dataToSubmit);
      toast.success("Contract updated successfully!");
      navigate(createPageUrl("ContractDetails", { id: contractId }));
    } catch (error) {
      console.error("Error updating contract:", error);
      toast.error("Failed to update contract.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientChange = (clientId) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      updateField("client_id", selectedClient.id);
      updateField("client_name", selectedClient.name);
    }
  };
  
  const handleInvoiceChange = (invoiceId) => {
    const selectedInvoice = invoices.find(i => i.id === invoiceId);
    if (selectedInvoice) {
      updateField("invoice_id", selectedInvoice.id);
      updateField("invoice_number", selectedInvoice.invoice_number);
    } else {
      updateField("invoice_id", "");
      updateField("invoice_number", "");
    }
  };

  if (!contractData) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("ContractDetails", { id: contractId }))}
            className="rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Edit Contract
            </h1>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileSignature className="w-6 h-6 text-red-600" />
                Contract Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Contract Title *</Label>
                        <Input value={contractData.contract_title} onChange={e => updateField('contract_title', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Client *</Label>
                        <Select value={contractData.client_id} onValueChange={handleClientChange}>
                            <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Associated Invoice (Optional)</Label>
                        <Select value={contractData.invoice_id || ""} onValueChange={handleInvoiceChange}>
                            <SelectTrigger><SelectValue placeholder="Select an invoice" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>None</SelectItem>
                                {invoices.map(i => <SelectItem key={i.id} value={i.id}>{i.invoice_number} - {i.client_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Contract Status</Label>
                        <Select value={contractData.status} onValueChange={val => updateField('status', val)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="signed">Signed</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="terminated">Terminated</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Contract Amount *</Label>
                        <Input type="number" value={contractData.amount} onChange={e => updateField('amount', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Signed Date</Label>
                        <Input type="date" value={contractData.sign_date} onChange={e => updateField('sign_date', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={contractData.start_date} onChange={e => updateField('start_date', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={contractData.end_date} onChange={e => updateField('end_date', e.target.value)} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Upload Contract PDF</Label>
                    <div className="flex items-center gap-4">
                        <Input id="pdf-upload" type="file" accept=".pdf" onChange={handlePDFUpload} className="hidden" disabled={isUploading} />
                        <label htmlFor="pdf-upload" className="w-full">
                            <Button asChild className="w-full" variant="outline" disabled={isUploading}>
                                <span className="flex items-center justify-center gap-2">
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {isUploading ? "Uploading..." : "Choose PDF"}
                                </span>
                            </Button>
                        </label>
                        {contractData.pdf_url && <a href={contractData.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 font-medium whitespace-nowrap">PDF Uploaded</a>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={contractData.notes} onChange={e => updateField('notes', e.target.value)} />
                </div>
                
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                  <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("CRM"))} className="px-8 py-3 rounded-2xl">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-3 rounded-2xl">
                    {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
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