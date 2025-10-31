import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface NotificationRequest {
  role: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { role, title, message, data }: NotificationRequest = await req.json();

    // Get all employees with the specified role
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, push_subscription')
      .eq('role', role)
      .eq('active', true);

    if (employeeError) {
      throw employeeError;
    }

    if (!employees || employees.length === 0) {
      return new Response(JSON.stringify({ message: 'No employees found with role' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Send push notifications to all relevant employees
    const notifications = [];
    for (const employee of employees) {
      if (employee.push_subscription) {
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              subscription: employee.push_subscription,
              title,
              message,
              data,
            },
          });
          notifications.push({ employee_id: employee.id, status: 'sent' });
        } catch (error) {
          console.error(`Failed to send notification to ${employee.id}:`, error);
          notifications.push({ employee_id: employee.id, status: 'failed', error: String(error) });
        }
      }
    }

    return new Response(JSON.stringify({
      message: `Notifications sent to ${notifications.filter(n => n.status === 'sent').length} employees`,
      results: notifications,
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error sending approval notifications:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
