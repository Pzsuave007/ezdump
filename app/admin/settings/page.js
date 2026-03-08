'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Calendar, Users, Settings, ClipboardList, LogOut, Menu, X, Save, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchPricing();
  }, [router]);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/pricing');
      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pricing)
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const handleChange = (field, value) => {
    setPricing(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
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
        <Link href="/admin/calendar" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Calendar className="h-5 w-5 mr-3" /> Calendar
        </Link>
        <Link href="/admin/customers" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
          <Users className="h-5 w-5 mr-3" /> Customers
        </Link>
        <Link href="/admin/settings" className="flex items-center px-4 py-3 rounded-lg bg-gray-800 text-white">
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center">
          <Settings className="h-6 w-6 text-orange-500" />
          <span className="ml-2 font-bold">Settings</span>
        </div>
        <div className="w-6"></div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage pricing and business settings</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          {/* Pricing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-orange-500" />
                Pricing Settings
              </CardTitle>
              <CardDescription>Set your base prices for services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="baseRentalFee">Base Rental Fee (2 hours)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="baseRentalFee"
                      type="number"
                      value={pricing?.baseRentalFee || 0}
                      onChange={(e) => handleChange('baseRentalFee', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deliveryFee">Delivery & Pickup Fee</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="deliveryFee"
                      type="number"
                      value={pricing?.deliveryFee || 0}
                      onChange={(e) => handleChange('deliveryFee', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dumpFee">Dump/Disposal Fee</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="dumpFee"
                      type="number"
                      value={pricing?.dumpFee || 0}
                      onChange={(e) => handleChange('dumpFee', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="extraHourFee">Extra Hour Fee</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="extraHourFee"
                      type="number"
                      value={pricing?.extraHourFee || 0}
                      onChange={(e) => handleChange('extraHourFee', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="overweightFee">Overweight Fee</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="overweightFee"
                      type="number"
                      value={pricing?.overweightFee || 0}
                      onChange={(e) => handleChange('overweightFee', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="travelFee">Extended Travel Fee</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="travelFee"
                      type="number"
                      value={pricing?.travelFee || 0}
                      onChange={(e) => handleChange('travelFee', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Area */}
          <Card>
            <CardHeader>
              <CardTitle>Service Area</CardTitle>
              <CardDescription>Define your service coverage area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="serviceRadius">Service Radius (miles)</Label>
                  <Input
                    id="serviceRadius"
                    type="number"
                    value={pricing?.serviceRadius || 30}
                    onChange={(e) => handleChange('serviceRadius', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="serviceCityState">Base Location</Label>
                  <Input
                    id="serviceCityState"
                    value={pricing?.serviceCityState || 'Spokane, WA'}
                    onChange={(e) => setPricing(prev => ({ ...prev, serviceCityState: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Calculator Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Price Preview</CardTitle>
              <CardDescription>Based on current settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Base Rental (2 hrs)</span>
                    <span>${pricing?.baseRentalFee || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery & Pickup</span>
                    <span>${pricing?.deliveryFee || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dump Fee</span>
                    <span>${pricing?.dumpFee || 0}</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Standard Total</span>
                    <span className="text-orange-500">
                      ${(pricing?.baseRentalFee || 0) + (pricing?.deliveryFee || 0) + (pricing?.dumpFee || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
