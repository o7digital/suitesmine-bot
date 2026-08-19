# Base documentaire Olivia

Placez les documents approuvés dans `knowledge/<clientCode>/`, puis lancez :

```bash
python scripts/sync_openai_knowledge.py <clientCode>
# ou, pour synchroniser tous les clients qui ont un dossier knowledge/<clientCode>/ :
python scripts/sync_openai_knowledge.py --all
```

Le script écrit les identifiants dans `knowledge/vector_stores.json` et affiche le mapping
complet à copier dans `OPENAI_VECTOR_STORES_JSON`. Chaque client utilise un vector store
séparé afin d'éviter le mélange de connaissances entre marques. Relancer le script pour un
client remplace son vector store (le précédent est supprimé) — la synchronisation n'est pas
incrémentale, elle regénère la base de ce client à partir des fichiers présents.

