/*
  SkillHub - JavaScript principal
  Auteur : Dravel IMBOLO - EC01 2025-2026

  Ce fichier gere :
  1. Menu burger mobile
  2. Fetch AJAX - chargement des formations depuis le JSON
  3. Filtrage dynamique des formations
  4. Creation et insertion des cartes de formations dans le DOM
  5. Animations d'apparition au scroll (IntersectionObserver)
  6. Animation des barres de progression
  7. Ombre du header et bouton retour en haut au scroll
  8. Validation du formulaire de contact
*/

/* ============================================================
   SELECTEURS DOM
   ============================================================ */
const entete          = document.getElementById('entete');
const btnBurger       = document.getElementById('btn-burger');
const menuMobile      = document.getElementById('menu-mobile');
const grilleFormations = document.getElementById('grille-formations');
const zoneFiltres     = document.getElementById('zone-filtres');
const btnRetourHaut   = document.getElementById('retour-haut');

/* ============================================================
   1. MENU BURGER MOBILE
   Bascule l'attribut hidden et la classe .ouvert
   Fermeture sur : clic lien, touche Echap, clic exterieur
   ============================================================ */
function ouvrirMenu() {
  menuMobile.removeAttribute('hidden');
  menuMobile.classList.add('ouvert');
  btnBurger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function fermerMenu() {
  menuMobile.classList.remove('ouvert');
  menuMobile.setAttribute('hidden', '');
  btnBurger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function basculerMenu() {
  const estOuvert = btnBurger.getAttribute('aria-expanded') === 'true';
  estOuvert ? fermerMenu() : ouvrirMenu();
}

btnBurger?.addEventListener('click', basculerMenu);

// Ferme le menu quand on clique sur un lien de navigation
menuMobile?.querySelectorAll('a').forEach(lien => {
  lien.addEventListener('click', fermerMenu);
});

// Ferme sur clic en dehors
document.addEventListener('click', (e) => {
  if (
    menuMobile?.classList.contains('ouvert') &&
    !menuMobile.contains(e.target) &&
    !btnBurger.contains(e.target)
  ) {
    fermerMenu();
  }
});

// Ferme sur Echap
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuMobile?.classList.contains('ouvert')) {
    fermerMenu();
    btnBurger?.focus();
  }
});

/* ============================================================
   2. FETCH AJAX - CHARGEMENT DES FORMATIONS

   Principe :
   - On appelle fetch('./data/formations.json')
   - Pendant la requete, un loader est affiche dans la grille
   - Si la reponse est OK, on recoit un objet JSON avec un tableau "formations"
   - On cree les boutons de filtre puis on genere les cartes HTML
   - Si la requete echoue (pas de serveur, fichier absent...) on affiche
     un message d'erreur clair dans la grille
   ============================================================ */
let toutesFormations = [];  // Stocke toutes les formations reçues
let filtreActif = 'tous';   // Niveau de filtre actuellement actif

async function chargerFormations() {
  try {
    // Lance la requete HTTP GET vers le JSON local
    const reponse = await fetch('./data/formations.json');

    // Verifie que le serveur a repondu correctement (statut 200-299)
    if (!reponse.ok) {
      throw new Error(`Erreur serveur : ${reponse.status} ${reponse.statusText}`);
    }

    // Parse le corps de la reponse en objet JavaScript
    const donnees = await reponse.json();

    // Recupere le tableau "formations" (avec valeur par defaut vide)
    toutesFormations = donnees.formations ?? [];

    // Cree les boutons de filtre depuis les niveaux du JSON
    creerFiltres(toutesFormations);

    // Affiche toutes les formations
    afficherFormations(toutesFormations);

  } catch (erreur) {
    // En cas d'echec : affiche un message dans la grille
    console.error('[SkillHub] Chargement formations :', erreur.message);

    grilleFormations.innerHTML = `
      <p class="etat-vide" role="alert">
        Impossible de charger les formations.
        Verifiez que vous utilisez un serveur local (ex : npx serve .).
      </p>
    `;
  }
}

