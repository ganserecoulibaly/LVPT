-- ============================================================
-- LVPT — Email de bienvenue à l'inscription (Google + email/mdp)
-- ============================================================
-- Se déclenche à chaque nouvelle ligne dans lvpt, peu importe la
-- méthode d'inscription (les deux flux passent par le même trigger
-- handle_new_lvpt_user() qui alimente cette table). Utilise le même
-- mécanisme pg_net que le récap quotidien.
--
-- ⚠️ Prérequis : compte Resend + domaine déjà vérifiés (fait), clé API
-- à coller ci-dessous (placeholder à remplacer, ligne ~30).
--
-- ⚠️ Si la confirmation d'email est activée sur ton projet Supabase
-- (Authentication → Settings), Supabase envoie DÉJÀ un email de
-- confirmation pour les inscriptions par mot de passe — celui-ci
-- s'ajoute en plus, pas à la place. Les inscriptions Google n'ont
-- aucun équivalent natif, donc pas de doublon pour elles.
-- ============================================================

create or replace function public.send_welcome_email()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  body_html text;
begin
  if new.email is null then
    return new;
  end if;

  body_html := format(
    '<h2>Bienvenue sur Le Voyage Pour Tous !</h2>' ||
    '<p>Salut %s,</p>' ||
    '<p>Ton compte est bien créé. Tu peux dès maintenant explorer les itinéraires de la communauté, ' ||
    'partager tes propres bons plans sur Voyage Commun, et suivre tes vols et hébergements favoris.</p>' ||
    '<p>Bon voyage !<br/>L''équipe Le Voyage Pour Tous</p>',
    coalesce(new.prenom, 'toi')
  );

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer re_Qf445Dqz_Py6LCYJPKQH8BEcWaUQAgow4',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'LVPT <bienvenue@levoyagepourtous.com>',
      'to', new.email,
      'subject', 'Bienvenue sur Le Voyage Pour Tous 🧡',
      'html', body_html
    )
  );

  return new;
end;
$$;

drop trigger if exists on_lvpt_insert_welcome_email on public.lvpt;
create trigger on_lvpt_insert_welcome_email
  after insert on public.lvpt
  for each row execute function public.send_welcome_email();
