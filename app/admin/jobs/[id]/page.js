'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, DollarSign, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState(null);
  const [extraCharge, setExtraCharge] = useState({ type: '', amount: '', note: '' });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchJob();
  }, [router, params.id]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/bookings/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      } else {
        toast.error('Job not found');
        router.push('/admin/jobs');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/bookings/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      });

      if (response.ok) {
        toast.success('Job updated successfully');
        fetchJob();
      } else {
        toast.error('Failed to update job');
      }
    } catch (error) {
      toast.error('Error saving job');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setJob(prev => ({ ...prev, [field]: value }));
  };

  const addExtraCharge = () => {
    if (!extraCharge.type || !extraCharge.amount) {
      toast.error('Please enter charge type and amount');
      return;
    }
    const newCharges = [...(job.extraCharges || []), { ...extraCharge, amount: parseFloat(extraCharge.amount) }];
    setJob(prev => ({ ...prev, extraCharges: newCharges }));
    setExtraCharge({ type: '', amount: '', note: '' });
  };

  const removeExtraCharge = (index) => {
    const newCharges = job.extraCharges.filter((_, i) => i !== index);
    setJob(prev => ({ ...prev, extraCharges: newCharges }));
  };

  const calculateTotal = () => {
    const base = job.estimatedPrice || 0;
    const extras = (job.extraCharges || []).reduce((sum, c) => sum + c.amount, 0);
    return base + extras;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/jobs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Job Details</h1>
              <p className="text-sm text-gray-500">ID: {job.id.slice(0, 8)}...</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Job Status</span>
              <Badge className={`${statusColors[job.status]} text-sm px-3 py-1`}>
                {job.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['pending', 'confirmed', 'dropped_off', 'in_progress', 'picked_up', 'dumped', 'completed', 'cancelled'].map((status) => (
                <Button
                  key={status}
                  variant={job.status === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('status', status)}
                  className={job.status === status ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={job.customerName} onChange={(e) => handleChange('customerName', e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <div className="flex gap-2">
                  <Input value={job.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                  <a href={`tel:${job.phone}`}>
                    <Button variant="outline" size="icon"><Phone className="h-4 w-4" /></Button>
                  </a>
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="flex gap-2">
                  <Input value={job.email} onChange={(e) => handleChange('email', e.target.value)} />
                  <a href={`mailto:${job.email}`}>
                    <Button variant="outline" size="icon"><Mail className="h-4 w-4" /></Button>
                  </a>
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input value={job.address} onChange={(e) => handleChange('address', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={job.preferredDate} onChange={(e) => handleChange('preferredDate', e.target.value)} />
              </div>
              <div>
                <Label>Time</Label>
                <Select value={job.preferredTime} onValueChange={(v) => handleChange('preferredTime', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (hours)</Label>
                <Select value={String(job.rentalDuration)} onValueChange={(v) => handleChange('rentalDuration', parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Hours</SelectItem>
                    <SelectItem value="3">3 Hours</SelectItem>
                    <SelectItem value="4">4 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Load Type</Label>
                <Select value={job.loadType} onValueChange={(v) => handleChange('loadType', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="household">Household Junk</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="yard_waste">Yard Waste</SelectItem>
                    <SelectItem value="construction">Construction Debris</SelectItem>
                    <SelectItem value="mixed">Mixed Load</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={job.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Internal Notes</Label>
              <Textarea 
                value={job.internalNotes || ''} 
                onChange={(e) => handleChange('internalNotes', e.target.value)} 
                rows={3}
                placeholder="Add internal notes about this job..."
                className="bg-yellow-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Base Price */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span>Estimated Price</span>
              <span className="font-semibold">${job.estimatedPrice}</span>
            </div>

            {/* Extra Charges */}
            <div>
              <Label className="mb-2 block">Extra Charges</Label>
              {(job.extraCharges || []).length > 0 && (
                <div className="space-y-2 mb-4">
                  {job.extraCharges.map((charge, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <span className="font-medium">{charge.type}</span>
                        {charge.note && <span className="text-sm text-gray-500 ml-2">({charge.note})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${charge.amount}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeExtraCharge(idx)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2">
                <Select value={extraCharge.type} onValueChange={(v) => setExtraCharge({ ...extraCharge, type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Extra Time">Extra Time</SelectItem>
                    <SelectItem value="Overweight">Overweight</SelectItem>
                    <SelectItem value="Travel Fee">Travel Fee</SelectItem>
                    <SelectItem value="Extra Labor">Extra Labor</SelectItem>
                    <SelectItem value="Misc">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  type="number" 
                  placeholder="Amount" 
                  value={extraCharge.amount}
                  onChange={(e) => setExtraCharge({ ...extraCharge, amount: e.target.value })}
                />
                <Button onClick={addExtraCharge} variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Final Price */}
            <div>
              <Label>Final Price</Label>
              <Input 
                type="number" 
                value={job.finalPrice || calculateTotal()} 
                onChange={(e) => handleChange('finalPrice', parseFloat(e.target.value) || null)}
                className="text-lg font-bold"
              />
            </div>

            {/* Payment Status */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Payment Status</Label>
                <Select value={job.paymentStatus} onValueChange={(v) => handleChange('paymentStatus', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="deposit_paid">Deposit Paid</SelectItem>
                    <SelectItem value="paid">Paid in Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={job.paymentMethod || ''} onValueChange={(v) => handleChange('paymentMethod', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Deposit Amount</Label>
                <Input 
                  type="number" 
                  value={job.depositAmount || 0} 
                  onChange={(e) => handleChange('depositAmount', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Amount Paid</Label>
                <Input 
                  type="number" 
                  value={job.amountPaid || 0} 
                  onChange={(e) => handleChange('amountPaid', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex justify-between text-lg">
                <span>Total</span>
                <span className="font-bold">${job.finalPrice || calculateTotal()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Amount Paid</span>
                <span>-${job.amountPaid || 0}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-green-200">
                <span>Balance Due</span>
                <span className="text-orange-500">${(job.finalPrice || calculateTotal()) - (job.amountPaid || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
