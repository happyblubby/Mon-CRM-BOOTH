import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSignature, Calendar, DollarSign, Eye, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  signed: "bg-green-100 text-green-800 border-green-200",
  expired: "bg-orange-100 text-orange-800 border-orange-200",
  terminated: "bg-red-100 text-red-800 border-red-200"
};

export default function ContractsOverview({ contracts, searchTerm }) {
  const filteredContracts = contracts.filter(contract =>
    contract.contract_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {filteredContracts.map((contract, index) => (
        <motion.div
          key={contract.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25 flex-shrink-0">
                  <FileSignature className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-red-700 transition-colors truncate">
                          {contract.contract_title}
                        </h3>
                        <Badge className={`${statusColors[contract.status]} text-xs`}>{contract.status}</Badge>
                      </div>
                      <p className="text-gray-600 font-medium text-sm sm:text-base truncate">{contract.client_name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500">
                        {contract.sign_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Signed: {format(parseISO(contract.sign_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left sm:text-right space-y-2 pt-2 sm:pt-0">
                      <div className="text-xl sm:text-2xl font-bold text-red-600 flex items-center sm:justify-end gap-1">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                        {(contract.amount || 0).toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <Link to={createPageUrl(`ContractDetails?id=${contract.id}`)}>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs sm:text-sm"><Eye className="w-4 h-4 mr-2" /> View</Button>
                        </Link>
                        <Link to={createPageUrl(`EditContract?id=${contract.id}`)}>
                          <Button variant="outline" size="sm" className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 text-xs sm:text-sm"><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      
      {filteredContracts.length === 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <FileSignature className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No contracts found</h3>
            <p className="text-gray-500 mb-6">Create your first contract to get started.</p>
            <Link to={createPageUrl("AddContract")}><Button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-2xl">Create First Contract</Button></Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}