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
    contenu: 'Tu remplis un formulaire avec ta recherche : il nous est transmis directement et on te propose des offres de vols et d’hébergements.',
    ajout: 'Rechercher un vol ou un hébergement',
    envoi: true,
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
  ['Type', 'Conseil'],
  ['Titre', 'Gourde vide au contrôle sécurité, pleine à l’embarquement'],
  ['Lieu', 'Général (valable dans tous les pays)'],
  ['Description', 'Passe le contrôle avec une gourde vide, puis remplis-la gratuitement à une fontaine côté embarquement…'],
]

export const ADD_STEPS = [
  'Clique sur le bouton « + » à côté du titre de la page.',
  'Choisis ce que tu veux ajouter dans la liste.',
  'Remplis le formulaire : les champs avec une étoile rouge sont obligatoires.',
  'Clique sur « Publier » ou « Enregistrer ».',
]

export const ADD_INTRO = 'Dans toutes les rubriques (sauf Vols & hébergements), tu remplis des champs et ton contenu s’affiche ensuite sur le site :'

export const SEARCH_NOTE = 'Vols & hébergements fonctionne autrement : tu remplis un formulaire de recherche, il nous est transmis directement et on te propose des offres.'

// Outils transversaux, accessibles à tous depuis le menu de gauche
// (pas des rubriques de contenu : rien à publier).
export const TOOLBOX_TOOLS = [
  'Conduite', 'Devises', 'Fuseaux horaires', 'Jours fériés', 'Météo', 'Pourboire', 'Prises & voltage',
  'Santé', 'Tailles', 'Traducteur', 'Unités', 'Urgences', 'Valise', 'Visa',
]

export const OUTILS = [
  {
    nom: 'Miles',
    acces: 'Menu de gauche > Miles > Miles vs Euros',
    contenu: 'Un calculateur qui compare le prix d’un billet en euros et son prix en miles (Flying Blue, Avios d’Iberia, Miles&Smiles de Turkish) pour savoir ce qui est le plus avantageux. Tu peux aussi renseigner tes soldes de miles dans « Mon compte > Modifier le profil » (facultatif).',
  },
  {
    nom: 'Boîte à outils',
    acces: 'Menu de gauche > Boîte à outils',
    contenu: 'Des outils pratiques à portée de main, sans rien publier : ' + TOOLBOX_TOOLS.join(', ') + '.',
  },
]

// Réservé à la page Guide (la pop-up de bienvenue ne les reprend pas).
export const INTERACTIONS = [
  {
    nom: 'Favoris',
    contenu: 'Clique sur le cœur d’une carte pour la mettre de côté. Retrouve tout ce que tu as gardé avec le bouton « Mes favoris », en haut de chaque page.',
  },
  {
    nom: 'Votes et commentaires',
    contenu: 'Ouvre un post du Comptoir Voyage pour voter et laisser un commentaire. Le tri « Tendance » fait remonter les posts les mieux notés.',
  },
]

export const DASHBOARD_BLOCS = [
  {
    nom: 'Prochain voyage',
    contenu: 'Ton prochain départ en un coup d’œil, avec l’état de tes billets et de ton hébergement (réservé ou à réserver).',
  },
  {
    nom: 'Quoi de neuf dans la communauté',
    contenu: 'Les derniers contenus publiés sur le site.',
  },
  {
    nom: 'Vote pour la prochaine fonctionnalité',
    contenu: 'Vote pour les idées qui te plaisent ou propose la tienne avec « + Proposer une idée » : c’est comme ça que le site évolue.',
  },
]

export const COMING_SOON_PAGE = [...COMING_SOON]
