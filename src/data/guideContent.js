// Contenu partagé entre la pop-up de bienvenue (GuideModal) et la page
// /guide (GuidePage), pour ne maintenir les textes qu'à un seul endroit.

export const PLAN_NAMES = {
  free: 'Gratuit',
  occasional: 'Voyageur occasionnel',
  frequent: 'Grand Voyageur',
}

// "ajout" reprend exactement le libellé de l'entrée correspondante dans
// le menu "+" (QuickAddMenu.jsx). null = pas d'ajout côté utilisateur.
export const SECTIONS = [
  {
    nom: 'Vols & hébergements',
    plan: 'free',
    contenu: 'Les offres de vols et d’hébergements repérées pour toi, avec les meilleurs prix du moment.',
    ajout: 'Rechercher un vol ou un hébergement',
  },
  {
    nom: 'Le Comptoir Voyage',
    plan: 'free',
    contenu: 'Bons plans, conseils, promos et alertes arnaques partagés par la communauté. Tu peux voter, commenter et publier les tiens.',
    ajout: 'Ajouter un post Le Comptoir Voyage',
  },
  {
    nom: 'Itinéraires de vacances',
    plan: 'free',
    contenu: 'Des itinéraires jour par jour, étape par étape, pour t’inspirer. Tu peux aussi créer et publier le tien.',
    ajout: 'Créer un itinéraire',
  },
  {
    nom: 'Spa & bien-être',
    plan: 'free',
    contenu: 'Une sélection de spas, thermes, hammams et sources chaudes dans le monde entier.',
    ajout: 'Ajouter un spa',
  },
  {
    nom: 'Séjours',
    plan: 'occasional',
    contenu: 'Un catalogue de séjours sélectionnés.',
    ajout: null,
  },
  {
    nom: 'Journal de dépenses',
    plan: 'occasional',
    contenu: 'Ton budget voyage : note tes dépenses au fil du séjour.',
    ajout: 'Ajouter une dépense',
  },
  {
    nom: 'Playlist du voyage',
    plan: 'occasional',
    contenu: 'Les musiques qui t’accompagnent (ou t’ont accompagné) sur la route.',
    ajout: 'Ajouter une musique',
  },
  {
    nom: 'Carnet gastronomique',
    plan: 'occasional',
    contenu: 'Les plats que tu as goûtés et envie de retenir.',
    ajout: 'Ajouter un plat',
  },
  {
    nom: 'Activités & musées',
    plan: 'frequent',
    contenu: 'Des activités à découvrir et les bons plans associés.',
    ajout: 'Ajouter une activité',
  },
]

export const COMING_SOON = ['Carnet d’hébergements', 'Documents de transport']

// Exemple unique, montré dans la pop-up et sur la page : tous les
// formulaires fonctionnent sur le même principe.
export const EXAMPLE_POST = [
  ['Type', 'Vol'],
  ['Titre', 'Vol Paris-Lisbonne à 42 euros'],
  ['Pays / Ville', 'Portugal / Lisbonne'],
  ['Description', 'Trouvé pour des départs en mars, bagage cabine inclus…'],
]

export const ADD_STEPS = [
  'Clique sur le bouton « + » à côté du titre de la page.',
  'Choisis ce que tu veux ajouter dans la liste.',
  'Remplis le formulaire : les champs avec une étoile rouge sont obligatoires.',
  'Clique sur « Publier » ou « Enregistrer ».',
]
