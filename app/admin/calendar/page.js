'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Calendar, Users, Settings, ClipboardList, LogOut, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function CalendarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchBookings();
  }, [router, currentDate]);

  const fetchBookings = async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const response = await fetch(`/api/calendar?month=${month}&year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getBookingsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter(b => b.preferredDate === dateStr);
  };

  const statusColors = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    dropped_off: 'bg-purple-500',
    in_progress: 'bg-orange-500',
    picked_up: 'bg-indigo-500',
    dumped: 'bg-teal-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500'
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isToday = (day) => {
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center">
          <Truck className="h-8 w-8 text-orange-500" />
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
        <Link href="/admin/calendar" className="flex items-center px-4 py-3 rounded-lg bg-gray-800 text-white">
          <Calendar className="h-5 w-5 mr-3" /> Calendar
        </Link>
        <Link href="/admin/customers" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Users className="h-5 w-5 mr-3" /> Customers
        </Link>
        <Link href="/admin/settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Settings className="h-5 w-5 mr-3" /> Settings
        </Link>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
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
      <div className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-orange-500" />
          <span className="ml-2 font-bold">Calendar</span>
        </div>
        <div className="w-6"></div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 p-4 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl md:text-2xl">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-500 text-xs md:text-sm py-2">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before first day of month */}
              {Array.from({ length: firstDay }).map((_, idx) => (
                <div key={`empty-${idx}`} className="min-h-[60px] md:min-h-[100px] bg-gray-50 rounded"></div>
              ))}
              
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dayBookings = getBookingsForDay(day);
                
                return (
                  <div 
                    key={day} 
                    className={`min-h-[60px] md:min-h-[100px] p-1 md:p-2 rounded border ${isToday(day) ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}
                  >
                    <div className={`text-xs md:text-sm font-medium ${isToday(day) ? 'text-orange-500' : 'text-gray-700'}`}>
                      {day}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <Link href={`/admin/jobs/${booking.id}`} key={booking.id}>
                          <div className={`text-xs p-1 rounded ${statusColors[booking.status]} text-white truncate cursor-pointer hover:opacity-80`}>
                            <span className="hidden md:inline">{booking.preferredTime} - </span>{booking.customerName.split(' ')[0]}
                          </div>
                        </Link>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-500">+{dayBookings.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-3">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${color}`}></div>
                  <span className="text-xs text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                </div>
              ))}
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
