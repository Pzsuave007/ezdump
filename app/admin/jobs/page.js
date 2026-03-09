'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Calendar, Users, Settings, ClipboardList, LogOut, Menu, X, Phone, MapPin, Clock, ChevronRight, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function JobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchJobs();
  }, [router, filter]);

  const fetchJobs = async () => {
    try {
      const url = filter === 'all' ? '/api/bookings' : `/api/bookings?status=${filter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    dropped_off: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    picked_up: 'bg-indigo-100 text-indigo-800',
    dumped: 'bg-teal-100 text-teal-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const loadTypeLabels = {
    household: 'Household Junk',
    furniture: 'Furniture',
    yard_waste: 'Yard Waste',
    construction: 'Construction Debris',
    mixed: 'Mixed Load'
  };

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
        <Link href="/admin/jobs" className="flex items-center px-4 py-3 rounded-lg bg-gray-800 text-white">
          <Truck className="h-5 w-5 mr-3" /> Jobs
        </Link>
        <Link href="/admin/calendar" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Calendar className="h-5 w-5 mr-3" /> Calendar
        </Link>
        <Link href="/admin/customers" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
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
          <Truck className="h-6 w-6 text-white" />
          <span className="ml-2 font-bold">Jobs</span>
        </div>
        <div className="w-6"></div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Jobs</h1>
            <p className="text-gray-600">Manage all bookings and jobs</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="dropped_off">Dropped Off</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link href={`/admin/jobs/${job.id}`} key={job.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{job.customerName}</h3>
                          <Badge className={statusColors[job.status]}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(job.preferredDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {job.preferredTime} ({job.rentalDuration}hr)
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {job.phone}
                          </div>
                        </div>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{job.address}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{loadTypeLabels[job.loadType] || job.loadType}</p>
                          <p className="text-lg font-bold text-gray-900">${job.finalPrice || job.estimatedPrice}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Found</h3>
              <p className="text-gray-500">There are no jobs matching your filter criteria.</p>
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