/* ============================================================
   3. FILTRAGE DYNAMIQUE

   Les boutons de filtre sont generes depuis les niveaux uniques
   presents dans le JSON - aucune valeur codee en dur.
   Un clic filtre le tableau toutesFormations et reaffiche les cartes.
   ============================================================ */
function creerFiltres(formations) {
  // Extrait les niveaux uniques et ajoute "tous" en premier
  const niveaux = ['tous', ...new Set(formations.map(f => f.level))];

  niveaux.forEach(niveau => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filtre-btn' + (niveau === 'tous' ? ' actif' : '');
    btn.textContent = niveau === 'tous' ? 'Tous les niveaux' : niveau;
    btn.dataset.niveau = niveau;
    btn.setAttribute('aria-pressed', String(niveau === 'tous'));
    zoneFiltres?.appendChild(btn);
  });

  // Delegation d'evenement sur le conteneur (1 seul listener)
  zoneFiltres?.addEventListener('click', (e) => {
    const btnCible = e.target.closest('.filtre-btn');
    if (!btnCible) return;

    // Met a jour l'etat visuel et aria de tous les boutons
    zoneFiltres.querySelectorAll('.filtre-btn').forEach(b => {
      b.classList.remove('actif');
      b.setAttribute('aria-pressed', 'false');
    });

    btnCible.classList.add('actif');
    btnCible.setAttribute('aria-pressed', 'true');

    // Filtre et reaffiche
    filtreActif = btnCible.dataset.niveau;

    const liste = filtreActif === 'tous'
      ? toutesFormations
      : toutesFormations.filter(f => f.level === filtreActif);

    afficherFormations(liste);
  });
}

/* ============================================================
   4. CREATION ET INSERTION DES CARTES DANS LE DOM

   Pour chaque formation du tableau filtre :
   - On cree un element <article> avec createElement
   - On construit le HTML interne avec innerHTML (donnees echappees)
   - On insere l'article dans #grille-formations
   ============================================================ */
function afficherFormations(liste) {
  // Vide la grille avant de la repeupler
  grilleFormations.innerHTML = '';

  if (liste.length === 0) {
    grilleFormations.innerHTML = '<p class="etat-vide">Aucune formation pour ce niveau.</p>';
    return;
  }

  // Cree et insere chaque carte
  liste.forEach(formation => {
    const carte = creerCarte(formation);
    grilleFormations.appendChild(carte);
  });
}

function creerCarte(formation) {
  const article = document.createElement('article');
  article.className = 'carte-formation';

  // Classe CSS du badge niveau
  const classeNiveau = {
    'Debutant'      : 'niveau-debutant',
    'Intermediaire' : 'niveau-intermediaire',
    'Avance'        : 'niveau-avance'
  }[formation.level] || 'niveau-debutant';

  // Injection securisee : on echappe les donnees du JSON
  article.innerHTML = `
    <div class="carte-meta">
      <span class="badge-categorie">${echapper(formation.category)}</span>
      <span class="badge-niveau ${classeNiveau}">${echapper(formation.level)}</span>
    </div>
    <h3 class="carte-titre">${echapper(formation.title)}</h3>
    <div class="carte-pied">
      <span class="carte-duree">${echapper(formation.duration)}</span>
      <span class="carte-lien" role="link" tabindex="0">
        Voir la formation &rarr;
      </span>
    </div>
  `;

  return article;
}

// Echappe les caracteres HTML pour eviter les injections XSS
function echapper(texte) {
  const div = document.createElement('div');
  div.textContent = String(texte);
  return div.innerHTML;
}

/* ============================================================
   5. ANIMATIONS AU SCROLL - IntersectionObserver

   Observe chaque element avec la classe .apparait
   Quand l'element entre dans le viewport, on ajoute .visible
   (defini en CSS : opacity 1, translateY 0)
   On cesse d'observer apres la premiere intersection.
   ============================================================ */
