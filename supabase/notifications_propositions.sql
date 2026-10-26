-- =====================================================================
-- Notifications « nouvelles propositions » (hébergements et vols)
-- Validé le 26/10/2026 et appliqué (migration notifications_propositions).
--
-- Ce que ça change :
--  1. Un seul e-mail par série de propositions (fenêtre de 45 minutes).
--  2. Lien mis à jour : levoyagepourtous.com (au lieu de lvpt.gansere.com).
--  3. La clé Resend n'est plus écrite en clair dans les fonctions : elle est
--     lue dans le coffre-fort Supabase (secret « resend_api_key »).
--  4. Hébergement de type « Airbnb » : encadré d'astuce Widilo (carte cadeau,
--     cashback, conditions, lien de parrainage).
--  5. notify_vol_valide utilisait une clé factice (« À COMPLÉTER ») : corrigé.
-- =====================================================================

-- Échappe le texte saisi par les utilisateurs avant de l'insérer dans le HTML.
create or replace function public.html_escape(t text)
returns text language sql immutable as $$
  select replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
$$;

-- Envoi d'un e-mail via Resend. SECURITY DEFINER : la clé est lue dans le
-- coffre-fort avec les droits du propriétaire, pas ceux de l'utilisateur
-- qui ajoute la ligne. Non appelable depuis le site.
create or replace function public.send_resend_email(p_to text, p_subject text, p_html text)
returns void
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_key text;
begin
  if p_to is null then return; end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_key is null then
    raise warning 'send_resend_email : secret resend_api_key introuvable';
    return;
  end if;
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'LVPT <notifications@levoyagepourtous.com>',
      'to', p_to,
      'subject', p_subject,
      'html', p_html
    )
  );
