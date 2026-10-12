-- =====================================================================
-- Modération du Comptoir Voyage via n8n — file de modération unique
--
-- Parcours :
--   nouveau post d'un utilisateur (hors admin)
--   -> notif ntfy "lvpt-comptoir" avec bouton "Modérer"
--   -> page n8n qui liste TOUS les posts pas encore modérés
--   -> pour chaque post : bouton "Valider" (sort de la file) ou "Supprimer"
--
-- Sécurité : la page n'est accessible qu'avec un jeton secret (dans le lien
-- de la notif). Les fonctions de modération sont fermées aux utilisateurs du
-- site (anon / authenticated) et réservées au service_role utilisé par n8n.
-- =====================================================================

-- 1. Colonne "modéré le" : un post sort de la file dès qu'il est validé
alter table public.s_voyage_commun
  add column if not exists modere_le timestamptz;

-- Les posts déjà publiés avant la mise en place sont considérés comme modérés,
-- pour que la file démarre vide.
update public.s_voyage_commun
  set modere_le = now()
  where modere_le is null;

-- 2. Secret de signature (créé une seule fois dans le Vault)
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'lvpt_moderation_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'lvpt_moderation_secret',
      'Jeton d''accès à la page de modération du Comptoir Voyage (n8n)'
    );
  end if;
end $$;

-- 3. Jeton d'accès à la page de modération (jamais appelable depuis le client)
create or replace function public.moderation_access_token()
returns text
language plpgsql
security definer
set search_path to 'public', 'extensions', 'vault'
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'lvpt_moderation_secret';

  if v_secret is null then
    return null;
  end if;

  return encode(extensions.hmac('lvpt-moderation', v_secret, 'sha256'), 'hex');
end;
$$;

revoke all on function public.moderation_access_token() from public, anon, authenticated;

-- 4. Notification ntfy avec lien cliquable et bouton d'action
--    (l'ancienne fonction ntfy_notify reste inchangée)
create or replace function public.ntfy_notify_link(
  p_topic text,
  p_title text,
  p_message text,
  p_priority integer default 3,
  p_click text default null,
  p_action_label text default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions', 'vault', 'net'
as $$
declare
  v_token text;
  v_body jsonb;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'ntfy_token';
  if v_token is null then
    return;
  end if;

  v_body := jsonb_build_object(
    'topic', p_topic,
    'title', p_title,
    'message', p_message,
    'priority', p_priority
  );

  if p_click is not null then
    v_body := v_body || jsonb_build_object('click', p_click);
    if p_action_label is not null then
      v_body := v_body || jsonb_build_object(
        'actions', jsonb_build_array(
          jsonb_build_object('action', 'view', 'label', p_action_label, 'url', p_click)
        )
      );
    end if;
  end if;

  perform net.http_post(
    url := 'https://ntfy.gansere.com',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_token,
      'Content-Type', 'application/json'
    ),
    body := v_body
  );
exception when others then
  raise warning 'ntfy_notify_link a échoué : %', sqlerrm;
end;
$$;

revoke all on function public.ntfy_notify_link(text, text, text, integer, text, text) from public, anon, authenticated;

-- 5. Trigger existant : même logique, avec en plus le lien vers la file de modération
create or replace function public.notify_new_comptoir_post()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_admin boolean;
  v_prenom text;
  v_nom text;
  v_email text;
  v_auteur text;
  v_lieu text;
  v_lien text;
begin
  select is_admin, prenom, nom, email
    into v_admin, v_prenom, v_nom, v_email
    from public.lvpt
    where id = NEW.pid;

  if coalesce(v_admin, false) then
    return NEW;
  end if;

  v_auteur := nullif(trim(concat_ws(' ', v_prenom, v_nom)), '');
  if v_email is not null then
    v_auteur := coalesce(v_auteur || ' ', '') || '(' || v_email || ')';
  end if;
  v_auteur := coalesce(v_auteur, 'Utilisateur inconnu');

  v_lieu := nullif(concat_ws(' — ', NEW.ville, NEW.pays), '');

  v_lien := 'https://n8n.gansere.com/webhook/lvpt-moderation?token='
            || public.moderation_access_token();

  perform public.ntfy_notify_link(
    'lvpt-comptoir',
    'Nouveau post au Comptoir Voyage',
    format(E'%s\n%s%s', NEW.titre, v_auteur, coalesce(E'\n' || v_lieu, '')),
    3,
    v_lien,
    'Modérer'
  );

  return NEW;
exception when others then
  -- une notification ne doit jamais empêcher la création d'un post
  return NEW;
end;
$$;

-- 6. Liste des posts à modérer (jeton obligatoire)
create or replace function public.moderation_list(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_items jsonb;
begin
  if p_token is null or p_token is distinct from public.moderation_access_token() then
    return jsonb_build_object('ok', false, 'error', 'lien_invalide');
  end if;

  select coalesce(jsonb_agg(x.item order by x.created_at desc), '[]'::jsonb)
    into v_items
    from (
      select p.created_at,
             jsonb_build_object(
               'id_post', p.id_post,
               'titre', p.titre,
               'description', p.description,
               'ville', p.ville,
               'pays', p.pays,
               'categorie', c.nom,
               'couleur', c.couleur,
               'date', to_char(p.created_at at time zone 'Europe/Paris', 'DD/MM/YYYY "à" HH24:MI'),
               'auteur', nullif(trim(concat_ws(' ', u.prenom, u.nom)), ''),
               'email', u.email,
               'nb_commentaires', (select count(*) from public.voyage_commun_commentaire vc
                                    where vc.id_post = p.id_post)
             ) as item
        from public.s_voyage_commun p
        left join public.voyage_commun_categorie c on c.id_categorie = p.id_categorie
        left join public.lvpt u on u.id = p.pid
        where p.modere_le is null
          and coalesce(u.is_admin, false) = false
        order by p.created_at desc
        limit 50
    ) x;

  return jsonb_build_object('ok', true, 'items', v_items);
end;
$$;

revoke all on function public.moderation_list(text) from public, anon, authenticated;
grant execute on function public.moderation_list(text) to service_role;

-- 7. Action sur un post : 'valider' (sort de la file) ou 'supprimer'
--    (les commentaires partent en cascade ; l'entrée du fil d'activité est retirée)
create or replace function public.moderation_action(p_token text, p_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_titre text;
begin
  if p_token is null or p_token is distinct from public.moderation_access_token() then
    return jsonb_build_object('ok', false, 'error', 'lien_invalide');
  end if;

  if p_action = 'valider' then
    update public.s_voyage_commun
      set modere_le = now()
      where id_post = p_id
      returning titre into v_titre;

  elsif p_action = 'supprimer' then
    delete from public.s_voyage_commun
      where id_post = p_id
      returning titre into v_titre;

    if v_titre is not null then
      delete from public.activity_feed
        where type = 'voyage_commun' and id_entite = p_id;
    end if;

  else
    return jsonb_build_object('ok', false, 'error', 'action_inconnue');
  end if;

  if v_titre is null then
    return jsonb_build_object('ok', false, 'error', 'post_introuvable');
  end if;

  return jsonb_build_object('ok', true, 'action', p_action, 'titre', v_titre);
end;
$$;

revoke all on function public.moderation_action(text, uuid, text) from public, anon, authenticated;
grant execute on function public.moderation_action(text, uuid, text) to service_role;
