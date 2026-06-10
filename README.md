# JáVi 🎬📺

Aplicativo PWA para acompanhar filmes e séries que você já viu — ou quer ver.

## Funcionalidades

- **Biblioteca pessoal** — adicione filmes e séries com status: Quero ver, Assistindo, Concluído ou Abandonado
- **Aba Séries** — seção "Assistir a Seguir" com o próximo episódio não assistido; gesto de arrastar para marcar episódio ou arquivar série
- **Aba Filmes** — lista dividida em "Quero ver" e "Assistidos", com gesto de arrastar para marcar como assistido ou abandonado
- **Avaliação por estrelas** — clique ou arraste para dar nota a filmes e séries concluídos
- **Elenco** — veja o elenco completo com foto, nome real e personagem na aba "Sobre" de cada título
- **Perfil** — estatísticas de uso: episódios assistidos, filmes assistidos, tempo total vendo TV e filmes
- **Busca e Explorar** — pesquise qualquer título ou navegue por tendências, mais bem avaliados e lançamentos
- **Login com Google** — autenticação via Firebase

## Tecnologias

- React + TypeScript + Vite
- Tailwind CSS v4
- Firebase Auth + Firestore
- TMDB API
- PWA (Progressive Web App)
- Vercel (deploy automático)

## Como rodar localmente

```bash
npm install
npm run dev
```

Crie um arquivo `.env` com as variáveis:

```
VITE_TMDB_TOKEN=seu_token_aqui
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

## Acesso

Disponível em produção via Vercel.
