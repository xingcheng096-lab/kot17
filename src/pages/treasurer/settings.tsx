import { useState } from 'react';
import {
  Save, Bell, Globe, DollarSign, Shield,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

export function TreasurerSettingsPage() {
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [fiscalYearStart, setFiscalYearStart] = useState('01');
  const [receiptPrefix, setReceiptPrefix] = useState('R-');
  const [expensePrefix, setExpensePrefix] = useState('E-');

  const handleSave = () => {
    toast.success('Settings saved');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/treasurer/dashboard">Treasurer</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Settings</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Treasurer Settings"
        titleKh="ការកំណត់ហេរញ្ញិក"
        subtitle="Configure financial preferences and system options"
        actions={<Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />Save All</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Currency & Format */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Currency & Format / រូបិយប័ណ្ណ និងទម្រង់
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Currency / រូបិយប័ណ្ណ</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="KHR">KHR - Cambodian Riel</SelectItem>
                  <SelectItem value="THB">THB - Thai Baht</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Receipt Number Prefix / បុព្វបទវិក្កយបត្រ</Label>
              <Input value={receiptPrefix} onChange={(e) => setReceiptPrefix(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Expense Number Prefix / បុព្វបទការចំណាយ</Label>
              <Input value={expensePrefix} onChange={(e) => setExpensePrefix(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fiscal Year Start Month / ខែចាប់ផ្ដើមឆ្នាំសារពើរប្រាក់</Label>
              <Select value={fiscalYearStart} onValueChange={setFiscalYearStart}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['01', '02', '03', '04', '01'].map((m, i) => (
                    <SelectItem key={i} value={m}>Month {m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Language & Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Language & Display / ភាសា និងការបង្ហាញ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Language / ភាសាលំនាំដើម</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="kh">Khmer / ខ្មែរ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Bilingual Labels</p>
                <p className="text-xs text-muted-foreground">Show both Khmer and English</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Compact View</p>
                <p className="text-xs text-muted-foreground">Reduce spacing in tables</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications / ការជូនដំណឹង
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive alerts via email</p>
              </div>
              <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Browser push alerts</p>
              </div>
              <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Budget Alerts</p>
                <p className="text-xs text-muted-foreground">Warn when budget exceeds 80%</p>
              </div>
              <Switch checked={budgetAlerts} onCheckedChange={setBudgetAlerts} />
            </div>
          </CardContent>
        </Card>

        {/* Approval & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Approval & Security / ការអនុម័ត និងសុវត្ថិភាព
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Auto-Approve Small Expenses</p>
                <p className="text-xs text-muted-foreground">Auto-approve expenses under $50</p>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Require Receipt Upload</p>
                <p className="text-xs text-muted-foreground">Mandatory receipt for expenses</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Dual Approval for Large Amounts</p>
                <p className="text-xs text-muted-foreground">Require 2 approvals for &gt;$500</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
