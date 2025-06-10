# Résumé détaillé du module Window (avec intégration OpenSky)

________________________________________
1. Arborescence et fichiers clés
Dans le dossier principal de l'application, la fonctionnalité "Window" (ou "Through My Window") est organisée ainsi :
• src/app/services/window.service.ts
  o WindowService : gère les données statiques (vol), dynamiques (altitude, vitesse, position, météo, ETA) et les points d'intérêt.
  o Fournit un observable de progression (0 % → 100 %) pour déclencher la mise à jour des données.
• src/app/services/flight-enrichment.service.ts
  o FlightEnrichmentService : encapsule la logique pour tenter de récupérer, en priorité, une trajectoire réelle via l'API OpenSky (dernier vol GVA→ATH), puis, si l'API est indisponible ou n'a pas de vol récent, bascule vers la génération de segments simulés.
• src/app/services/open-sky.service.ts
  o Service spécialisé pour interroger l'API OpenSky : rechercher le dernier vol GVA→ATH et récupérer ses points de trajectoire (latitude, longitude, altitude, vitesse) au format brut.
• src/app/pages/through-my-window/
  o window-tabs.page.* : page principale, contient un slider de progression et des onglets (Text Data, Map, Hublot).
  o window-text-data.page.* : affiche les informations statiques du vol et les données dynamiques mises à jour à chaque changement de progression.
  o window-map.page.* : affiche une carte interactive avec la trajectoire (réelle ou simulée), les marqueurs (avion, départ, arrivée), les POI, et un bouton pour recentrer le zoom.
  o window-hublot.page.* : met en place une scène 3D pour simuler le hublot (ciel + nuages) et superpose en overlay les données dynamiques (altitude, vitesse, météo).
• src/app/pages/window-map-test.component.ts
  o Composant autonome pour tester la carte Leaflet hors du contexte "tabs". Il peut recevoir un tableau de points en entrée (réels ou simulés) et afficher la progression, le marqueur avion orienté selon le cap, la polyline découpée (partie complétée vs partie restante), etc.
• src/app/app.routes.ts (ou app-routing.module.ts)
  o Contient la route /window qui dirige vers WindowTabsPage (protégée par AuthGuard), ainsi que la route de test /test-map qui charge WindowMapTestComponent.
________________________________________
2. FlightEnrichmentService : priorisation des données réelles et fallback
1. Recherche du dernier vol GVA→ATH
  o Le service interroge en priorité l'API OpenSky pour obtenir le dernier vol identifié par le callsign GVA→ATH dans les dernières 24 heures.
  o Si un vol est trouvé, il récupère son identifiant d'appareil (icao24) et l'heure de départ estimée.
2. Récupération des points de trajectoire
  o À partir de l'icao24 et du timestamp de départ, il interroge l'endpoint "flight track points" d'OpenSky pour obtenir la liste brute de signaux ADS-B : une suite chronologique de positions GPS, d'altitudes et de vitesses, jusqu'à l'arrivée.
3. Resampling en 101 segments
  o Les points bruts peuvent être obtenus à des intervalles irréguliers (quelques dizaines de secondes ou minutes). Pour uniformiser la progression, on effectue un redécoupage en 101 points uniformément répartis soit en fonction du temps total du vol, soit en fonction de la distance parcourue totale.
  o Le résultat est un tableau de 101 objets comprenant le timestamp interpolé, la latitude, la longitude, l'altitude et la vitesse réels (resamplés).
4. Fallback sur la simulation
  o Si la recherche d'un vol GVA→ATH échoue (aucun vol récent ou erreur réseau/API), on bascule automatiquement sur une génération "simulée" :
     On crée 101 points par interpolation linéaire entre les coordonnées de Genève (GVA) et d'Athènes (ATH).
     Les altitudes, vitesses et temps restants sont également calculés selon un schéma prédéfini (montée → croisière → descente, etc.).
