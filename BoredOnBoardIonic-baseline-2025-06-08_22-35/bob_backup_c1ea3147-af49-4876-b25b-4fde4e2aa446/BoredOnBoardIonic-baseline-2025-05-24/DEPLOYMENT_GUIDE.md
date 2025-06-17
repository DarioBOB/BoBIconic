# BoB — Guide de Déploiement

## 🚀 Environnements

### Development
- URL : https://dev.bob-app.com
- Firebase Project : bob-dev
- Branch : `develop`

### Staging
- URL : https://staging.bob-app.com
- Firebase Project : bob-staging
- Branch : `staging`

### Production
- URL : https://bob-app.com
- Firebase Project : bob-prod
- Branch : `main`

## 📦 Processus de Build

### Préparation
```bash
# Mettre à jour les dépendances
npm install

# Vérifier les tests
npm test

# Vérifier le linting
npm run lint
```

### Build Web
```bash
# Build de production
ionic build --prod

# Vérifier le build
ionic serve --prod
```

### Build Mobile
```bash
# Android
ionic capacitor sync android
ionic capacitor open android

# iOS
ionic capacitor sync ios
ionic capacitor open ios
```

## 🔄 Déploiement

### Firebase Hosting
```bash
# Build
ionic build --prod

# Déployer
firebase deploy --only hosting
```

### Android
1. Build APK/AAB dans Android Studio
2. Signer avec la keystore de production
3. Upload sur Google Play Console
4. Publier en production

### iOS
1. Build dans Xcode
2. Archive l'application
3. Upload sur App Store Connect
4. Soumettre pour review

## 🔒 Sécurité

### Variables d'Environnement
- Ne jamais commiter les fichiers `.env`
- Utiliser les secrets Firebase
- Roter les clés API régulièrement

### Certificats
- Garder les keystores sécurisées
- Backup des certificats
- Rotation annuelle

## 📊 Monitoring

### Firebase
- Crashlytics
- Performance
- Analytics
- Cloud Functions

### Custom
- Error tracking
- User behavior
- Performance metrics

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

## 📝 Checklist de Déploiement

### Pré-déploiement
- [ ] Tests passés
- [ ] Linting OK
- [ ] Build réussi
- [ ] Variables d'environnement configurées
- [ ] Documentation à jour

### Déploiement
- [ ] Backup de la base de données
- [ ] Déploiement web
- [ ] Déploiement mobile
- [ ] Vérification des fonctionnalités
- [ ] Monitoring activé

### Post-déploiement
- [ ] Vérification des logs
- [ ] Test des fonctionnalités critiques
- [ ] Monitoring des erreurs
- [ ] Notification aux utilisateurs

## 🔍 Troubleshooting

### Common Issues
1. Build fails
   - Vérifier les versions
   - Nettoyer le cache
   - Mettre à jour les dépendances

2. Deploy fails
   - Vérifier les permissions
   - Valider la configuration
   - Checker les quotas

3. App crashes
   - Vérifier les logs
   - Tester sur différents devices
   - Valider les permissions

## 📈 Performance

### Métriques
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Performance Score > 90

### Optimisations
- Compression des assets
- Lazy loading
- Cache management
- Bundle optimization

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

Ce guide de déploiement est un document vivant qui sera mis à jour régulièrement. Toute modification doit être validée par l'équipe technique. 