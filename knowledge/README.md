# Base documentaire Olivia

Placez les documents approuvés dans `knowledge/<clientCode>/`, puis lancez :

```bash
python scripts/sync_openai_knowledge.py <clientCode>
```

Ajoutez l’identifiant retourné à `OPENAI_VECTOR_STORES_JSON`. Chaque client utilise un vector store séparé afin d’éviter le mélange de connaissances entre marques.
