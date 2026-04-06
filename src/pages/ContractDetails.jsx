import React, { useState, useEffect, useCallback } from 'react';
import { Contract, Client, Invoice } from '@/api/entities';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, DollarSign, FileText, Edit, FileSignature } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { servePdfInline } from '@/api/functions';

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  signed: "bg-green-100 text-green-800 border-green-200",
  expired: "bg-orange-100 text-orange-800 border-orange-200",
  terminated: "bg-red-100 text-red-800 border-red-200"
};

export default function ContractDetails() {
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [pdfBase64, setPdfBase64] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadContract = useCallback(async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (!id) {
        navigate(createPageUrl('CRM'));
        return;
      }
      const contractData = await Contract.get(id);
      setContract(contractData);

      if (contractData.pdf_url) {
        const { data } = await servePdfInline({ fileUrl: contractData.pdf_url });
        setPdfBase64(data.pdf_base64);
      }
    } catch (error) {
      console.error("Error loading contract:", error);
      toast.error('Failed to load contract details.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!contract) return <div className="p-6">Contract not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
          <div>
            <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("CRM", { tab: 'contracts' }))}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-4xl font-bold mt-4">{contract.contract_title}</h1>
            <Badge className={`mt-2 ${statusColors[contract.status]}`}>{contract.status}</Badge>
          </div>
          <Link to={createPageUrl("EditContract", { id: contract.id })}>
            <Button><Edit className="w-4 h-4 mr-2" /> Edit Contract</Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {contract.pdf_url && (
              <Card>
                <CardHeader><CardTitle>Contract Document</CardTitle></CardHeader>
                <CardContent>
                  {pdfBase64 ? (
                    <iframe src={`data:application/pdf;base64,${pdfBase64}`} width="100%" height="600px" />
                  ) : (
                    <p>Loading PDF...</p>
                  )}
                </CardContent>
              </Card>
            )}
            {contract.notes && (
              <Card>
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent><p className="whitespace-pre-wrap">{contract.notes}</p></CardContent>
              </Card>
            )}
          </div>
          <div className="space-y-8">
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3"><User /><Link to={createPageUrl('ClientDetails', {id: contract.client_id})} className="text-blue-600 hover:underline">{contract.client_name}</Link></div>
                {contract.invoice_id && <div className="flex items-center gap-3"><FileText /><Link to={createPageUrl('InvoiceDetails', {id: contract.invoice_id})} className="text-blue-600 hover:underline">Invoice #{contract.invoice_number}</Link></div>}
                <div className="flex items-center gap-3"><DollarSign />Amount: ${contract.amount.toLocaleString()}</div>
                {contract.sign_date && <div className="flex items-center gap-3"><FileSignature />Signed: {format(parseISO(contract.sign_date), 'PPP')}</div>}
                {contract.start_date && <div className="flex items-center gap-3"><Calendar />Start: {format(parseISO(contract.start_date), 'PPP')}</div>}
                {contract.end_date && <div className="flex items-center gap-3"><Calendar />End: {format(parseISO(contract.end_date), 'PPP')}</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}