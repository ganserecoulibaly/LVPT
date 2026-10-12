-- =====================================================================
-- Modération du Comptoir Voyage via n8n
-- Notif ntfy (lvpt-comptoir) avec lien signé -> page n8n -> bouton Supprimer
-- =====================================================================

-- 1. Secret de signature des liens (créé une seule fois dans le Vault)
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'lvpt_moderation_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'lvpt_moderation_secret',
      'Signature HMAC des liens de modération du Comptoir Voyage (n8n)'
    );
  end if;
end $$;

-- 2. Jeton signé pour un post (jamais appelable depuis le client)
create or replace function public.moderation_token(p_id uuid)
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

  return encode(extensions.hmac(p_id::text, v_secret, 'sha256'), 'hex');
end;
$$;

revoke all on function public.moderation_token(uuid) from public, anon, authenticated;

-- 3. Notification ntfy avec lien cliquable et bouton d'action
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

-- 4. Trigger : nouveau post d'un utilisateur (hors admin) -> notif avec lien de modération
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

  v_lien := 'https://n8n.gansere.com/webhook/lvpt-comptoir?id=' || NEW.id_post
            || '&token=' || public.moderation_token(NEW.id_post);

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

-- 5. Lecture d'un post pour la page de modération (jeton obligatoire)
create or replace function public.moderation_get_comptoir_post(p_id uuid, p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_result jsonb;
begin
  if p_token is null or p_token <> public.moderation_token(p_id) then
    return jsonb_build_object('ok', false, 'error', 'lien_invalide');
  end if;

  select jsonb_build_object(
      'ok', true,
      'id_post', p.id_post,
      'titre', p.titre,
      'description', p.description,
      'ville', p.ville,
      'pays', p.pays,
      'categorie', c.nom,
      'created_at', to_char(p.created_at at time zone 'Europe/Paris', 'DD/MM/YYYY "à" HH24:MI'),
      'auteur', nullif(trim(concat_ws(' ', u.prenom, u.nom)), ''),
      'email', u.email,
      'nb_commentaires', (select count(*) from public.voyage_commun_commentaire vc where vc.id_post = p.id_post)
    )
    into v_result
    from public.s_voyage_commun p
    left join public.voyage_commun_categorie c on c.id_categorie = p.id_categorie
    left join public.lvpt u on u.id = p.pid
    where p.id_post = p_id;

  return coalesce(v_result, jsonb_build_object('ok', false, 'error', 'post_introuvable'));
end;
$$;

revoke all on function public.moderation_get_comptoir_post(uuid, text) from public, anon, authenticated;
grant execute on function public.moderation_get_comptoir_post(uuid, text) to service_role;

-- 6. Suppression d'un post (jeton obligatoire ; les commentaires partent en cascade)
create or replace function public.moderation_delete_comptoir_post(p_id uuid, p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_titre text;
begin
  if p_token is null or p_token <> public.moderation_token(p_id) then
    return jsonb_build_object('ok', false, 'error', 'lien_invalide');
  end if;

  delete from public.s_voyage_commun
    where id_post = p_id
    returning titre into v_titre;

  if v_titre is null then
    return jsonb_build_object('ok', false, 'error', 'post_introuvable');
  end if;

  return jsonb_build_object('ok', true, 'titre', v_titre);
end;
$$;

revoke all on function public.moderation_delete_comptoir_post(uuid, text) from public, anon, authenticated;
grant execute on function public.moderation_delete_comptoir_post(uuid, text) to service_role;
