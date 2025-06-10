# Suivi de debug / Historique des incidents

## 2024-05-16 — Problème de traduction sur la HomePage

- **Symptôme** : Les clés de traduction (HOME.TITLE, HOME.BASELINE, etc.) s'affichent au lieu des textes traduits sur la page d'accueil, alors que le pipe fonctionne ailleurs.
- **Hypothèses** :
  - Problème d'import du pipe ?
  - Problème d'injection du service ?
  - Problème de scope ou de build Angular ?
  - Variable translations non accessible dans le service ?
- **Actions menées** :
  1. Vérification de l'import du pipe dans HomePage (OK)
  2. Ajout de logs dans le pipe et le service (OK)
  3. Test d'un texte de test en dur (le pipe fonctionne mais retourne la clé)
  4. Vérification de l'instanciation du service (OK)
  5. Correction : déplacement de la variable translations comme propriété statique de la classe TranslateService
- **Résultat** :
  - Problème résolu : la traduction fonctionne sur la HomePage et partout
  - Historique consigné dans PlanTests.md et Debug.md
- **Lien commit** : voir commit "fix(i18n): translations as static property in TranslateService"

---

À compléter à chaque nouveau bug ou investigation. 