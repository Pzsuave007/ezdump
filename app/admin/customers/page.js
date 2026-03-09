'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Truck, Calendar, Users, Settings, ClipboardList, LogOut, Menu, X, Phone, Mail, MapPin, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchCustomers();
  }, [router]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center">
          <Truck className="h-8 w-8 text-white" />
          <span className="ml-2 font-bold">Admin Panel</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden">
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <nav className="p-4 space-y-2">
        <Link href="/admin" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <ClipboardList className="h-5 w-5 mr-3" /> Dashboard
        </Link>
        <Link href="/admin/jobs" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Truck className="h-5 w-5 mr-3" /> Jobs
        </Link>
        <Link href="/admin/calendar" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Calendar className="h-5 w-5 mr-3" /> Calendar
        </Link>
        <Link href="/admin/customers" className="flex items-center px-4 py-3 rounded-lg bg-gray-800 text-white">
          <Users className="h-5 w-5 mr-3" /> Customers
        </Link>
        <Link href="/admin/settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Settings className="h-5 w-5 mr-3" /> Settings
        </Link>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <LogOut className="h-5 w-5 mr-3" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-black text-white shadow-sm p-4 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center">
          <Users className="h-6 w-6 text-white" />
          <span className="ml-2 font-bold">Customers</span>
        </div>
        <div className="w-6"></div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">{customers.length} total customers</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search customers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full md:w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <Link href={`/admin/customers/${customer.id}`} key={customer.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{customer.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {customer.phone}
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            {customer.email}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{customer.address}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Customers Found</h3>
              <p className="text-gray-500">Customers will appear here after they submit bookings.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
