# Articles

Each article is one `.mdx` file. Filename = slug. Run `npm run articles:sync` to push to DB.

## Frontmatter

```yaml
---
title: "タイトル"
excerpt: "リード文(150文字程度)"
category: interview | profile | tournament | column
authors: 著者名
publishedAt: 2026-05-12
heroImage: https://cdn.example/image.jpg   # optional
taggedPlayers:                              # optional list of player slugs
  - yamada-sho
taggedPros:                                 # optional free-text
  - 西岡 良仁
taggedTournaments:                          # optional list of tournament slugs
  - roanne-challenger-2026
---
```
