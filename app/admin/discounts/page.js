'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Truck, ArrowLeft, Plus, Trash2, Tag, Percent, DollarSign, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function DiscountCodesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discountCodes, setDiscountCodes] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  
  // New code form
  const [newCode, setNewCode] = useState({
    code: '',
    type: 'percentage', // 'percentage' or 'fixed'
    value: 10,
    description: '',
    maxUses: 0, // 0 = unlimited
    minOrderAmount: 0,
    expiresAt: '',
    isActive: true
  });

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  const fetchDiscountCodes = async () => {
    try {
      const response = await fetch('/api/discount-codes');
      if (response.ok) {
        const data = await response.json();
        setDiscountCodes(data);
      }
    } catch (error) {
      console.error('Error fetching discount codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'EZ';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(prev => ({ ...prev, code }));
  };

  const createDiscountCode = async () => {
    if (!newCode.code || !newCode.value) {
      toast.error('Please enter code and discount value');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCode)
      });

      if (response.ok) {
        toast.success('Discount code created!');
        setNewCode({
          code: '',
          type: 'percentage',
          value: 10,
          description: '',
          maxUses: 0,
          minOrderAmount: 0,
          expiresAt: '',
          isActive: true
        });
        fetchDiscountCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create code');
      }
    } catch (error) {
      toast.error('Failed to create discount code');
    } finally {
      setSaving(false);
    }
  };

  const toggleCodeStatus = async (codeId, currentStatus) => {
    try {
      const response = await fetch(`/api/discount-codes/${codeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        toast.success(`Code ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchDiscountCodes();
      }
    } catch (error) {
      toast.error('Failed to update code');
    }
  };

  const deleteCode = async (codeId) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;

    try {
      const response = await fetch(`/api/discount-codes/${codeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Discount code deleted');
        fetchDiscountCodes();
      }
    } catch (error) {
      toast.error('Failed to delete code');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center">
              <Tag className="h-6 w-6 text-gray-700 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Discount Codes</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Create New Code */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create New Discount Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCode.code}
                    onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., SAVE10"
                    className="uppercase"
                  />
                  <Button variant="outline" onClick={generateCode}>
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <Label>Discount Type</Label>
                <Select value={newCode.type} onValueChange={(v) => setNewCode(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Discount Value</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={newCode.value}
                    onChange={(e) => setNewCode(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    className="pl-8"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {newCode.type === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              </div>

              <div>
                <Label>Description (optional)</Label>
                <Input
                  value={newCode.description}
                  onChange={(e) => setNewCode(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Repeat customer discount"
                />
              </div>

              <div>
                <Label>Max Uses (0 = unlimited)</Label>
                <Input
                  type="number"
                  value={newCode.maxUses}
                  onChange={(e) => setNewCode(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label>Min Order Amount ($)</Label>
                <Input
                  type="number"
                  value={newCode.minOrderAmount}
                  onChange={(e) => setNewCode(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label>Expires On (optional)</Label>
                <Input
                  type="date"
                  value={newCode.expiresAt}
                  onChange={(e) => setNewCode(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={newCode.isActive}
                  onCheckedChange={(checked) => setNewCode(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active immediately</Label>
              </div>
            </div>

            <Button onClick={createDiscountCode} disabled={saving} className="mt-6 bg-green-600 hover:bg-green-700">
              {saving ? 'Creating...' : 'Create Discount Code'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Codes */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Discount Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {discountCodes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No discount codes yet. Create one above!</p>
            ) : (
              <div className="space-y-4">
                {discountCodes.map((code) => (
                  <div key={code.id} className={`p-4 border rounded-lg ${code.isActive ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-bold">{code.code}</span>
                          <Button variant="ghost" size="sm" onClick={() => copyCode(code.code)}>
                            {copiedCode === code.code ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Badge className={code.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                          {code.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {code.type === 'percentage' ? (
                            <><Percent className="h-3 w-3 mr-1" />{code.value}% OFF</>
                          ) : (
                            <><DollarSign className="h-3 w-3 mr-1" />${code.value} OFF</>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={code.isActive}
                          onCheckedChange={() => toggleCodeStatus(code.id, code.isActive)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => deleteCode(code.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {code.description && <span>📝 {code.description}</span>}
                      <span>📊 Used: {code.usedCount || 0}{code.maxUses > 0 ? `/${code.maxUses}` : ''}</span>
                      {code.minOrderAmount > 0 && <span>💰 Min: ${code.minOrderAmount}</span>}
                      {code.expiresAt && <span>📅 Expires: {new Date(code.expiresAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Create Buttons */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Create Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center"
                onClick={() => setNewCode({
                  code: 'REPEAT10',
                  type: 'percentage',
                  value: 10,
                  description: 'Repeat customer discount',
                  maxUses: 0,
                  minOrderAmount: 0,
                  expiresAt: '',
                  isActive: true
                })}
              >
                <Percent className="h-6 w-6 mb-2" />
                <span className="font-semibold">10% Repeat Customer</span>
                <span className="text-xs text-gray-500">REPEAT10</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center"
                onClick={() => setNewCode({
                  code: 'FIRST20',
                  type: 'percentage',
                  value: 20,
                  description: 'First time customer discount',
                  maxUses: 1,
                  minOrderAmount: 100,
                  expiresAt: '',
                  isActive: true
                })}
              >
                <Tag className="h-6 w-6 mb-2" />
                <span className="font-semibold">20% First Timer</span>
                <span className="text-xs text-gray-500">FIRST20</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center"
                onClick={() => setNewCode({
                  code: 'SAVE25',
                  type: 'fixed',
                  value: 25,
                  description: '$25 off any booking',
                  maxUses: 50,
                  minOrderAmount: 150,
                  expiresAt: '',
                  isActive: true
                })}
              >
                <DollarSign className="h-6 w-6 mb-2" />
                <span className="font-semibold">$25 Off</span>
                <span className="text-xs text-gray-500">SAVE25</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
