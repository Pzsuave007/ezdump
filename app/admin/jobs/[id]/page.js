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
import { Truck, ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, DollarSign, Save, Loader2, Plus, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chargingBalance, setChargingBalance] = useState(false);
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

  const chargeRemainingBalance = async () => {
    const totalPrice = job.finalPrice || calculateTotal();
    const amountPaid = job.amountPaid || 0;
    const remainingBalance = totalPrice - amountPaid;
    
    if (remainingBalance <= 0) {
      toast.error('No remaining balance to charge');
      return;
    }
    
    if (!confirm(`Are you sure you want to charge $${remainingBalance.toFixed(2)} to the customer's saved card?`)) {
      return;
    }
    
    setChargingBalance(true);
    try {
      const response = await fetch('/api/payments/charge-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: job.id,
          amount: remainingBalance
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully charged $${remainingBalance.toFixed(2)}`);
        // Refresh job data
        fetchJob();
      } else if (data.noSavedCard) {
        toast.error('No saved card on file. Customer needs to pay manually.');
      } else if (data.code === 'card_declined') {
        toast.error('Card was declined. Contact customer for alternative payment.');
      } else {
        toast.error(data.error || 'Failed to charge card');
      }
    } catch (error) {
      console.error('Error charging balance:', error);
      toast.error('Failed to charge balance');
    } finally {
      setChargingBalance(false);
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-black text-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/jobs">
              <Button variant="ghost" size="sm" className="text-white hover:text-gray-300 hover:bg-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Job Details</h1>
              <p className="text-sm text-gray-400">ID: {job.id.slice(0, 8)}...</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-white text-gray-900 hover:bg-gray-100">
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
              <div className="flex items-center gap-2">
                {(job.paymentStatus === 'deposit_paid' || job.paymentStatus === 'paid') && (
                  <Badge className="bg-green-500 text-white text-sm px-3 py-1">
                    ✓ CONFIRMED
                  </Badge>
                )}
                <Badge className={`${statusColors[job.status]} text-sm px-3 py-1`}>
                  {job.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Payment Confirmation Banner */}
            {(job.paymentStatus === 'deposit_paid' || job.paymentStatus === 'paid') && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded-lg text-green-800 text-center">
                <strong>✅ Booking Confirmed</strong> - Deposit of ${job.depositAmount || 50} received via {job.paymentMethod || 'Stripe'}
              </div>
            )}
            {job.paymentStatus === 'unpaid' && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg text-yellow-800 text-center">
                <strong>⏳ Pending Confirmation</strong> - Waiting for deposit payment
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['pending', 'confirmed', 'dropped_off', 'in_progress', 'picked_up', 'dumped', 'completed', 'cancelled'].map((status) => (
                <Button
                  key={status}
                  variant={job.status === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('status', status)}
                  className={job.status === status ? 'bg-gray-900 hover:bg-gray-800' : ''}
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
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
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
                <span className="text-gray-900">${(job.finalPrice || calculateTotal()) - (job.amountPaid || 0)}</span>
              </div>
            </div>
            
            {/* Charge Balance Button */}
            {((job.finalPrice || calculateTotal()) - (job.amountPaid || 0)) > 0 && job.stripePaymentMethodId && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">💳 Saved Card on File</p>
                    <p className="text-sm text-blue-700">Charge the remaining balance to customer's card</p>
                  </div>
                  <Button 
                    onClick={chargeRemainingBalance}
                    disabled={chargingBalance}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {chargingBalance ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Charging...</>
                    ) : (
                      <><CreditCard className="h-4 w-4 mr-2" /> Charge ${((job.finalPrice || calculateTotal()) - (job.amountPaid || 0)).toFixed(2)}</>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* No Saved Card Notice */}
            {((job.finalPrice || calculateTotal()) - (job.amountPaid || 0)) > 0 && !job.stripePaymentMethodId && job.paymentStatus !== 'unpaid' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ No saved card on file. Collect remaining balance manually (cash, Venmo, etc.)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
