# Suivi des UAT (User Acceptance Tests)

## Qu'est-ce qu'un UAT ?
Les UAT sont des tests d'acceptation utilisateur, rédigés en langage naturel, qui valident que l'application répond bien aux besoins métiers et aux attentes des utilisateurs finaux.

## Démarche recommandée
1. **Rédiger les scénarios UAT** en langage Gherkin (Given/When/Then).
2. **Automatiser l'exécution** avec un outil adapté (Cypress, Playwright, Appium, etc.).
3. **Intégrer les tests** dans la CI/CD pour exécution automatique à chaque build.
4. **Analyser les rapports** pour valider la conformité avant livraison.

## Exemple de scénario UAT (Gherkin)
```gherkin
Fonctionnalité: Connexion utilisateur
  Scénario: Utilisateur valide
    Étant donné que je suis sur la page de connexion
    Quand je saisis un email valide et un mot de passe valide
    Alors je suis redirigé vers mon tableau de bord
```

## Outils recommandés
- **Cypress** (web)
- **Playwright** (web/mobile)
- **Appium** (mobile natif/hybride)
- **Cucumber-js** (runner BDD)

## Conseils
- Stocker les scénarios `.feature` dans un dossier `uat/` ou `tests/uat/`.
- Générer des rapports HTML/JUnit pour chaque exécution.
- Intégrer les jobs UAT dans le pipeline CI (GitLab, GitHub Actions, etc.).

## Ressources
- [Documentation Gherkin](https://cucumber.io/docs/gherkin/)
- [Cypress](https://www.cypress.io/)
- [Playwright](https://playwright.dev/)
- [Appium](https://appium.io/) 