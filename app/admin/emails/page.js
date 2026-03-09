'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Settings, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Calendar,
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  RefreshCw,
  TestTube,
  History
} from 'lucide-react';

export default function EmailAutomationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState([]);
  const [testEmail, setTestEmail] = useState('');
  const [testType, setTestType] = useState('confirmation');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/email/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/email/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        fetchSettings();
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }
    
    setTesting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, type: testType }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Test email sent successfully!' });
      } else if (data.demo) {
        setMessage({ type: 'warning', text: 'Email system not configured. Configure SMTP settings to send emails.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send test email' });
      }
      fetchLogs();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setTesting(false);
    }
  };

  const processScheduledEmails = async () => {
    setProcessing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/email/process-scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      setMessage({ 
        type: 'success', 
        text: `Processed: ${data.reminders} reminders, ${data.followups} follow-ups sent` 
      });
      fetchLogs();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Mail className="h-6 w-6" />
            <h1 className="text-xl font-bold">Email Automation</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-gray-400 hover:text-white">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 min-h-screen p-4 border-r border-gray-800">
          <nav className="space-y-2">
            <Link href="/admin" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white">
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link href="/admin/jobs" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white">
              <Briefcase className="h-5 w-5" />
              <span>Jobs</span>
            </Link>
            <Link href="/admin/calendar" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white">
              <Calendar className="h-5 w-5" />
              <span>Calendar</span>
            </Link>
            <Link href="/admin/customers" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white">
              <Users className="h-5 w-5" />
              <span>Customers</span>
            </Link>
            <Link href="/admin/emails" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gray-800 text-white">
              <Mail className="h-5 w-5" />
              <span>Emails</span>
            </Link>
            <Link href="/admin/settings" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Status Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' ? 'bg-green-900/50 border border-green-700 text-green-300' :
              message.type === 'warning' ? 'bg-yellow-900/50 border border-yellow-700 text-yellow-300' :
              'bg-red-900/50 border border-red-700 text-red-300'
            }`}>
              {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> :
               message.type === 'warning' ? <AlertCircle className="h-5 w-5 mr-3" /> :
               <XCircle className="h-5 w-5 mr-3" />}
              {message.text}
            </div>
          )}

          {/* SMTP Status */}
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    settings?.isConfigured ? 'bg-green-900/50' : 'bg-yellow-900/50'
                  }`}>
                    <Mail className={`h-6 w-6 ${settings?.isConfigured ? 'text-green-400' : 'text-yellow-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Email System Status</h3>
                    <p className="text-gray-400">
                      {settings?.isConfigured 
                        ? 'SMTP is configured and ready to send emails'
                        : 'SMTP not configured. Add credentials to .env file to enable email sending.'}
                    </p>
                  </div>
                </div>
                <Badge className={settings?.isConfigured ? 'bg-green-600' : 'bg-yellow-600'}>
                  {settings?.isConfigured ? 'Active' : 'Not Configured'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="bg-gray-900 border border-gray-800">
              <TabsTrigger value="settings" className="data-[state=active]:bg-gray-800">
                <Settings className="h-4 w-4 mr-2" /> Automation Settings
              </TabsTrigger>
              <TabsTrigger value="test" className="data-[state=active]:bg-gray-800">
                <TestTube className="h-4 w-4 mr-2" /> Test Emails
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-gray-800">
                <History className="h-4 w-4 mr-2" /> Email Logs
              </TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid gap-6">
                {/* Booking Confirmation */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                          Booking Confirmation Email
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Sent immediately after a customer submits a booking
                        </CardDescription>
                      </div>
                      <Switch 
                        checked={settings?.confirmationEnabled ?? true}
                        onCheckedChange={(checked) => setSettings({...settings, confirmationEnabled: checked})}
                      />
                    </div>
                  </CardHeader>
                </Card>

                {/* Day-of Reminder */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-blue-400" />
                          Day-of Reminder Email
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Sent on the morning of the scheduled booking
                        </CardDescription>
                      </div>
                      <Switch 
                        checked={settings?.reminderEnabled ?? true}
                        onCheckedChange={(checked) => setSettings({...settings, reminderEnabled: checked})}
                      />
                    </div>
                  </CardHeader>
                  {settings?.reminderEnabled && (
                    <CardContent className="border-t border-gray-800 pt-4">
                      <div className="flex items-center space-x-4">
                        <Label className="text-gray-400">Send at:</Label>
                        <Select 
                          value={settings?.reminderTime || '07:00'}
                          onValueChange={(value) => setSettings({...settings, reminderTime: value})}
                        >
                          <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="06:00">6:00 AM</SelectItem>
                            <SelectItem value="07:00">7:00 AM</SelectItem>
                            <SelectItem value="08:00">8:00 AM</SelectItem>
                            <SelectItem value="09:00">9:00 AM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Follow-up Email */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center">
                          <Send className="h-5 w-5 mr-2 text-purple-400" />
                          Follow-up / Review Request Email
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Sent after the job is marked as completed
                        </CardDescription>
                      </div>
                      <Switch 
                        checked={settings?.followupEnabled ?? true}
                        onCheckedChange={(checked) => setSettings({...settings, followupEnabled: checked})}
                      />
                    </div>
                  </CardHeader>
                  {settings?.followupEnabled && (
                    <CardContent className="border-t border-gray-800 pt-4">
                      <div className="flex items-center space-x-4">
                        <Label className="text-gray-400">Send after:</Label>
                        <Select 
                          value={String(settings?.followupDelay || 1)}
                          onValueChange={(value) => setSettings({...settings, followupDelay: parseInt(value)})}
                        >
                          <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="0">Same day</SelectItem>
                            <SelectItem value="1">1 day later</SelectItem>
                            <SelectItem value="2">2 days later</SelectItem>
                            <SelectItem value="3">3 days later</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <div className="flex justify-between items-center">
                  <Button 
                    onClick={processScheduledEmails}
                    disabled={processing}
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Process Scheduled Emails Now
                  </Button>
                  
                  <Button 
                    onClick={saveSettings}
                    disabled={saving}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Settings
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Test Tab */}
            <TabsContent value="test">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Send Test Email</CardTitle>
                  <CardDescription className="text-gray-400">
                    Send a test email to verify your SMTP configuration is working
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400 mb-2 block">Email Address</Label>
                      <Input 
                        type="email"
                        placeholder="your@email.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 mb-2 block">Email Type</Label>
                      <Select value={testType} onValueChange={setTestType}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="confirmation">Booking Confirmation</SelectItem>
                          <SelectItem value="reminder">Day-of Reminder</SelectItem>
                          <SelectItem value="followup">Follow-up / Review Request</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={sendTestEmail}
                    disabled={testing || !testEmail}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Test Email
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Email Log</CardTitle>
                    <CardDescription className="text-gray-400">
                      Recent email activity
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={fetchLogs} 
                    variant="outline" 
                    size="sm"
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {logs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No email logs yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {log.status === 'sent' ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : log.status === 'demo' ? (
                              <AlertCircle className="h-5 w-5 text-yellow-400" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-400" />
                            )}
                            <div>
                              <p className="text-white font-medium">{log.to}</p>
                              <p className="text-gray-400 text-sm">
                                {log.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={
                              log.status === 'sent' ? 'bg-green-600' :
                              log.status === 'demo' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }>
                              {log.status}
                            </Badge>
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* SMTP Configuration Help */}
          {!settings?.isConfigured && (
            <Card className="bg-gray-900 border-gray-800 mt-6">
              <CardHeader>
                <CardTitle className="text-white">SMTP Configuration</CardTitle>
                <CardDescription className="text-gray-400">
                  Add these environment variables to your .env file to enable email sending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm text-gray-300">
                  <p className="text-gray-500"># Email SMTP Configuration</p>
                  <p>SMTP_HOST=smtp.yourdomain.com</p>
                  <p>SMTP_PORT=587</p>
                  <p>SMTP_SECURE=false</p>
                  <p>SMTP_USER=your-email@domain.com</p>
                  <p>SMTP_PASS=your-password</p>
                  <p>EMAIL_FROM_NAME=Easy Load & Dump</p>
                  <p>EMAIL_FROM_ADDRESS=bookings@ezloadndump.com</p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