end;
$$;
revoke all on function public.send_resend_email(text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Hébergement ajouté : un seul e-mail par série (45 min)
-- ---------------------------------------------------------------------
create or replace function public.notify_hebergement_ajoute()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_email  text;
  v_prenom text;
  v_astuce text := '';
  v_html   text;
begin
  -- Seule la ligne la plus ancienne d'une série envoie l'e-mail : s'il existe
  -- une ligne plus ancienne du même utilisateur dans les 45 dernières minutes,
  -- on ne fait rien. (L'égalité d'heure dans une même requête est départagée
  -- par l'identifiant, donc exactement une ligne envoie.)
  if exists (
    select 1 from public.s_hebergement h
    where h.pid = new.pid
      and h.id_hebergement <> new.id_hebergement
      and h.created_at > new.created_at - interval '45 minutes'
      and (h.created_at, h.id_hebergement) < (new.created_at, new.id_hebergement)
  ) then
    return new;
  end if;

  select email, prenom into v_email, v_prenom from public.lvpt where id = new.pid;
  if v_email is null then return new; end if;

  -- Astuce affichée uniquement si la proposition qui ouvre la série est un Airbnb
  if coalesce(new.type_hebergement, '') ilike '%airbnb%' then
    v_astuce :=
      '<div style="background:#f6f3ee;border-radius:10px;padding:16px 18px;margin:22px 0;">' ||
      '<p style="margin:0 0 8px;"><strong>💡 Astuce Airbnb : gagne du cashback</strong></p>' ||
      '<p style="margin:0 0 8px;">Achète une carte cadeau Airbnb (50 € ou 100 €) sur Widilo avant de réserver : tu récupères <strong>3,1 % de cashback</strong>, soit <strong>1,55 €</strong> sur une carte de 50 € et <strong>3,10 €</strong> sur une carte de 100 € (taux à vérifier sur Widilo au moment de l''achat).</p>' ||
      '<ul style="margin:0 0 10px;padding-left:20px;">' ||
      '<li>Valable 5 ans, en ligne uniquement, utilisable en une ou plusieurs fois.</li>' ||
      '<li>Ni échangeable ni remboursable, et non valable sur les Expériences.</li>' ||
      '<li>Ajoute-la d''abord à ton compte sur airbnb.fr/cadeau. À ta prochaine réservation, ton compte Airbnb est débité du montant crédité, et ce qui reste sert pour la suivante.</li>' ||
      '</ul>' ||
      '<p style="margin:0;">Pas encore de compte Widilo ? Avec notre lien de parrainage, tu reçois 5 € de cashback : ' ||
      '<a href="https://www.widilo.fr/i/31P154">créer mon compte Widilo</a>.</p>' ||
      '</div>';
  end if;

  v_html :=
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#1b2a41;max-width:560px;">' ||
    '<h2>Du nouveau pour ton séjour à ' || public.html_escape(new.ville) || ', ' || public.html_escape(coalesce(v_prenom, 'toi')) || ' !</h2>' ||
    '<p>On a ajouté de nouvelles propositions d''hébergement pour toi. Tu les retrouves dans ton tableau de bord.</p>' ||
    '<p style="text-align:center;margin:24px 0;"><a href="https://levoyagepourtous.com/vols-hebergements" style="display:inline-block;background:#e8735a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;">Voir mes propositions</a></p>' ||
    v_astuce ||
    '<p>À bientôt sur Le Voyage Pour Tous !</p>' ||
    '</div>';

  perform public.send_resend_email(v_email, 'Tes propositions d''hébergement sont disponibles 🏨', v_html);
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Vol ajouté : même principe (un seul e-mail par série de 45 min)
-- ---------------------------------------------------------------------
create or replace function public.notify_vol_ajoute()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_email  text;
  v_prenom text;
  v_html   text;
begin
  if exists (
    select 1 from public.s_vol v
    where v.pid = new.pid
      and v.id_vol <> new.id_vol
      and v.created_at > new.created_at - interval '45 minutes'
      and (v.created_at, v.id_vol) < (new.created_at, new.id_vol)
  ) then
    return new;
  end if;

  select email, prenom into v_email, v_prenom from public.lvpt where id = new.pid;
  if v_email is null then return new; end if;

  v_html :=
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#1b2a41;max-width:560px;">' ||
    '<h2>Du nouveau pour ton vol ' || public.html_escape(new.aeroport_depart) || ' → ' || public.html_escape(new.aeroport_arrivee) || ', ' || public.html_escape(coalesce(v_prenom, 'toi')) || ' !</h2>' ||
    '<p>On a ajouté de nouvelles propositions de vol pour toi. Tu les retrouves dans ton tableau de bord.</p>' ||
    '<p style="text-align:center;margin:24px 0;"><a href="https://levoyagepourtous.com/vols-hebergements" style="display:inline-block;background:#e8735a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;">Voir mes propositions</a></p>' ||
    '<p>À bientôt sur Le Voyage Pour Tous !</p>' ||
    '</div>';

  perform public.send_resend_email(v_email, 'Tes propositions de vol sont disponibles ✈️', v_html);
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Offre validée (statut → « valide ») : mêmes e-mails qu'avant, mais avec la
-- clé du coffre-fort (notify_vol_valide avait une clé factice).
-- ---------------------------------------------------------------------
create or replace function public.notify_hebergement_valide()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_email  text;
  v_prenom text;
  v_html   text;
begin
  if new.statut = 'valide' and old.statut is distinct from 'valide' then
    select email, prenom into v_email, v_prenom from public.lvpt where id = new.pid;
    if v_email is null then return new; end if;

    v_html :=
      '<div style="font-family:Arial,Helvetica,sans-serif;color:#1b2a41;max-width:560px;">' ||
      '<h2>On a trouvé ton hébergement, ' || public.html_escape(coalesce(v_prenom, 'toi')) || ' !</h2>' ||
      '<p>Ta recherche à ' || public.html_escape(new.ville) || ' a été traitée.</p>' ||
      '<ul><li><strong>Prix / nuit :</strong> ' || coalesce(new.prix_nuit::text, '?') || ' €</li>' ||
      '<li><strong>Prix total :</strong> ' || coalesce(new.prix_totoal::text, '?') || ' €</li></ul>' ||
      '<p><a href="' || public.html_escape(coalesce(new.lien_resa, 'https://levoyagepourtous.com/vols-hebergements')) || '">Voir l''offre</a></p>' ||
      '<p>À bientôt sur Le Voyage Pour Tous !</p>' ||
      '</div>';

    perform public.send_resend_email(v_email, 'On a trouvé ton hébergement 🏨', v_html);
  end if;
  return new;
end;
$$;

create or replace function public.notify_vol_valide()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_email  text;
  v_prenom text;
  v_html   text;
begin
  if new.statut = 'valide' and old.statut is distinct from 'valide' then
    select email, prenom into v_email, v_prenom from public.lvpt where id = new.pid;
    if v_email is null then return new; end if;

    v_html :=
      '<div style="font-family:Arial,Helvetica,sans-serif;color:#1b2a41;max-width:560px;">' ||
      '<h2>On a trouvé ton vol, ' || public.html_escape(coalesce(v_prenom, 'toi')) || ' !</h2>' ||
      '<p>Ta recherche ' || public.html_escape(new.aeroport_depart) || ' → ' || public.html_escape(new.aeroport_arrivee) || ' a été traitée.</p>' ||
      '<ul><li><strong>Compagnie :</strong> ' || public.html_escape(coalesce(new.compagnie, 'Non précisée')) || '</li>' ||
      '<li><strong>Prix :</strong> ' || coalesce(new.prix::text, '?') || ' €</li></ul>' ||
      '<p><a href="' || public.html_escape(coalesce(new.lien_resa, 'https://levoyagepourtous.com/vols-hebergements')) || '">Voir l''offre</a></p>' ||
      '<p>À bientôt sur Le Voyage Pour Tous !</p>' ||
      '</div>';

    perform public.send_resend_email(v_email, 'On a trouvé ton vol ✈️', v_html);
  end if;
  return new;
end;
$$;
