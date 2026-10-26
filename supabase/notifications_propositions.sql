-- =====================================================================
-- Notifications « nouvelles propositions » (hébergements et vols)
-- Validé le 26/10/2026 et appliqué (migration notifications_propositions).
--
-- Ce que ça change :
--  1. Un seul e-mail par série de propositions, envoyé 45 min après la dernière ligne ajoutée.
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
      'reply_to', 'levoyagepourtous@gmail.com',
      'to', p_to,
      'subject', p_subject,
      'html', p_html
    )
  );
end;
$$;
revoke all on function public.send_resend_email(text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Propositions ajoutées : UN SEUL e-mail par série, envoyé quand plus aucune
-- ligne n'arrive depuis 45 minutes (envoi différé par un job planifié).
--  - On réutilise la colonne existante « notifie » (false à l'insertion).
--  - Les anciens déclencheurs « ajoute » (envoi immédiat) sont supprimés.
--  - L'ancien job quotidien de 18h (send_new_offers_notifications) est désactivé (pas supprimé) :
--    il enverrait un second e-mail générique pour les mêmes lignes.
-- ---------------------------------------------------------------------
drop trigger if exists trg_notify_hebergement_ajoute on public.s_hebergement;
drop trigger if exists trg_notify_vol_ajoute on public.s_vol;
drop function if exists public.notify_hebergement_ajoute();
drop function if exists public.notify_vol_ajoute();

alter table public.s_hebergement alter column notifie set default false;
alter table public.s_vol alter column notifie set default false;

create or replace function public.send_pending_proposals()
returns void
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  r        record;
  v_email  text;
  v_prenom text;
  v_astuce text;
  v_html   text;
  v_btn    text :=
    '<p style="text-align:center;margin:24px 0;"><a href="https://levoyagepourtous.com/vols-hebergements" style="display:inline-block;background:#e8735a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;">Voir mes propositions</a></p>';
  v_comptoir text :=
    '<p>Tu trouveras d''autres astuces dans le <a href="https://levoyagepourtous.com/voyage-commun">Comptoir Voyage</a>, sur le site.</p>';
  v_open   text := '<div style="font-family:Arial,Helvetica,sans-serif;color:#1b2a41;max-width:560px;">';
begin
  -- Hébergements : séries sans nouvelle ligne depuis 45 minutes
  for r in
    select pid,
           max(created_at) as last_at,
           bool_or(coalesce(type_hebergement, '') ilike '%airbnb%') as has_airbnb,
           (array_agg(ville order by created_at, id_hebergement))[1] as ville
    from public.s_hebergement
    where notifie = false
    group by pid
    having max(created_at) < now() - interval '45 minutes'
  loop
    select email, prenom into v_email, v_prenom from public.lvpt where id = r.pid;
    if v_email is not null then
      v_astuce := '';
      if r.has_airbnb then
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

      v_html := v_open ||
        '<h2>Du nouveau pour ton séjour à ' || public.html_escape(r.ville) || ', ' || public.html_escape(coalesce(v_prenom, 'toi')) || ' !</h2>' ||
        '<p>On a ajouté de nouvelles propositions d''hébergement pour toi. Tu les retrouves dans ton tableau de bord.</p>' ||
        v_btn || v_astuce || v_comptoir ||
        '<p>À bientôt sur Le Voyage Pour Tous !</p></div>';

      perform public.send_resend_email(v_email, 'Tes propositions d''hébergement sont disponibles 🏨', v_html);
    end if;
    update public.s_hebergement set notifie = true
      where pid = r.pid and notifie = false and created_at <= r.last_at;
  end loop;

  -- Vols : même principe
  for r in
    select pid,
           max(created_at) as last_at,
           (array_agg(aeroport_depart order by created_at, id_vol))[1] as depart,
           (array_agg(aeroport_arrivee order by created_at, id_vol))[1] as arrivee
    from public.s_vol
    where notifie = false
    group by pid
    having max(created_at) < now() - interval '45 minutes'
  loop
    select email, prenom into v_email, v_prenom from public.lvpt where id = r.pid;
    if v_email is not null then
      v_html := v_open ||
        '<h2>Du nouveau pour ton vol ' || public.html_escape(r.depart) || ' → ' || public.html_escape(r.arrivee) || ', ' || public.html_escape(coalesce(v_prenom, 'toi')) || ' !</h2>' ||
        '<p>On a ajouté de nouvelles propositions de vol pour toi. Tu les retrouves dans ton tableau de bord.</p>' ||
        v_btn || v_comptoir ||
        '<p>À bientôt sur Le Voyage Pour Tous !</p></div>';

      perform public.send_resend_email(v_email, 'Tes propositions de vol sont disponibles ✈️', v_html);
    end if;
    update public.s_vol set notifie = true
      where pid = r.pid and notifie = false and created_at <= r.last_at;
  end loop;
end;
$$;
revoke all on function public.send_pending_proposals() from public, anon, authenticated;

-- Job : toutes les 5 minutes (l'e-mail part donc 45 à 50 min après la dernière ligne)
select cron.alter_job((select jobid from cron.job where jobname = 'send-new-offers-notifications'), active := false);
select cron.schedule('send-pending-proposals', '*/5 * * * *', $cron$select public.send_pending_proposals();$cron$);

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

-- ---------------------------------------------------------------------
-- Job à la demande (migration proposals_job_on_demand) : plus de job permanent.
-- La 1re insertion dans s_vol / s_hebergement crée le job (vérification chaque
-- minute) ; il se supprime tout seul quand plus aucune ligne n'attend d'envoi.
-- ---------------------------------------------------------------------
create or replace function public.send_pending_proposals_tick()
returns void language plpgsql security definer set search_path = public, cron as $$
begin
  perform public.send_pending_proposals();
  if not exists (select 1 from public.s_hebergement where notifie = false)
     and not exists (select 1 from public.s_vol where notifie = false) then
    perform cron.unschedule('send-pending-proposals');
  end if;
end;
$$;
revoke all on function public.send_pending_proposals_tick() from public, anon, authenticated;

create or replace function public.activate_proposals_job()
returns trigger language plpgsql security definer set search_path = public, cron as $$
begin
  perform cron.schedule('send-pending-proposals', '* * * * *', $cron$select public.send_pending_proposals_tick();$cron$);
  return null;
end;
$$;
revoke all on function public.activate_proposals_job() from public, anon, authenticated;

drop trigger if exists trg_activate_proposals_job on public.s_hebergement;
create trigger trg_activate_proposals_job after insert on public.s_hebergement
  for each statement execute function public.activate_proposals_job();
drop trigger if exists trg_activate_proposals_job on public.s_vol;
create trigger trg_activate_proposals_job after insert on public.s_vol
  for each statement execute function public.activate_proposals_job();

select cron.unschedule('send-pending-proposals');

-- ---------------------------------------------------------------------
-- Droits admin pour le formulaire /admin-offres (migration admin_offres_policies) :
-- retrouver un demandeur dans lvpt et ajouter/lire/modifier/supprimer ses offres.
-- ---------------------------------------------------------------------
create or replace function public.est_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.lvpt where id = auth.uid()), false)
$$;
revoke all on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

create policy lvpt_select_admin on public.lvpt for select to authenticated using (public.est_admin());
create policy s_hebergement_admin_all on public.s_hebergement for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
create policy s_vol_admin_all on public.s_vol for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
