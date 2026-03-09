'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Calendar, Users, Settings, ClipboardList, DollarSign, Clock, CheckCircle, AlertCircle, LogOut, Menu, X, ChevronRight, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully');
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
        <Link href="/admin" className="flex items-center px-4 py-3 rounded-lg bg-gray-800 text-white">
          <ClipboardList className="h-5 w-5 mr-3" /> Dashboard
        </Link>
        <Link href="/admin/jobs" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Truck className="h-5 w-5 mr-3" /> Jobs
        </Link>
        <Link href="/admin/calendar" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Calendar className="h-5 w-5 mr-3" /> Calendar
        </Link>
        <Link href="/admin/customers" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Users className="h-5 w-5 mr-3" /> Customers
        </Link>
        <Link href="/admin/emails" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Mail className="h-5 w-5 mr-3" /> Emails
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

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
          <span className="ml-2 font-bold">Dashboard</span>
        </div>
        <div className="w-6"></div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Jobs</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.todayJobs || 0}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-gray-900" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl md:text-3xl font-bold text-yellow-600">{stats?.pendingJobs || 0}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.totalJobsThisWeek || 0}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-gray-900" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Week Revenue</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">${stats?.weekRevenue || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Jobs */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Today's Jobs</CardTitle>
              <Link href="/admin/jobs">
                <Button variant="ghost" size="sm">View All <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.todayJobsList?.length > 0 ? (
                <div className="space-y-3">
                  {stats.todayJobsList.map((job) => (
                    <Link href={`/admin/jobs/${job.id}`} key={job.id}>
                      <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{job.customerName}</span>
                          <Badge className={statusColors[job.status]}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{job.preferredTime} • {job.rentalDuration}hr</p>
                        <p className="text-sm text-gray-500 truncate">{job.address}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No jobs scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Upcoming Jobs</CardTitle>
              <Link href="/admin/calendar">
                <Button variant="ghost" size="sm">Calendar <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.upcomingJobs?.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcomingJobs.map((job) => (
                    <Link href={`/admin/jobs/${job.id}`} key={job.id}>
                      <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{job.customerName}</span>
                          <Badge className={statusColors[job.status]}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(job.preferredDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {job.preferredTime}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{job.address}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No upcoming jobs</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/admin/jobs?status=pending">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <AlertCircle className="h-6 w-6 mb-1 text-yellow-600" />
                  <span className="text-xs">Pending Jobs</span>
                </Button>
              </Link>
              <Link href="/admin/calendar">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <Calendar className="h-6 w-6 mb-1 text-gray-900" />
                  <span className="text-xs">View Calendar</span>
                </Button>
              </Link>
              <Link href="/admin/customers">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <Users className="h-6 w-6 mb-1 text-green-600" />
                  <span className="text-xs">Customers</span>
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <Settings className="h-6 w-6 mb-1 text-gray-600" />
                  <span className="text-xs">Settings</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
