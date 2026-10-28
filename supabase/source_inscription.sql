-- Provenance des inscrits (migration source_inscription, appliquée le 28/10/2026).
-- Valeur envoyée par le site à l'inscription (ex. « tiktok / bio ») ; null pour Google
-- tant que la 1re connexion ne l'a pas complétée (composant AttributionSync).
alter table public.lvpt add column if not exists source_inscription text;

create or replace function public.handle_new_lvpt_user()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  insert into public.lvpt (id, nom, prenom, email, telephone, optin_newsletter, ville_depart_fav, pays_depart_fav, source_inscription)
  values (
    new.id,
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'first_name',
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'newsletter_opt_in')::boolean, false),
    new.raw_user_meta_data->>'ville_depart_fav',
    new.raw_user_meta_data->>'pays_depart_fav',
    nullif(left(new.raw_user_meta_data->>'source_inscription', 120), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;
