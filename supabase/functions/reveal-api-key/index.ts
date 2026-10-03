import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Returns WORDS_ADMIN_API_KEY only to signed-in users holding the admin role.
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const apiKey = Deno.env.get('WORDS_ADMIN_API_KEY')
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!token) return json({ error: 'Not signed in' }, 401)

  const admin = createClient(url, serviceKey)
  const { data: userData, error } = await admin.auth.getUser(token)
  if (error || !userData.user) return json({ error: 'Not signed in' }, 401)

  const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' })
  if (!isAdmin) return json({ error: 'Admins only' }, 403)
  if (!apiKey) return json({ error: 'API key is not configured' }, 500)

  return json({ apiKey })
})
