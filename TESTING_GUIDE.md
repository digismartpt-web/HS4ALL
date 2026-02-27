# Guide de Test - Hs4all Website Updates

## 🧪 Tests à Effectuer

### 1. Menu de Langue - Espagnol
**Actions**:
- Cliquer sur le menu déroulant de langue (haut à droite)
- Vérifier que "Español" apparaît dans la liste

**Résultat attendu**:
- ✅ L'option Español est visible
- ✅ Cliquer sur "Español" change la langue du site
- ✅ Tous les textes passent en espagnol
- ✅ Les noms des projets sont traduits (ex: "Residencia del Lago")

**Note**: Le site devrait être déjà adapté pour l'espagnol

---

### 2. Sons des Images - Arrêt à 50% de Visibilité
**Actions**:
- Aller à la section Philosophy
- Cliquer sur le bouton son de l'image
- Scroller lentement pour faire descendre l'image
- Observer le comportement du son

**Résultat attendu**:
- ✅ Le son joue quand l'image est > 50% visible
- ✅ Le son s'arrête automatiquement quand l'image devient < 50% visible
- ✅ Le bouton son perd sa classe "active" quand le son s'arrête
- ✅ Aucun bruit parasite

---

### 3. Révélation des Projets - Arrêt Son
**Actions**:
- Aller à la section Projets
- Cliquer sur le bouton son d'un projet (le bouton circulaire blanc)
- Vérifier que le son joue
- Cliquer immédiatement sur "Continue l'immersion" / "Continuez l'immersion"

**Résultat attendu**:
- ✅ Le son s'arrête instantanément
- ✅ Le bouton son perd sa classe "active"
- ✅ La révélation de l'intérieur se fait sans son
- ✅ L'animation de révélation continue normalement

---

### 4. Agrandissement des Projets - Arrêt Son
**Actions**:
- Aller à "Plus de projets" (bouton en bas de la section projects)
- Vérifier que la modal s'ouvre
- Cliquer sur le bouton d'agrandissement (flèche double) d'un projet
- Cliquer sur le bouton son avant d'agrandir (pour que le son joue)
- Ensuite cliquer sur la flèche d'agrandissement

**Résultat attendu**:
- ✅ La modal fullscreen s'ouvre
- ✅ Le son s'arrête
- ✅ Le bouton son de la fullscreen est inactif
- ✅ L'image s'affiche sans aucun bruit de fond

---

### 5. Repositionnement HERO
**Actions**:
- Regarder la section HERO (au démarrage)
- Observer la position du bouton son ET du bouton "Ouvir a secção"

**Résultat attendu**:
- ✅ Le bouton "Ouvir a secção" est JUSTE AU-DESSUS du titre "Construa menos."
- ✅ Le bouton son est À GAUCHE du titre "Construa menos."
- ✅ Les deux boutons et le titre sont alignés horizontalement
- ✅ L'espacement est égal et harmonieux
- ✅ Le titre reste centré sur la page

---

### 6. Animations des Images
**Actions A - Section Philosophy**:
- Passer la souris sur l'image à droite de "Notre philosophie"
- Observer le mouvement

**Actions B - Section Projects**:
- Passer la souris sur n'importe quel projet (sauf si déjà révélé)
- Observer le mouvement

**Résultat attendu**:
- ✅ L'image se zoom légèrement (1.08x pour philosophy, 1.06x pour projects)
- ✅ L'image tourne légèrement (0.5deg ou -0.5deg)
- ✅ L'animation est lisse (0.6s)
- ✅ Pas d'animation sur HERO (animation parallax normale)

---

### 7. Section Contact
**Actions**:
- Scroller jusqu'à la section Contact
- Observer le bouton "Écouter la section"

**Résultat attendu**:
- ✅ Le bouton est présent AVANT la section de contact info
- ✅ Le bouton permet d'écouter uniquement les infos (email, tel, adresse)
- ✅ Le bouton n'affecte pas le formulaire de contact
- ✅ Le bouton fonctionne correctement avec toutes les langues

---

### 8. Footer - Nouveau Design
**Actions**:
- Scroller tout en bas du site
- Observer le footer

**Résultat attendu**:
- ✅ Fond: Gradient noir/charcoal (au lieu de beige clair)
- ✅ Texte: Blanc (au lieu de noir)
- ✅ Border top: Gold/wood (au lieu de beige)
- ✅ Layout: Marque à gauche + Liens en 2x2
- ✅ Logo et tagline alignés à GAUCHE
- ✅ Liens avec underline animation au hover
- ✅ Design plus moderne et esthétique

---

### 9. Responsive - Mobile Testing
**Actions**:
- Ouvrir le site sur mobile (ou utiliser DevTools)
- Tester tous les éléments ci-dessus

**Résultat attendu**:
- ✅ Le layout s'adapte correctement
- ✅ Le footer est lisible sur mobile
- ✅ Les boutons sont cliquables
- ✅ Les animations fonctionnent

---

### 10. Langues Multi
**Actions**:
- Changer de langue entre FR, PT, EN, ES
- Vérifier que tout change bien

**Résultat attendu**:
- ✅ FR: "Construisez moins. Vivez mieux."
- ✅ PT: "Construa menos. Viva melhor."
- ✅ EN: "Build less. Live better."
- ✅ ES: "Construye menos. Vive mejor."
- ✅ Tous les textes sont traduits
- ✅ Les noms de projets changent
- ✅ Les boutons changent de texte

---

## 📊 Checklist de Validation

- [ ] Espagnol fonctionne correctement
- [ ] Sons s'arrêtent à 50% de visibilité
- [ ] Sons s'arrêtent au clic "Continue immersion"
- [ ] Sons s'arrêtent à l'agrandissement
- [ ] Boutons HERO repositionnés correctement
- [ ] Bouton contact "Écouter" fonctionne
- [ ] Animations images visibles
- [ ] Footer nouveau design visible
- [ ] Pas d'erreurs console
- [ ] Site responsive sur mobile

---

## 🔍 Points Critiques

1. **Son à 50%**: Observer dans la console si l'IntersectionObserver est activé
2. **HERO buttons**: Vérifier l'alignement horizontal parfait
3. **Footer**: Vérifier le gradient + couleurs
4. **Animations**: Vérifier la fluidité sans lag

---

## ⚠️ Problèmes Potentiels à Check

- Si les sons ne s'arrêtent pas à 50%: Vérifier que `window.simpleSoundManager` existe
- Si le HERO buttons ne s'affichent pas: Vérifier que `.hero-title-wrapper` est présent
- Si footer est noir mais pas beau: Vérifier le gradient CSS
- Si animations lag: Vérifier la performance GPU du navigateur

---

## 💡 Tips de Debug

**Console Browser (F12)**:
```javascript
// Tester simplement les traductions
console.log(window.translations.es['nav.projects'])

// Tester le son manager
console.log(window.simpleSoundManager)

// Vérifier l'observer
console.log(document.querySelectorAll('.sound-trigger'))
```

---

## 📞 Support

Tous les fichiers modifiés sont documentés dans:
- `CHANGELOG_UPDATES.md` - Résumé complet
- `MODIFICATIONS_DETAILS.md` - Détails techniques