const observeurApparition = new IntersectionObserver((entrees) => {
  entrees.forEach(entree => {
    if (entree.isIntersecting) {
      entree.target.classList.add('visible');
      observeurApparition.unobserve(entree.target);
    }
  });
}, {
  threshold : 0.1,
  rootMargin : '0px 0px -40px 0px'
});

document.querySelectorAll('.apparait').forEach(el => {
  observeurApparition.observe(el);
});

/* ============================================================
   6. BARRES DE PROGRESSION

   Chaque .barre-fill a un attribut data-val avec la largeur cible.
   Quand le visuel hero est visible, on applique la largeur
   ce qui declenche la transition CSS.
   ============================================================ */
const observeurBarres = new IntersectionObserver((entrees) => {
  entrees.forEach(entree => {
    if (entree.isIntersecting) {
      entree.target.querySelectorAll('.barre-fill').forEach(barre => {
        barre.style.width = (barre.dataset.val || 0) + '%';
      });
      observeurBarres.unobserve(entree.target);
    }
  });
}, { threshold: 0.3 });

const visuelHero = document.querySelector('.hero-visuel');
if (visuelHero) observeurBarres.observe(visuelHero);

/* ============================================================
   7. SCROLL : OMBRE HEADER + BOUTON RETOUR EN HAUT
   ============================================================ */
window.addEventListener('scroll', () => {
  const defileSuffisamment = window.scrollY > 80;
  entete?.classList.toggle('ombre', defileSuffisamment);
  btnRetourHaut?.classList.toggle('visible', defileSuffisamment);
}, { passive: true });

btnRetourHaut?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================================
   8. FORMULAIRE DE CONTACT

   Principe de validation :
   - Chaque champ est valide au blur (perte de focus)
   - La soumission valide tous les champs et bloque si erreur
   - aria-invalid + message d'erreur lie par aria-describedby
   - Le premier champ invalide recoit le focus
   - Soumission simulee avec delai (setTimeout)
   - Etat de chargement sur le bouton pendant la soumission
   ============================================================ */
