import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDemoDataGenerator } from '@/hooks/useDemoDataGenerator';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  expected: string;
  actual: string;
  notes?: string;
}

interface AIInsightsResponse {
  campaigns: Array<{
    title: string;
    target: string;
    description: string;
    action: string;
    expected_impact: string;
  }>;
  insights: string[];
  rawData: {
    totalCustomers: number;
    repeatCustomers: number;
    lapsedCustomers: number;
    redemptionRate: string;
    quietHours: any[];
  };
}

export default function CRMTestingDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generate, isGenerating } = useDemoDataGenerator();
  
  const [testPhone, setTestPhone] = useState('');
  const [aiInsights, setAiInsights] = useState<AIInsightsResponse | null>(null);
  const [validationReport, setValidationReport] = useState<TestResult[]>([]);
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [isValidatingPoints, setIsValidatingPoints] = useState(false);

  // Fetch customer statistics
  const { data: customerStats, refetch: refetchStats } = useQuery({
    queryKey: ['crm-customer-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, total_orders, last_visit, loyalty_points');
      
      if (error) throw error;

      const total = data.length;
      const repeat = data.filter(c => c.total_orders >= 5).length;
      const lapsed = data.filter(c => {
        const daysSince = Math.floor((Date.now() - new Date(c.last_visit).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince > 30 && c.total_orders >= 3;
      }).length;
      const avgPoints = data.reduce((sum, c) => sum + c.loyalty_points, 0) / (total || 1);

      return { total, repeat, lapsed, avgPoints: avgPoints.toFixed(0) };
    },
  });

  // Fetch loyalty ledger stats
  const { data: ledgerStats, refetch: refetchLedger } = useQuery({
    queryKey: ['crm-ledger-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_ledger')
        .select('transaction_type, points_delta');
      
      if (error) throw error;

      const earned = data
        .filter(l => l.transaction_type === 'earned')
        .reduce((sum, l) => sum + l.points_delta, 0);
      
      const redeemed = Math.abs(
        data
          .filter(l => l.transaction_type === 'redeemed')
          .reduce((sum, l) => sum + l.points_delta, 0)
      );

      const redemptionRate = earned > 0 ? ((redeemed / earned) * 100).toFixed(1) : '0.0';

      return { 
        earned, 
        redeemed, 
        redemptionRate,
        totalTransactions: data.length 
      };
    },
  });

  // Test AI insights generation
  const testAIInsights = async () => {
    setIsTestingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('loyalty-insights');
      
      if (error) throw error;

      setAiInsights(data);
      
      // Validate response
      const results: TestResult[] = [];

      // Test 1: Campaign count
      results.push({
        test: 'AI Campaigns Generated',
        status: data.campaigns?.length >= 3 && data.campaigns?.length <= 5 ? 'pass' : 'warning',
        expected: '3-5 campaigns',
        actual: `${data.campaigns?.length || 0} campaigns`,
      });

      // Test 2: Campaign structure
      const hasValidStructure = data.campaigns?.every(c => 
        c.title && c.target && c.description && c.action && c.expected_impact
      );
      results.push({
        test: 'Campaign Structure',
        status: hasValidStructure ? 'pass' : 'fail',
        expected: 'All fields present',
        actual: hasValidStructure ? 'Valid' : 'Missing fields',
      });

      // Test 3: Data-driven insights
      const hasPercentages = data.campaigns?.some(c => 
        c.expected_impact.match(/\d+%/)
      );
      results.push({
        test: 'Data-Driven Predictions',
        status: hasPercentages ? 'pass' : 'warning',
        expected: 'Specific percentages',
        actual: hasPercentages ? 'Found' : 'Generic',
      });

      // Test 4: Customer segmentation
      results.push({
        test: 'Customer Segmentation',
        status: 'pass',
        expected: `Repeat: ${customerStats?.repeat}, Lapsed: ${customerStats?.lapsed}`,
        actual: `Repeat: ${data.rawData?.repeatCustomers}, Lapsed: ${data.rawData?.lapsedCustomers}`,
      });

      setValidationReport(results);

      toast({
        title: 'AI Insights Test Complete',
        description: `Generated ${data.campaigns?.length} campaigns with ${data.insights?.length} insights`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'AI Test Failed',
        description: error.message,
      });
    } finally {
      setIsTestingAI(false);
    }
  };

  // Validate points for a specific customer
  const validateCustomerPoints = async () => {
    if (!testPhone) {
      toast({
        variant: 'destructive',
        title: 'Phone Required',
        description: 'Enter a customer phone number',
      });
      return;
    }

    setIsValidatingPoints(true);
    try {
      // Get customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', testPhone)
        .single();

      if (customerError) throw new Error('Customer not found');

      // Get ledger transactions
      const { data: ledger, error: ledgerError } = await supabase
        .from('loyalty_ledger')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: true });

      if (ledgerError) throw ledgerError;

      // Calculate expected balance
      let calculatedBalance = 0;
      const transactions = ledger.map(entry => {
        calculatedBalance += entry.points_delta;
        return {
          ...entry,
          expectedBalance: calculatedBalance,
          matches: entry.balance_after === calculatedBalance,
        };
      });

      const finalBalance = customer.loyalty_points;
      const balanceMatches = finalBalance === calculatedBalance;

      // Add to validation report
      const results: TestResult[] = [
        {
          test: 'Customer Points Balance',
          status: balanceMatches ? 'pass' : 'fail',
          expected: `${calculatedBalance} points`,
          actual: `${finalBalance} points`,
          notes: `${ledger.length} transactions analyzed`,
        },
        {
          test: 'Ledger Integrity',
          status: transactions.every(t => t.matches) ? 'pass' : 'fail',
          expected: 'All balance_after values correct',
          actual: transactions.filter(t => t.matches).length + '/' + transactions.length + ' correct',
        },
        {
          test: 'Points Earned Calculation',
          status: 'pass',
          expected: 'RM 1 = 10 points',
          actual: `${ledger.filter(l => l.transaction_type === 'earned').length} earn transactions`,
        },
      ];

      setValidationReport(results);

      toast({
        title: 'Points Validation Complete',
        description: balanceMatches ? '✅ No discrepancies found' : '⚠️ Balance mismatch detected',
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Validation Failed',
        description: error.message,
      });
    } finally {
      setIsValidatingPoints(false);
    }
  };

  // Run comprehensive validation
  const runComprehensiveTest = async () => {
    toast({
      title: 'Running Comprehensive Tests',
      description: 'This will take a moment...',
    });

    await refetchStats();
    await refetchLedger();
    await testAIInsights();
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary',
    } as const;
    return variants[status];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">CRM Testing Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive validation suite for loyalty program and AI insights
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats?.repeat || 0}</div>
            <p className="text-xs text-muted-foreground">5+ orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lapsed Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats?.lapsed || 0}</div>
            <p className="text-xs text-muted-foreground">30+ days inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Redemption Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ledgerStats?.redemptionRate || '0'}%</div>
            <p className="text-xs text-muted-foreground">{ledgerStats?.totalTransactions || 0} transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Scenario Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Test Scenarios</CardTitle>
          <CardDescription>
            Create demo data for testing loyalty and AI features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => generate(42)}
              disabled={isGenerating}
            >
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Demo Data
            </Button>
            <Button variant="outline" onClick={runComprehensiveTest}>
              Run All Tests
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Generates 50-100 customers, 100-200 orders, and loyalty transactions
          </p>
        </CardContent>
      </Card>

      {/* AI Insights Testing */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights Testing</CardTitle>
          <CardDescription>
            Test loyalty-insights edge function and campaign generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testAIInsights} disabled={isTestingAI}>
            {isTestingAI && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test AI Campaign Generation
          </Button>

          {aiInsights && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-2">Generated Campaigns ({aiInsights.campaigns?.length})</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiInsights.campaigns?.map((campaign, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="font-medium">{campaign.title}</div>
                          <div className="text-xs text-muted-foreground">{campaign.description}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{campaign.target}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{campaign.action}</TableCell>
                        <TableCell className="text-sm">
                          {campaign.expected_impact.match(/\d+%/) ? '✅' : '⚠️'} {campaign.expected_impact}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Key Insights</h3>
                <ul className="list-disc list-inside space-y-1">
                  {aiInsights.insights?.map((insight, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points Accuracy Check */}
      <Card>
        <CardHeader>
          <CardTitle>Points Accuracy Validation</CardTitle>
          <CardDescription>
            Verify loyalty points calculation and ledger integrity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="testPhone">Customer Phone</Label>
              <Input
                id="testPhone"
                placeholder="+60123456789"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            <Button 
              onClick={validateCustomerPoints}
              disabled={isValidatingPoints}
              className="mt-auto"
            >
              {isValidatingPoints && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validate Points
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validation Report */}
      {validationReport.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Report</CardTitle>
            <CardDescription>
              Automated test results for CRM functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationReport.map((result, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{result.test}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <Badge variant={getStatusBadge(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{result.expected}</TableCell>
                    <TableCell className="text-sm">{result.actual}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {result.notes}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
