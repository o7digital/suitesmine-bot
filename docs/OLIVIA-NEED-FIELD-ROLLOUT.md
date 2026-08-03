# Olivia AI — Champ Necesidad / Need / Besoin

Date: 2026-08-03

## Objectif

Tous les chats Olivia AI doivent demander, au moment où le visiteur laisse ses coordonnées, un champ supplémentaire pour son besoin.

Libellé attendu selon la langue:

- Espagnol: `Necesidad`
- Anglais: `Need`
- Français: `Besoin`
- Allemand, si le site existe en allemand: `Bedarf`

Ce champ doit être stocké dans le Channel Manager afin que l'opérateur voie immédiatement pourquoi le prospect contacte le client.

## Règle fonctionnelle

Quand le visiteur soumet ses coordonnées, le formulaire doit contenir au minimum:

- prénom / nom ou nom complet selon le widget
- email
- téléphone
- besoin (`Necesidad`, `Need`, `Besoin`, `Bedarf`)

Le besoin doit être envoyé:

1. dans le texte du lead visible dans la conversation;
2. dans les metadata de la conversation;
3. dans le payload éventuel vers l'endpoint lead externe si le site en utilise un.

Format recommandé dans le message Channel Manager:

```txt
Lead: Nombre Apellido · email@domain.com · +52... · Necesidad: consulta anti-aging
```

Metadata recommandées:

```json
{
  "need": "consulta anti-aging",
  "necesidad": "consulta anti-aging",
  "leadStatus": "captured"
}
```

## Sites déjà patchés le 2026-08-03

Ces sites ont été modifiés, buildés, commit/push et déployés:

- Golden Health — repo `o7digital/goldenhealth`
- TOUSKI — repo `o7digital/touski2`
- DIICSA — repo `o7digital/diicsacv`
- SecuryTI — repo `o7digital/securyti`
- SecuryTI landing — repo `o7digital/securyti-landing`

## Sites à vérifier encore

À vérifier car ils peuvent avoir un widget Olivia séparé, un ancien script, ou une intégration spécifique:

- Elite Ride Mexico
- Jean Louis David México
- ZeVi Capital
- Cusi Flores
- Kabin Consultores
- Cervantes Bienes Raíces
- Vialterna
- AO IT Group
- Home Design Marques
- La Casa Que Canta
- tout autre site client Olivia AI

## Point technique important

Le système actuel a plusieurs composants Olivia séparés dans différents repos. C'est fragile: chaque amélioration doit être répétée site par site.

Recommandation prioritaire:

Créer un widget Olivia commun servi par le backend Olivia, par exemple:

```html
<script src="https://olivia-ai.o7digital.com/widget.js?client=CLIENT_CODE" async></script>
```

Avantages:

- un seul composant à maintenir;
- le champ `Necesidad / Need / Besoin` est disponible partout automatiquement;
- corrections responsive et Channel Manager centralisées;
- moins de risque d'oublier un client;
- déploiement plus rapide pour les futurs sites.

## Checklist pour chaque site restant

Pour chaque site Olivia AI:

1. Ouvrir le chat en espagnol, anglais et français si applicable.
2. Vérifier que le formulaire de coordonnées affiche le bon libellé:
   - ES: `Necesidad`
   - EN: `Need`
   - FR: `Besoin`
3. Soumettre un lead de test complet.
4. Ouvrir le Channel Manager:
   `https://olivia-ai.o7digital.com/inbox?client=CLIENT_CODE`
5. Vérifier que le besoin apparaît:
   - dans le message principal du lead;
   - dans le panneau `Información / Contexto`;
   - dans les metadata si elles sont visibles.
6. Vérifier que l'IA ne redemande pas email/téléphone après capture.
7. Vérifier que l'IA répond à la demande réelle du visiteur.

## Convention backend

Le backend Olivia doit accepter les deux clés:

- `need`
- `necesidad`

Raison: les sites peuvent être multilingues, mais l'équipe opérationnelle travaille souvent en espagnol. Garder les deux clés évite de perdre l'information selon les vues du Channel Manager.

## Ne pas faire

- Ne pas remplacer le champ besoin par un message libre uniquement après la capture.
- Ne pas redemander le téléphone/email si le lead a déjà été capturé.
- Ne pas stocker le besoin seulement côté frontend.
- Ne pas créer une logique différente par client si le widget commun peut le gérer.