function initFormulaire() {
  const form         = document.getElementById('form-contact');
  const msgSucces    = document.getElementById('msg-succes');
  const btnEnvoyer   = document.getElementById('btn-envoyer');

  if (!form) return;

  /* -- Regles de validation par champ -------------------------- */
  const reglesValidation = [
    {
      id       : 'f-prenom',
      idErreur : 'err-prenom',
      valider  : valeur => {
        if (!valeur.trim()) return 'Le prenom est obligatoire.';
        if (valeur.trim().length < 2) return 'Minimum 2 caracteres.';
        return null; // null = valide
      }
    },
    {
      id       : 'f-nom',
      idErreur : 'err-nom',
      valider  : valeur => {
        if (!valeur.trim()) return 'Le nom est obligatoire.';
        if (valeur.trim().length < 2) return 'Minimum 2 caracteres.';
        return null;
      }
    },
    {
      id       : 'f-email',
      idErreur : 'err-email',
      valider  : valeur => {
        if (!valeur.trim()) return "L'email est obligatoire.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur)) return 'Format invalide.';
        return null;
      }
    },
    {
      id       : 'f-sujet',
      idErreur : 'err-sujet',
      valider  : valeur => valeur ? null : 'Choisissez un sujet.'
    },
    {
      id       : 'f-message',
      idErreur : 'err-message',
      valider  : valeur => {
        if (!valeur.trim()) return 'Le message est obligatoire.';
        if (valeur.trim().length < 10) return 'Minimum 10 caracteres.';
        return null;
      }
    }
  ];

  /* -- Applique l'etat valide/invalide sur un champ ------------ */
  function appliquerEtat(champ, erreur, idErreur) {
    const spanErreur = document.getElementById(idErreur);
    champ.classList.remove('invalide', 'valide');

    if (erreur) {
      champ.classList.add('invalide');
      champ.setAttribute('aria-invalid', 'true');
      if (spanErreur) spanErreur.textContent = erreur;
    } else {
      champ.classList.add('valide');
      champ.setAttribute('aria-invalid', 'false');
      if (spanErreur) spanErreur.textContent = '';
    }
  }

  /* -- Attache les listeners de validation en temps reel ------- */
  reglesValidation.forEach(({ id, idErreur, valider }) => {
    const champ = form.querySelector(`#${id}`);
    if (!champ) return;

    // Valide au blur (quand l'utilisateur quitte le champ)
    champ.addEventListener('blur', () => {
      appliquerEtat(champ, valider(champ.value), idErreur);
    });

    // Retire l'erreur des qu'elle est corrigee (sans attendre le blur)
    champ.addEventListener('input', () => {
      if (champ.classList.contains('invalide') && !valider(champ.value)) {
        appliquerEtat(champ, null, idErreur);
      }
    });
  });

  /* -- Validation du checkbox RGPD ----------------------------- */
  function validerRgpd() {
    const caseRgpd   = form.querySelector('#f-rgpd');
    const spanErreur = document.getElementById('err-rgpd');
    if (!caseRgpd) return null;

    if (!caseRgpd.checked) {
      if (spanErreur) spanErreur.textContent = 'Vous devez accepter.';
      return 'Consentement requis.';
    }

    if (spanErreur) spanErreur.textContent = '';
    return null;
  }

  /* -- Compteur de caracteres du textarea ---------------------- */
  const zoneMessage = form.querySelector('#f-message');
  const compteur    = document.getElementById('compteur-msg');

  zoneMessage?.addEventListener('input', () => {
    const nb = zoneMessage.value.length;
    if (compteur) {
      compteur.textContent = `${nb} / 500`;
      // Alerte visuelle proche de la limite
      compteur.style.color = nb > 450 ? '#c0392b' : '';
    }
  });

  /* -- Etat de chargement du bouton ---------------------------- */
  function setChargement(actif) {
    if (!btnEnvoyer) return;
    btnEnvoyer.disabled = actif;
    btnEnvoyer.classList.toggle('chargement', actif);
    const texte = btnEnvoyer.querySelector('.texte-btn');
    if (texte) texte.textContent = actif ? 'Envoi en cours...' : 'Envoyer le message';
  }

  /* -- Soumission ---------------------------------------------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Valide tous les champs
    let estValide = true;
    const champsErreurs = [];

    reglesValidation.forEach(({ id, idErreur, valider }) => {
      const champ = form.querySelector(`#${id}`);
      if (!champ) return;
      const erreur = valider(champ.value);
      appliquerEtat(champ, erreur, idErreur);
      if (erreur) {
        estValide = false;
        champsErreurs.push(champ);
      }
    });

    if (validerRgpd()) estValide = false;

    // Si erreurs : focus sur le premier champ invalide
    if (!estValide) {
      champsErreurs[0]?.focus();
      return;
    }

    // Simule l'envoi : etat chargement + delai
    setChargement(true);
    await new Promise(ok => setTimeout(ok, 1500));
    setChargement(false);

    // Affiche le message de succes
    if (msgSucces) {
      msgSucces.hidden = false;
      msgSucces.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Reinitialise le formulaire
    form.reset();
    form.querySelectorAll('.invalide, .valide')
      .forEach(el => el.classList.remove('invalide', 'valide'));

    if (compteur) compteur.textContent = '0 / 500';

    // Cache le message de succes apres 7 secondes
    setTimeout(() => {
      if (msgSucces) msgSucces.hidden = true;
    }, 7000);
  });
}

/* ============================================================
   INITIALISATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  chargerFormations(); // Lance le fetch AJAX
  initFormulaire();    // Active la validation du formulaire
});
