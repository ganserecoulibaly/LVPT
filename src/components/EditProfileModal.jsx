  // Anonymise plutôt que supprime réellement la ligne : plusieurs tables
  // (s_voyage_commun, voyage_commun_commentaire, feature_vote,
  // s_feature_idee) ont "on delete cascade" vers lvpt(id) — une vraie
  // suppression effacerait aussi tout le contenu créé par la personne,
  // ce qu'on ne veut pas. La ligne reste, ses champs personnels sont
  // vidés, et "Compte supprimé" s'affiche automatiquement partout via
  // la vue public_profiles.
  //
  // Passe par l'Edge Function delete-account (pas une simple requête
  // Supabase directe) car elle doit d'abord résilier l'abonnement Stripe
  // actif s'il y en a un — sinon l'utilisateur continuerait d'être
  // prélevé sur un compte anonymisé qu'il ne peut plus utiliser.
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Supprimer ton compte ? Ton profil sera anonymisé (nom, email, téléphone effacés) et tu seras déconnecté. Si tu as un abonnement actif, il sera résilié immédiatement. Cette action est irréversible.\n\nLes itinéraires et posts que tu as publiés resteront visibles, mais affichés comme provenant d'un « Compte supprimé »."
    )
    if (!confirmed) return

    setDeleting(true)

    const { data, error: fnError } = await supabase.functions.invoke('delete-account')

    if (fnError || !data?.success) {
      setError(fnError?.message || "Impossible de supprimer le compte pour le moment.")
      setDeleting(false)
      return
    }

    await supabase.auth.signOut()
    // Rechargement complet plutôt qu'une navigation React Router : le
    // compte vient de disparaître fonctionnellement, on repart de zéro
    // proprement plutôt que de risquer un état incohérent dans l'app.
    window.location.href = '/'
  }