5. Indicateur d'origine des données
  o Une propriété booléenne isRealData signale si l'on utilise des données réelles ou simulées.
  o Le template affiche, en haut de la page, une note colorée :
     Bleu si des données réelles ont été chargées (mention du callsign et de l'heure de départ réelle).
     Rouge sinon ("Données simulées").
________________________________________
3. WindowService : gestion centralisée des données
Le WindowService reste le point unique d'émission des données à consommer par les pages :
1. Données statiques
  o Numéro de vol (fixé par défaut à "AZ201" ou remplacé dynamiquement si enrichi via l'API), compagnie, aéroports de départ et d'arrivée, heure de départ, durée, statut, type d'appareil.
2. Données dynamiques
  o Altitude, vitesse, position, météo et temps restant.
  o Si des données réelles sont disponibles, WindowService reçoit le tableau de 101 points réels resamplés ; la "position" provient directement des données OpenSky, l'altitude et la vitesse aussi.
  o Sinon, si l'on est en mode fallback, WindowService crée ces mêmes valeurs par interpolation linéaire (altitude, vitesse, position, temps restant).
3. Progression (0 %→100 %)
  o Chaque fois que l'on met à jour la progression (via le slider), WindowService déclenche la mise à jour de _dynamicData avec les valeurs correspondant au segment indexé par ce pourcentage.
  o Si l'on est en mode réel, la progression pilote simplement la sélection du point [percent] dans le tableau "101 points réels".
  o Si l'on est en mode simulé, on reprend la logique d'interpolation dans generateSegments().
4. Listes de POIs
  o Une liste fixe de points d'intérêt (Genève, Milan, Rome, Athènes) est initialisée une fois et exposée via un observable. Ces POIs sont utilisés par la page Map pour afficher des marqueurs supplémentaires.
________________________________________
4. WindowTabsPage : slider + onglets
La page WindowTabsPage joue le rôle de tableau de bord pour "Window" :
1. Slider de progression
  o Affiche la valeur actuelle (0 % → 100 %) et permet à l'utilisateur de la modifier manuellement.
  o Toute modification est transmise à WindowService, qui met à jour les données dynamiques (vraies ou simulées).
2. Onglets (Ionic Tabs)
  o Trois onglets sont disponibles : Text Data, Map et Hublot.
  o Un <ion-router-outlet> interne charge la page correspondante à l'onglet actif, en fonction de la route (par exemple /window/text-data, /window/map ou /window/hublot).
  o Par défaut, si aucun onglet n'est sélectionné, on redirige vers l'onglet "Map".
3. Cycle de vie et abonnements
  o Au démarrage, cette page s'abonne à l'observable de progression pour afficher la valeur du slider.
  o Lorsqu'on quitte la page, tous les abonnements sont désabonnés afin d'éviter les fuites de mémoire.
________________________________________
5. WindowTextDataPage : affichage textuel (données statiques + dynamiques)
Dans cet onglet :
1. Abonnement aux observables
  o S'abonne au flux des données statiques du vol pour afficher en haut : numéro de vol, compagnie, départ (aéroport + horaire), arrivée (aéroport + durée), type d'appareil, statut.
  o S'abonne au flux des données dynamiques pour afficher en temps réel : altitude, vitesse, position GPS (lat/lng), temps estimé restant, météo.
2. Affichage conditionnel
  o Si isRealData est vrai, un bandeau bleu en haut indique que la trajectoire provient de l'API OpenSky (callsign + heure réelle).
  o Sinon, un bandeau rouge précise que les données sont simulées.
3. Mise en page
  o Les données sont regroupées sous deux sections :
     Informations générales (vol statique)
     Données en temps réel (altitude, vitesse, position, temps restant, météo, statut)
  o Chaque ligne est présentée dans une liste Ionic avec titre et valeur.
________________________________________
6. WindowMapPage : carte interactive (vraie ou simulée)
Cet onglet gère la carte Leaflet, la trajectoire, les marqueurs et la liste des POIs en dessous :
1. Initialisation (au chargement)
  o Dès que les données statiques (nécessaire pour savoir le point de départ) et dynamiques (position initiale) sont disponibles, on crée la carte centrée sur cette position initiale.
  o On ajoute la couche de tuiles OpenStreetMap.
2. Trajectoire du vol
  o Si des données réelles existent, on reçoit un tableau de 101 points (resamplés) depuis le FlightEnrichmentService.
  o Sinon, on génère 101 points par interpolation linéaire (GVA→ATH).
  o On dessine une polyline sur ces 101 points. Cette polyline est de couleur unie (par exemple bleu foncé) et d'épaisseur constante.
3. Marqueur avion animable
  o À chaque mise à jour de la progression, on calcule l'indice correspondant (0 → 100) et on déplace le marqueur avion sur le point approprié.
  o Si des données réelles sont utilisées, l'orientation (cap) est calculée à partir des deux points successifs réels pour faire pivoter correctement l'icône.
  o Dans le mode simulé, on calcule le cap de manière identique à partir des points interpolés.
4. Marqueurs de départ et d'arrivée
  o Deux marqueurs fixes sont placés : un sur Genève (point de départ) et un sur Athènes (point d'arrivée), chacun avec un popup textuel.
5. Points d'intérêt (POIs)
  o Dès que la liste des POIs (Genève, Milan, Rome, Athènes) est chargée par WindowService, on crée un marqueur pour chacun et on le colle sur la carte. Chaque popup affiche le nom et la description du POI.
6. Mise à jour en temps réel
  o Quand la progression change, on supprime l'ancienne polyline (ou on met à jour la portion "déjà parcourue" vs "restant") et on redessine si nécessaire.
  o Le marqueur avion est déplacé et tourné pour refléter le cap du vol.
  o Le bouton flottant "Recentrer" permet soit de remettre l'ensemble de la trajectoire dans le champ de vue, soit d'appliquer un niveau de zoom spécifique.
7. Affichage de la note "vraies données / simulation"
  o Un bandeau en haut de la page (sous le header) indique si l'on utilise des données réelles (avec détails sur le callsign et l'heure du vol) ou si l'on est en mode simulé.
8. Style et dimensionnement
  o La carte occupe une portion prédéfinie de la hauteur de l'écran (par exemple 60 % de la hauteur).
  o En dessous, une liste Ionic affiche tous les POIs sous forme d'items, avec nom et description.
  o Le scroll fonctionne correctement si le reste du contenu dépasse la hauteur visible.
________________________________________
7. WindowHublotPage : vue 3D du hublot
Cet onglet propose une expérience immersive en 3D et superpose les données dynamiques :
1. Scène Three.js
  o Création d'une scène 3D avec une caméra perspective placée de façon à simuler la vue d'un passager face au hublot.
  o Un skybox sphérique inversé crée un dégradé de ciel bleu.
2. Nuages
  o Plusieurs petits objets semi-opaques (formes simplifiées pour représenter des nuages) sont dispersés autour de la caméra.
  o Dans la boucle d'animation, ces nuages se déplacent lentement ou oscillent pour donner l'impression de mouvement.
3. Overlay des données dynamiques
  o Les données dynamiques (altitude, vitesse, météo) sont affichées en surimpression sur le rendu 3D, dans une zone en position absolue.
  o Si l'on dispose de données réelles, l'altitude et la vitesse proviennent directement du tableau de points OpenSky ; sinon, ce sont les valeurs simulées.
4. Animation et redimensionnement
  o Une boucle d'animation (via requestAnimationFrame) fait tourner très légèrement la skybox et parcourt la liste des nuages pour mettre à jour leurs positions.
  o Un écouteur sur l'événement "resize" ajuste la caméra et la taille du renderer pour occuper toujours l'intégralité de l'espace disponible.
5. Nettoyage
  o Lorsqu'on quitte la page, l'animation est stoppée et l'écouteur de redimensionnement est supprimé pour éviter les fuites de ressources.
________________________________________
8. WindowMapTestComponent : composant de diagnostic de la carte
Ce composant autonome sert à tester la carte Leaflet en dehors de la structure "tabs" :
1. Réception en entrée
  o Il accepte un tableau de points (segments) et un pourcentage de progression (currentPercent). Ces points peuvent provenir du service (réels ou simulés) ou d'un jeu fixe de points de test.
2. Affichage de la carte
  o Création d'une carte Leaflet centrée par défaut sur une position générique (par exemple lat 44, lng 15).
  o Affichage d'un "overlay de debug" (nombre de points reçus, coordonnées de départ et d'arrivée).
3. Trajectoire et découpe en "déjà parcouru" vs "restant"
  o Les points sont affichés sous forme de polyline continue pour la partie parcourue et en pointillés (ou en couleur douce) pour la partie restante, en fonction de currentPercent.
  o Sur chaque point, on place un petit cercle coloré (vert pour le premier, rouge pour le dernier, bleu pour les autres).
4. Marqueur avion
  o On calcule l'indice du segment actuel à partir de currentPercent et l'on déplace un marqueur avion sur ce point.
  o L'icône est orientée selon le cap calculé entre deux points successifs.
  o On recentre la carte sur la position de l'avion à chaque mise à jour.
5. Gestion du cycle de vie
  o À l'initialisation, on dessine la carte, la trajectoire et le marqueur avion.
  o À chaque changement de segments ou currentPercent, on redessine la trajectoire et on repositionne l'avion.
  o À la destruction, on supprime la carte pour libérer les ressources.
________________________________________
9. Configuration des routes
Dans le fichier de routing principal (app.routes.ts ou app-routing.module.ts) :
1. Route /window
  o Charge WindowTabsPage (protégée par un AuthGuard) : c'est là que démarre le module "Window".
  o Les sous-routes enfants sont automatiquement gérées via le <ion-router-outlet> interne et le système d'ion-tabs :
     /window/text-data → WindowTextDataPage
     /window/map → WindowMapPage
     /window/hublot → WindowHublotPage
     Par défaut, si aucun onglet n'est actif, on redirige vers /window/map.
2. Route /test-map
  o Charge directement WindowMapTestComponent pour simplifier le debug de la carte sans passer par le module Tabs.
3. Route par défaut
  o La route '' redirige vers la page d'authentification ou un autre écran d'accueil si l'utilisateur n'est pas connecté.
________________________________________
10. Flux des données et cycle de vie global
1. Navigation initiale vers /window
  o Angular active WindowTabsPage.
  o Dans le ngOnInit() de WindowTabsPage, on appelle loadRealFlightData() du FlightEnrichmentService.
2. Tentative de données réelles
  o Si OpenSky renvoie un vol GVA→ATH, on reçoit la trajectoire resamplée en 101 points.
  o On stocke ces points dans un observable ou un sujet, et on positionne isRealData = true.
  o Les pages TextData, Map et Hublot s'abonnent aux données statiques (qui contiennent désormais le callsign et les infos réelles) et aux données dynamiques (issue du tableau resamplé des points).
3. Fallback simulation si besoin
  o Si OpenSky échoue, isRealData = false.
  o On génère 101 points par interpolation linéaire (simulation).
  o Les pages TextData, Map, Hublot s'abonnent au même canal, mais les valeurs proviennent désormais de la simulation.
4. Mise à jour par le slider
  o Quand l'utilisateur déplace le slider, on déclenche updateProgress(p) dans WindowService.
  o Le service active alors la sélection du point [p] dans le tableau (réel ou simulé) pour obtenir l'altitude, la vitesse, la position, etc.
  o Les trois sous-pages reçoivent ces nouvelles valeurs et rafraîchissent instantanément leur affichage :
     TextDataPage : met à jour les champs d'affichage
     MapPage : déplace l'avion, redessine la portion parcourue/restante de la trajectoire
     HublotPage : met à jour l'overlay texte des données dynamiques (la 3D reste identique si aucun changement n'est codé)
