
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, DollarSign, AlertCircle, Eye, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO, isPast } from "date-fns";
import { motion } from "framer-motion";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  partially_paid: "bg-yellow-100 text-yellow-800 border-yellow-200", // Added new status color
  paid: "bg-green-100 text-green-800 border-green-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

export default function InvoicesOverview({ invoices, searchTerm, onUpdate }) {
  const filteredInvoices = invoices.filter(invoice =>
    invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInvoiceStatus = (invoice) => {
    // If explicitly set to paid or cancelled, return that.
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return invoice.status;
    }

    // Calculate remaining amount to determine if partially paid
    const remainingAmount = (invoice.amount || 0) - (invoice.amount_paid || 0);

    // If there's an amount_paid and it's less than the total amount, it's partially_paid
    if (invoice.amount_paid > 0 && remainingAmount > 0) {
      return 'partially_paid';
    }

    // Check for overdue status if not already paid/cancelled/partially_paid
    if (invoice.due_date && isPast(parseISO(invoice.due_date))) {
      return 'overdue';
    }
    
    // Otherwise, return the invoice's inherent status (draft, sent, etc.)
    return invoice.status;
  };

  return (
    <div className="space-y-4">
      {filteredInvoices.map((invoice, index) => {
        const status = getInvoiceStatus(invoice);
        const remainingAmount = (invoice.amount || 0) - (invoice.amount_paid || 0);
        
        return (
          <motion.div
            key={invoice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors truncate">
                            {invoice.invoice_number || `INV-${invoice.id?.slice(0, 8)}`}
                          </h3>
                          <Badge className={`${statusColors[status]} text-xs`}>
                            {status}
                          </Badge>
                          {status === 'overdue' && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        
                        <p className="text-gray-600 font-medium text-sm sm:text-base truncate">{invoice.client_name}</p>
                        
                        {invoice.description && (
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{invoice.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500">
                          {invoice.issue_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Issued: {format(parseISO(invoice.issue_date), 'MMM d, yyyy')}
                            </div>
                          )}
                          
                          {invoice.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {format(parseISO(invoice.due_date), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-left sm:text-right space-y-2 pt-2 sm:pt-0">
                        <div className="space-y-1">
                          <div className="text-xl sm:text-2xl font-bold text-emerald-600 flex items-center sm:justify-end gap-1">
                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                            {(invoice.amount || 0).toLocaleString()}
                          </div>
                          {invoice.amount_paid > 0 && (
                            <div className="text-xs sm:text-sm text-gray-500">
                              Paid: ${(invoice.amount_paid || 0).toLocaleString()}
                              {remainingAmount > 0 && (
                                <span className="block text-orange-600 font-medium">
                                  Remaining: ${remainingAmount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Link to={createPageUrl(`InvoiceDetails?id=${invoice.id}`)}>
                            <Button variant="outline" size="sm" className="rounded-xl text-xs sm:text-sm">
                              <Eye className="w-4 h-4 mr-2" /> View
                            </Button>
                          </Link>
                          <Link to={createPageUrl(`EditInvoice?id=${invoice.id}`)}>
                            <Button variant="outline" size="sm" className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm">
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
      
      {filteredInvoices.length === 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? "Try adjusting your search terms"
                : "Create your first invoice to get started"
              }
            </p>
            {!searchTerm && (
              <Link to={createPageUrl("AddInvoice")}>
                <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3 rounded-2xl">
                  <FileText className="w-5 h-5 mr-2" />
                  Create First Invoice
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
