# Architecture du Projet

## Standards de Qualité du Code
1. **Vérification Automatique**
   - Utilisation de TSLint/ESLint pour la vérification du code
   - Configuration stricte des règles de linting
   - Intégration dans le pipeline CI/CD
   - Blocage des merges en cas d'erreurs de linter

2. **Processus de Développement**
   - Vérification locale des erreurs de linter avant chaque commit
   - Résolution immédiate des erreurs de linter
   - Documentation des exceptions justifiées
   - Revue de code incluant la vérification des erreurs de linter

## Documentation et Suivi
1. **Tests et Validations**
   - Documentation systématique dans `TEST_TRACKING.md`
   - Suivi des solutions échouées
   - Historique des tentatives
   - Impact sur l'architecture

2. **Mise à Jour de la Documentation**
   - Après chaque modification architecturale
   - Après chaque test d'intégration
   - Après chaque validation de performance
   - Au moins une fois par semaine

3. **Format de Documentation**
   - Date et heure de la mise à jour
   - Description technique détaillée
   - Impact sur l'architecture
   - Prochaine revue prévue

## Structure du Projet

## Mise à jour 2024-04-27
- Intégration de l'enrichissement avion via OpenFlights dans le service d'enrichissement
- Gestion explicite des cas non trouvés (message utilisateur)
- Préparation de l'intégration OpenSky Network pour la position temps réel (fiche vol) 