5. Destruction et nettoyage
  o Lorsqu'on quitte /window, chaque page invoque son ngOnDestroy(), se désabonne des observables et détruit ses éléments (carte, scène 3D) pour éviter les fuites.
________________________________________
11. Points spécifiques et recommandations
1. Intégration OpenSky
  o Vous avez désormais la logique complète pour interroger OpenSky, récupérer le dernier vol GVA→ATH (callsign + horaire), puis obtenir sa trajectoire réelle.
  o Le FlightEnrichmentService centralise cette logique et gère le fallback vers la simulation en cas d'erreur ou d'absence de vol.
  o Dans l'interface, un bandeau informe l'utilisateur de l'origine des données ("vraies données" en bleu vs "données simulées" en rouge).
2. Resampling des données réelles
  o Pour conserver l'expérience "101 segments", la trajectoire brute reçue d'OpenSky est découpée de manière uniforme en 101 points, soit en fonction du temps total, soit en fonction de la distance parcourue.
  o Cela permet de piloter le slider et de mettre à jour l'avion de la même manière que pour la simulation.
3. Modularité
  o WindowService reste responsable uniquement de la fourniture des données (qu'elles soient réelles ou simulées).
  o WindowTabsPage orchestre l'interaction utilisateur (slider) et la sélection entre vrai/simulé.
  o Les sous-pages (TextData, Map, Hublot) se contentent de consommer les observables et d'afficher.
4. Expérience utilisateur
  o Le bandeau coloré en haut de chaque sous-page (TextData, Map, Hublot) indique clairement si l'on visualise un vol réel ou une simulation.
  o L'affichage en temps réel (qu'il s'agisse de vraies données ou de simulation) est fluide : le slider pilote l'animation de la carte et la mise à jour des données textuelles.
5. Améliorations possibles
  o Adapter la densité des nuages dans la vue "Hublot" en fonction de l'altitude réelle (par exemple, plus de nuages à basse altitude, ciel plus clair en croisière).
  o Permettre à l'utilisateur de saisir un callsign ou de choisir une date pour charger un vol précis depuis OpenSky (plutôt que de toujours prendre le dernier vol GVA→ATH).
  o Ajouter des indicateurs visuels pour les POIs en vol réel, par exemple l'altitude ou la distance par rapport à ces villes.
  o Intégrer des animations supplémentaires sur la carte (parcours progressif de la trajectoire) plutôt que de simplement redessiner la partie "complétée" en couleur et la partie "restante" en pointillés.
________________________________________
En résumé final
1. Recherche et affichage prioritaire des données réelles via l'API OpenSky pour le dernier vol GVA→ATH (resampling en 101 points).
2. Fallback automatique vers la simulation (interpolation linéaire) si l'API échoue ou si aucun vol n'a été trouvé.
3. WindowService centralise les données (statique + dynamiques + POIs).
4. WindowTabsPage : slider pour piloter la progression, onglets pour accéder aux vues "Text Data", "Map" et "Hublot".
5. WindowTextDataPage : affiche en texte toutes les informations du vol (qu'il soit réel ou simulé).
6. WindowMapPage : carte Leaflet qui trace la trajectoire, positionne un avion animé, ajoute des POIs et permet un recentrage via un bouton.
7. WindowHublotPage : met en place une scène 3D immersive, superpose les données dynamiques en overlay.
8. WindowMapTestComponent : composant autonome pour diagnostiquer la carte sans passer par les onglets.
9. Routing : /window (protégé par AuthGuard) charge WindowTabsPage ; /test-map charge le composant de test Leaflet.
10. Flux de données en temps réel : la progression déclenche la mise à jour des valeurs d'altitude, de vitesse et de position, qu'elles soient réelles ou simulées, et chaque sous-page se met à jour instantanément.
Cette organisation garantit une expérience utilisateur cohérente, priorise les données réelles quand elles existent, et conserve un fallback fiable pour afficher une simulation en l'absence de vol réel. 