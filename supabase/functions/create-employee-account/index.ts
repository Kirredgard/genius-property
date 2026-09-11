import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function getDefaultKey(name: string, legacyName: string) {
  const jsonValue = Deno.env.get(name)
  if (jsonValue) {
    try {
      const parsed = JSON.parse(jsonValue)
      if (parsed && parsed.default) return parsed.default
    } catch (_) {}
  }
  return Deno.env.get(legacyName) || ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const publishableKey = getDefaultKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY')
    const secretKey = getDefaultKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !publishableKey || !secretKey) {
      console.error('[create-employee-account] Supabase environment keys missing')
      return json({ error: 'Configuration Supabase de la fonction incomplète.' }, 500)
    }

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) return json({ error: 'Session administrateur requise' }, 401)

    // Verify the caller using the user's JWT.
    const callerClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    const { data: callerData, error: callerError } = await callerClient.auth.getUser(token)
    if (callerError || !callerData.user) {
      console.error('[create-employee-account] caller auth failed', callerError?.message)
      return json({ error: 'Session Supabase invalide ou expirée.' }, 401)
    }

    // Privileged client: secret key never leaves this Edge Function.
    const admin = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    const { data: callerProfile, error: profileError } = await admin
      .from('gp_user_profiles')
      .select('id, role, is_active')
      .eq('id', callerData.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[create-employee-account] profile lookup failed', profileError.message)
      return json({ error: profileError.message }, 500)
    }
    if (!callerProfile || callerProfile.is_active === false || callerProfile.role !== 'admin') {
      return json({ error: 'Seul un administrateur actif peut créer un compte employé.' }, 403)
    }

    let body: any
    try { body = await req.json() } catch { return json({ error: 'JSON invalide' }, 400) }

    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const fullName = String(body?.fullName || '').trim()
    const requestedRole = String(body?.role || 'lecture').toLowerCase()
    const role = ['agent', 'comptable', 'lecture'].includes(requestedRole) ? requestedRole : 'lecture'

    if (!email) return json({ error: 'Email obligatoire.' }, 400)
    if (password.length < 6) return json({ error: 'Mot de passe de 6 caractères minimum.' }, 400)

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, source: 'genius_property_employee' },
    })

    if (createError || !created.user) {
      console.error('[create-employee-account] auth create failed', createError?.message)
      const status = Number(createError?.status) || 400
      return json({ error: createError?.message || 'Impossible de créer le compte Auth.' }, status)
    }

    const user = created.user
    const { error: upsertError } = await admin.from('gp_user_profiles').upsert({
      id: user.id,
      email,
      full_name: fullName,
      role,
      is_active: true,
    }, { onConflict: 'id' })

    if (upsertError) {
      try { await admin.auth.admin.deleteUser(user.id) } catch (_) {}
      console.error('[create-employee-account] profile upsert failed', upsertError.message)
      return json({ error: `Compte Auth créé mais profil impossible à enregistrer: ${upsertError.message}` }, 500)
    }

    console.info('[create-employee-account] employee created', { uid: user.id, email, role })
    return json({ ok: true, uid: user.id, email, role })
  } catch (err) {
    console.error('[create-employee-account] unexpected error', err)
    return json({ error: err instanceof Error ? err.message : 'Erreur serveur inattendue.' }, 500)
  }
})
