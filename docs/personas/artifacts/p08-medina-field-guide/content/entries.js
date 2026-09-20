/**
 * Le contenu du guide. Dans la vraie vie il sort de la base de données de la
 * fondation; ici c'est un fichier, mais la forme est la même.
 *
 * `built: null` veut dire « on ne sait pas ». Ce n'est PAS une date vide et ça ne
 * doit jamais s'afficher comme une valeur. Voir `--` dans le gabarit.
 */

export const ENTRIES = [
  {
    slug: "bab-er-rouah",
    title: "Bab er-Rouah — باب الرواح",
    type: "Porte",
    built: "1197",
    quarter: "Rabat",
    body:
      "Élevée sous le règne de Yacoub el-Mansour, la porte s'ouvre sur un passage " +
      "coudé dont la fonction défensive a survécu à sa fonction cérémonielle; les " +
      "motifs de la façade sont parmi les plus fins de l'architecture almohade.",
    hours: "Mardi à dimanche, 10h00–18h00",
  },
  {
    slug: "chellah",
    title: "Chellah / شالة — nécropole mérinide et ruines romaines de Sala Colonia",
    type: "Site",
    built: "14th c.",
    quarter: "Rabat",
    body:
      "Deux villes superposées: la Sala Colonia romaine, puis la nécropole que les " +
      "Mérinides y ont installée. Les cigognes nichent sur le minaret depuis si " +
      "longtemps qu'elles figurent dans les guides du siècle dernier.",
    hours: "Tous les jours, 9h00–17h30",
  },
  {
    slug: "kasbah-des-oudayas",
    title: "Kasbah des Oudayas — قصبة الوداية",
    type: "Quartier",
    built: "12th c.",
    quarter: "Rabat",
    body:
      "Le quartier tient sur une falaise au-dessus de l'embouchure du Bouregreg. " +
      "Les murs bleus et blancs datent de l'installation andalouse; la porte " +
      "almohade, elle, est bien antérieure.",
    hours: "Accès libre",
  },
  {
    slug: "zaouia-sidi-mohammed-ben-abdellah",
    title: "Zaouïa de Sidi Mohammed ben Abdellah — زاوية سيدي محمد بن عبد الله",
    type: "Religieux",
    built: "1785",
    quarter: "Salé",
    body:
      "Fondation du sultan alaouite dont elle porte le nom. L'intérieur ne se " +
      "visite pas; la façade et la porte se lisent depuis la rue.",
    hours: null,
  },
  {
    slug: "souk-es-sebat",
    title: "Souk es-Sebat — سوق الصبّاط, dinanderie et travail du cuivre",
    type: "Rue d'artisans",
    built: null,
    quarter: "Salé",
    body:
      "Une rue couverte où le cuivre se martèle encore à la main. Le bruit est le " +
      "meilleur repère: on l'entend deux ruelles avant de la voir.",
    hours: "Samedi à jeudi, du matin jusqu'à la prière du soir",
  },
  {
    slug: "tour-hassan",
    title: "Tour Hassan — صومعة حسان",
    type: "Monument",
    built: "1195",
    quarter: "Rabat",
    body:
      "Le minaret d'une mosquée que la mort de Yacoub el-Mansour a laissée " +
      "inachevée. Il devait monter à 86 mètres; il s'arrête à 44, et les colonnes " +
      "de la salle de prière n'ont jamais reçu de toit.",
    hours: "Tous les jours, 8h00–18h00",
  },
  {
    slug: "bab-el-mrissa",
    title: "Bab el-Mrissa — باب المريسة",
    type: "Porte",
    built: "1270",
    quarter: "Salé",
    body:
      "Assez haute pour laisser passer un navire: elle ouvrait sur un canal qui " +
      "menait les bateaux jusqu'à l'arsenal, à l'intérieur des murs.",
    hours: "Accès libre",
  },
  {
    slug: "medersa-de-sale",
    title: "Medersa mérinide de Salé — المدرسة المرينية",
    type: "Religieux",
    built: "1341",
    quarter: "Salé",
    body:
      "Cour de zellige, plafonds de cèdre sculpté, et les cellules d'étudiants à " +
      "l'étage. Depuis la terrasse on voit la Grande Mosquée et, au-delà, Rabat.",
    hours: "Mardi à dimanche, 9h00–17h00",
  },
  {
    slug: "grande-mosquee-de-sale",
    title: "Grande Mosquée de Salé — المسجد الأعظم",
    type: "Religieux",
    built: "1196",
    quarter: "Salé",
    body:
      "Almohade, et l'une des plus grandes du Maroc. La medersa voisine lui a été " +
      "ajoutée cent cinquante ans plus tard.",
    hours: null,
  },
  {
    slug: "musee-mohammed-vi",
    title: "Musée Mohammed VI d'art moderne et contemporain",
    type: "Musée",
    built: "2014",
    quarter: "Rabat",
    body:
      "Le premier musée marocain construit pour l'art moderne. Les expositions " +
      "temporaires occupent tout le rez-de-chaussée.",
    hours: "Mercredi à lundi, 10h00–18h00",
    exhibition: { title: "Lumières du Bouregreg", until: "31 December 2026, 23:59" },
  },
  {
    slug: "rue-des-consuls",
    title: "Rue des Consuls — زنقة القناصل",
    type: "Rue d'artisans",
    built: "17th c.",
    quarter: "Rabat",
    body:
      "Les consuls étrangers y étaient logés, et obligés d'y rester. Aujourd'hui " +
      "c'est la rue des tapis: les lundis et jeudis matin, la vente aux enchères.",
    hours: "Tous les jours sauf vendredi matin",
  },
  {
    slug: "borj-adoumoue",
    title: "Borj Adoumoue — برج الدموع",
    type: "Fortification",
    built: "1775",
    quarter: "Salé",
    body:
      "« La tour des larmes ». Batterie côtière alaouite, bâtie après le " +
      "bombardement français de 1851 — non: elle lui est antérieure, et elle y a " +
      "répondu.",
    hours: "Accès libre",
  },
  {
    slug: "jardin-andalou",
    title: "Jardin andalou des Oudayas — الحديقة الأندلسية",
    type: "Jardin",
    built: "1915",
    quarter: "Rabat",
    body:
      "Dessiné sous le protectorat dans les anciens jardins du palais. Orangers, " +
      "bougainvilliers, et des chats qui ont l'air de payer un loyer.",
    hours: "Tous les jours, 9h00–17h30",
  },
  {
    slug: "cafe-maure",
    title: "Café maure des Oudayas — المقهى المغربي",
    type: "Lieu",
    built: null,
    quarter: "Rabat",
    body:
      "Thé à la menthe et cornes de gazelle, sur une terrasse qui regarde " +
      "l'estuaire et la plage de Salé. On n'y sert rien d'autre, et c'est très bien.",
    hours: "Tous les jours, 8h00 jusqu'au coucher du soleil",
  },
  {
    slug: "necropole-merinide-minaret",
    title: "Minaret de la nécropole — صومعة شالة",
    type: "Monument",
    built: "1339",
    quarter: "Rabat",
    body:
      "Le minaret de la zaouïa d'Abou el-Hassan, à l'intérieur de Chellah. " +
      "Les nids de cigognes en ont fait la silhouette la plus photographiée de la " +
      "ville.",
    hours: "Avec le billet de Chellah",
  },
  {
    slug: "souk-el-ghezel",
    title: "Souk el-Ghezel — سوق الغزل, marché de la laine",
    type: "Rue d'artisans",
    built: null,
    quarter: "Salé",
    body:
      "La laine s'y vendait au poids, et s'y vend encore. La place servait aussi " +
      "au marché aux esclaves jusqu'au XIXe siècle; une plaque le rappelle.",
    hours: "Samedi à jeudi, le matin",
  },
  {
    slug: "mausolee-mohammed-v",
    title: "Mausolée Mohammed V — ضريح محمد الخامس",
    type: "Monument",
    built: "1971",
    quarter: "Rabat",
    body:
      "Face à la Tour Hassan. Onyx, zellige et un plafond de cèdre doré; la garde " +
      "en tenue rouge change toutes les heures.",
    hours: "Tous les jours, 8h00–18h30",
  },
  {
    slug: "bab-oudaia",
    title: "Bab Oudaia — باب الوادية",
    type: "Porte",
    built: "1195",
    quarter: "Rabat",
    body:
      "La porte monumentale de la kasbah, et sans doute la plus belle des portes " +
      "almohades: pas de battants, pas de herse, uniquement la démonstration.",
    hours: "Accès libre",
  },
  {
    slug: "lalla-mennana",
    title: "Zaouïa Lalla Mennana — زاوية لالة منانة",
    type: "Religieux",
    built: null,
    quarter: "Salé",
    body:
      "Petite zaouïa de quartier, peinte en vert et blanc, ouverte sur une " +
      "placette où les enfants jouent au ballon jusqu'à la nuit.",
    hours: null,
  },
  {
    slug: "atelier-de-nattes",
    title: "Ateliers de nattes de jonc — صناعة الحصير",
    type: "Rue d'artisans",
    built: null,
    quarter: "Salé",
    body:
      "Le jonc vient des marais de Sidi Bouknadel. Trois ateliers subsistent; il " +
      "y en avait quarante en 1960.",
    hours: "Samedi à jeudi, 9h00–16h00",
  },
  {
    slug: "fondouk-askour",
    title: "Fondouk Askour — فندق عسكور",
    type: "Lieu",
    built: "18th c.",
    quarter: "Salé",
    body:
      "Ancien caravansérail: écuries en bas, chambres en haut, cour au milieu. " +
      "Les ateliers l'occupent maintenant, ce qui l'a sauvé.",
    hours: "Samedi à jeudi, le matin",
  },
  {
    slug: "remparts-almohades",
    title: "Remparts almohades — الأسوار الموحدية",
    type: "Fortification",
    built: "1197",
    quarter: "Rabat",
    body:
      "Cinq kilomètres de pisé, hauts de huit à dix mètres. On peut en suivre le " +
      "tracé à pied entre Bab er-Rouah et l'océan.",
    hours: "Accès libre",
  },
  {
    slug: "plage-des-oudayas",
    title: "Plage des Oudayas — شاطئ الوداية",
    type: "Lieu",
    built: null,
    quarter: "Rabat",
    body:
      "Au pied de la kasbah, entre la jetée et l'embouchure. Les surfeurs la " +
      "préfèrent en hiver; la baignade y est surveillée l'été seulement.",
    hours: "Accès libre",
  },
  {
    slug: "cimetiere-marin",
    title: "Cimetière marin de Salé — المقبرة البحرية",
    type: "Site",
    built: null,
    quarter: "Salé",
    body:
      "Des milliers de tombes blanches en pente jusqu'à la mer, sans clôture du " +
      "côté de l'eau. On y entre par la porte nord, et on parle bas.",
    hours: "Accès libre",
  },
  {
    slug: "bab-el-had",
    // Titre EN ARABE D'ABORD — le cas dur. Sans dir="auto" la ligne se rend
    // alignée à gauche et l'ordre de lecture est inversé; mesuré, acte 3.
    title: "باب الحد — Bab el-Had, la porte du dimanche",
    type: "Porte",
    built: "1197",
    quarter: "Rabat",
    body:
      "La porte du marché du dimanche, sur les remparts almohades. Le nom " +
      "vient du souk hebdomadaire qui se tenait devant, et qui a disparu dans " +
      "les années 1930.",
    hours: "Accès libre",
  },
];
