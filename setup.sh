#!/bin/bash

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier la version de Node.js
NODE_VERSION=$(node -v)
echo "Version de Node.js détectée : $NODE_VERSION"

# Installer Angular CLI globalement
echo "Installation de l'Angular CLI..."
npm install -g @angular/cli

# Installer Ionic CLI globalement
echo "Installation de l'Ionic CLI..."
npm install -g @ionic/cli

# Installer les dépendances du projet
echo "Installation des dépendances du projet..."
npm ci

# Vérifier si l'installation a réussi
if [ $? -eq 0 ]; then
    echo "Installation terminée avec succès !"
    echo "Vous pouvez maintenant lancer l'application avec 'npm start' ou 'ionic serve'"
else
    echo "Erreur lors de l'installation des dépendances"
    exit 1
fi 