
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Mail, Phone, Building, Eye, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  prospect: "bg-blue-100 text-blue-800 border-blue-200"
};

const typeColors = {
  individual: "bg-purple-100 text-purple-800 border-purple-200",
  corporate: "bg-emerald-100 text-emerald-800 border-emerald-200"
};

export default function ClientsOverview({ clients, searchTerm, onUpdate }) {
  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {filteredClients.map((client, index) => (
        <motion.div
          key={client.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group h-full">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    {client.client_type === 'corporate' ? (
                      <Building className="w-5 h-5 text-white" />
                    ) : (
                      <Users className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                      {client.name}
                    </CardTitle>
                    {client.company && (
                      <p className="text-xs sm:text-sm text-gray-600">{client.company}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <Badge className={`${statusColors[client.status]} text-xs`}>
                  {client.status}
                </Badge>
                <Badge className={`${typeColors[client.client_type]} text-xs`}>
                  {client.client_type}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-0">
              {/* Contact Info */}
              <div className="space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">
                    ${(client.total_revenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                    {client.total_events || 0}
                  </div>
                  <p className="text-xs text-gray-500">Events</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Link to={createPageUrl(`ClientDetails?id=${client.id}`)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-xs sm:text-sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </Link>
                <Link to={createPageUrl(`EditClient?id=${client.id}`)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      
      {filteredClients.length === 0 && (
        <div className="col-span-full">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Add your first client to get started"
                }
              </p>
              {!searchTerm && (
                <Link to={createPageUrl("AddClient")}>
                  <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl">
                    <Users className="w-5 h-5 mr-2" />
                    Add First Client
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
