'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, ArrowLeft, Phone, Mail, MapPin, Calendar, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchCustomer();
  }, [router, params.id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      } else {
        toast.error('Customer not found');
        router.push('/admin/customers');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/customers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address
        })
      });

      if (response.ok) {
        toast.success('Customer updated successfully');
      } else {
        toast.error('Failed to update customer');
      }
    } catch (error) {
      toast.error('Error saving customer');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/customers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{customer.name}</h1>
              <p className="text-sm text-gray-500">Customer Details</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={customer.name} onChange={(e) => handleChange('name', e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <div className="flex gap-2">
                  <Input value={customer.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                  <a href={`tel:${customer.phone}`}>
                    <Button variant="outline" size="icon"><Phone className="h-4 w-4" /></Button>
                  </a>
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="flex gap-2">
                  <Input value={customer.email} onChange={(e) => handleChange('email', e.target.value)} />
                  <a href={`mailto:${customer.email}`}>
                    <Button variant="outline" size="icon"><Mail className="h-4 w-4" /></Button>
                  </a>
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input value={customer.address} onChange={(e) => handleChange('address', e.target.value)} />
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                Customer since: {new Date(customer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Booking History */}
        <Card>
          <CardHeader>
            <CardTitle>Booking History ({customer.bookings?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.bookings?.length > 0 ? (
              <div className="space-y-3">
                {customer.bookings.map((booking) => (
                  <Link href={`/admin/jobs/${booking.id}`} key={booking.id}>
                    <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <Badge className={statusColors[booking.status]}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{booking.preferredTime} • {booking.rentalDuration}hr rental</span>
                        <span className="font-semibold text-orange-500">${booking.finalPrice || booking.estimatedPrice}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No bookings yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
