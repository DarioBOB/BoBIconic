# BoB — Procédures de Release

## 📋 Vue d'ensemble

Ce document décrit les procédures de release pour l'application BoB, couvrant les versions web et mobile.

## 🚀 Types de Releases

### Hotfix
- Corrections de bugs critiques
- Délai : 24-48h
- Process : `main` → `hotfix/*` → `main`

### Feature Release
- Nouvelles fonctionnalités
- Délai : 2-4 semaines
- Process : `develop` → `feature/*` → `develop` → `staging` → `main`

### Major Release
- Refonte majeure
- Délai : 2-3 mois
- Process : `develop` → `release/*` → `staging` → `main`

## 📝 Checklist de Release

### Pré-release
- [ ] Tests unitaires passés
- [ ] Tests E2E passés
- [ ] Code review validé
- [ ] Documentation à jour
- [ ] Changelog préparé
- [ ] Assets prêts

### Release
- [ ] Version bump
- [ ] Build de production
- [ ] Tests de smoke
- [ ] Déploiement staging
- [ ] Tests UAT
- [ ] Déploiement production

### Post-release
- [ ] Monitoring activé
- [ ] Backup vérifié
- [ ] Analytics vérifiés
- [ ] Support notifié

## 🔄 Processus de Release

### 1. Préparation
```bash
# Mettre à jour develop
git checkout develop
git pull origin develop

# Créer la branche de release
git checkout -b release/v1.x.x
```

### 2. Version Bump
```bash
# Mettre à jour package.json
npm version patch|minor|major

# Commit les changements
git commit -am "Bump version to v1.x.x"
```

### 3. Tests
```bash
# Lancer les tests
npm test
npm run e2e

# Vérifier le build
ionic build --prod
```

### 4. Déploiement
```bash
# Déployer sur staging
firebase deploy --only hosting -P staging

# Vérifier staging
# Si OK, déployer en production
firebase deploy --only hosting -P production
```

## 📱 Release Mobile

### Android
1. Build AAB
```bash
ionic capacitor sync android
cd android
./gradlew bundleRelease
```

2. Signer l'AAB
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore bob.keystore app-release.aab bob
```

3. Upload Play Store
- Connecter Play Console
- Upload AAB
- Remplir release notes
- Publier en production

### iOS
1. Build Archive
```bash
ionic capacitor sync ios
cd ios
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release archive
```

2. Upload App Store
- Connecter App Store Connect
- Upload archive
- Remplir release notes
- Soumettre pour review

## 📊 Monitoring

### Métriques à Surveiller
- Taux de crash
- Performance
- Engagement utilisateur
- Conversion

### Alertes
- Crash rate > 1%
- Performance score < 90
- Error rate > 0.1%

## 🚨 Rollback

### Web
```bash
# Revenir à la version précédente
firebase hosting:clone bob-prod:live bob-prod:live --version=VERSION_ID
```

### Mobile
1. Revenir à la version précédente sur les stores
2. Désactiver les nouvelles features
3. Notifier les utilisateurs

## 📝 Documentation

### Changelog
- Format : [Keep a Changelog](https://keepachangelog.com/)
- Sections : Added, Changed, Deprecated, Removed, Fixed, Security

### Release Notes
- Résumé des changements
- Instructions de mise à jour
- Notes de migration
- Liens vers la documentation

## 👥 Rôles & Responsabilités

### Release Manager
- Coordonner le processus
- Valider les checklists
- Gérer les communications
- Superviser le déploiement

### Dev Team
- Préparer le code
- Exécuter les tests
- Résoudre les problèmes
- Documenter les changements

### QA Team
- Valider les tests
- Vérifier les fonctionnalités
- Signaler les problèmes
- Valider le déploiement

## 📞 Support

### Pré-release
- Préparer la FAQ
- Mettre à jour la documentation
- Former le support

### Post-release
- Monitorer les retours
- Répondre aux questions
- Collecter les feedbacks

## 🔄 Maintenance

### Regular Tasks
- Mise à jour des dépendances
- Rotation des clés
- Backup des données
- Monitoring des performances

### Emergency
- Procédure de rollback
- Contact d'urgence
- Documentation des incidents
- Post-mortem

---

## 🔄 Mise à Jour

Ces procédures de release sont un document vivant qui sera mis à jour régulièrement. Toute modification doit être validée par l'équipe technique. 