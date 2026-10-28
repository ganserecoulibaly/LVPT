const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const WEBHOOK_SECRET = Deno.env.get('LVPT_WEBHOOK_SECRET')

const DESTINATAIRE = 'levoyagepourtous@gmail.com'
const EXPEDITEUR = 'LVPT <notifications@levoyagepourtous.com>'

const valeur = (value: string | null | undefined, defaut = 'Non renseigné'): string => {
  if (value && value.trim() !== '') {
    return value
  }
  return defaut
}

// Échappe le texte saisi par les inscrits avant de l'insérer dans le HTML du mail.
const echapper = (texte: string): string =>
  texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Notification push ntfy (serveur auto-hébergé). Best-effort : ne bloque
// jamais le traitement, et ne fait rien si NTFY_URL / NTFY_TOKEN sont absents.
async function notifyAdmin(
  topic: string,
  title: string,
  message: string,
  priority = 3
): Promise<void> {
  const baseUrl = Deno.env.get('NTFY_URL')
  const token = Deno.env.get('NTFY_TOKEN')

  if (!baseUrl || !token) {
    return
  }

  try {
    const res = await fetch(baseUrl.replace(/\/+$/, ''), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ topic, title, message, priority }),
      signal: AbortSignal.timeout(5000)
    })

    if (!res.ok) {
      console.error('ntfy a répondu', res.status, await res.text())
    }
  } catch (err) {
    console.error('Échec envoi ntfy :', err)
  }
}

Deno.serve(async (request: Request) => {
  try {
    // SÉCURITÉ
    const secretRecu = request.headers.get('x-lvpt-webhook-secret')

    if (!WEBHOOK_SECRET) {
      console.error('LVPT_WEBHOOK_SECRET non configuré')
      return new Response(
        JSON.stringify({ success: false, error: 'Secret serveur non configuré' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (secretRecu !== WEBHOOK_SECRET) {
      console.error('Secret webhook invalide')
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // PAYLOAD
    const payload = await request.json()
    const user = payload.record || {}

    const nom = valeur(user.nom)
    const prenom = valeur(user.prenom)
    const email = valeur(user.email)
    const aeroport = valeur(user.ville_depart_fav)
    // Provenance : null pour une inscription Google (renseignée juste après, à la 1re connexion)
    const provenance = valeur(user.source_inscription, 'Inconnue')

    let dateInscription = 'Non renseignée'

    if (user.created_at) {
      dateInscription = new Date(user.created_at).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Europe/Paris'
      })
    }

    // NOTIFICATION NTFY (indépendante de l'email)
    await notifyAdmin(
      'lvpt-business',
      'Nouvelle inscription',
      `${prenom} ${nom}\n${email}\nAéroport : ${aeroport}\nProvenance : ${provenance}\nInscrit le ${dateInscription}`,
      3
    )

    // VÉRIFICATION RESEND
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY non configurée')

      await notifyAdmin(
        'lvpt-urgent',
        'Échec email d\'inscription',
        'RESEND_API_KEY non configurée : le mail de notification d\'inscription n\'est pas parti.',
        4
      )

      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY non configurée' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // EMAIL
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Nouvelle inscription LVPT</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;padding:30px;border-radius:12px;">
    <h2 style="margin-top:0;">🎉 Nouvelle inscription sur Le Voyage Pour Tous</h2>
    <p>Un nouveau membre vient de rejoindre LVPT.</p>
    <div style="margin-top:25px;padding:20px;background:#f7f7f7;border-radius:8px;">
      <p><strong>👤 Nom :</strong> ${echapper(nom)}</p>
      <p><strong>Prénom :</strong> ${echapper(prenom)}</p>
      <p><strong>📧 Email :</strong> ${echapper(email)}</p>
      <p><strong>✈️ Aéroport de départ :</strong> ${echapper(aeroport)}</p>
      <p><strong>📍 Provenance :</strong> ${echapper(provenance)}</p>
      <p><strong>🕐 Inscription :</strong> ${echapper(dateInscription)}</p>
    </div>
    <p style="margin-top:25px;color:#777;font-size:13px;">Notification automatique LVPT.</p>
  </div>
</body>
</html>
`

    // ENVOI RESEND
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: EXPEDITEUR,
        to: [DESTINATAIRE],
        subject: '🎉 Nouvelle inscription sur Le Voyage Pour Tous',
        html
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Erreur Resend:', resendData)

      await notifyAdmin(
        'lvpt-urgent',
        'Échec email d\'inscription',
        `Resend a refusé l'envoi (HTTP ${resendResponse.status}) : ${JSON.stringify(resendData).slice(0, 200)}`,
        4
      )

      return new Response(
        JSON.stringify({ success: false, error: resendData }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Notification envoyée pour :', email)

    return new Response(
      JSON.stringify({ success: true, resend: resendData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erreur nouvelle inscription:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
