// supabase/functions/weekly-recap/index.ts
// Pending: Weekly recap email function (Deno)
// Deploy with: supabase functions deploy weekly-recap
// Invoke with: supabase functions invoke weekly-recap --project-ref <ref>

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  const body = { status: 'pending', message: 'Weekly recap email generation is not implemented yet.' };
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status: 501,
  });
});
