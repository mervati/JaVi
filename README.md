# JáVi 🎬📺

Aplicativo PWA para acompanhar filmes e séries que você já viu — ou quer ver.

## Funcionalidades

- **Biblioteca pessoal** — adicione filmes e séries com status: Quero ver, Assistindo, Concluído ou Abandonado
- **Continuar assistindo** — carrossel na Home com o próximo episódio de cada série em andamento
- **Aba Séries** — seção "Assistir a Seguir" com próximo episódio; gesto de arrastar para marcar ou arquivar; avanço automático para o próximo ep após marcar
- **Aba Filmes** — lista dividida em "Quero ver" e "Assistidos", com gesto de arrastar para marcar ou abandonar
- **Episódios com checkbox** — estilo personalizado com gradiente verde ao marcar; scroll automático para o próximo episódio
- **Confete ao concluir série** — animação disparada ao assistir todos os episódios
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
- PWA com Service Worker (cache offline de buscas e imagens)
- canvas-confetti
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

## Changelog

### v1.3.0
- `feat` Carrossel "Continuar assistindo" na Home com poster, próximo ep e barra de progresso
- `feat` BottomNav visível em todas as telas (inclusive detalhe de série/filme)
- `feat` Animação de confete ao concluir uma série inteira (`canvas-confetti`)
- `feat` Auto-atualização de status para "Concluído" ao marcar todos os episódios
- `fix` Barra de scroll do main removida visualmente
- `fix` Header JáVi oculto apenas em páginas de detalhe

### v1.2.0
- `feat` Checkbox customizado para episódios e temporadas (gradiente verde, V sempre visível)
- `feat` Avanço automático para o próximo episódio após 1 segundo de check
- `feat` Skeleton shimmer loader nas imagens de poster
- `feat` Pull-to-refresh com indicador visual (iOS e Android)
- `feat` Direction lock no swipe — cancela gesto horizontal durante scroll vertical
- `fix` Pull-to-refresh no iOS via listeners nativos no document

### v1.1.0
- `feat` Swipe-to-delete com undo toast (5 segundos para desfazer)
- `feat` Barra de progresso de episódios por série
- `feat` Episódios restantes exibidos ao lado do próximo ep
- `feat` Calendário inclui séries concluídas e seção "Encerrada"
- `feat` Pill tabs nos filtros de ordenação (Recentes, A-Z, Nota)

### v1.0.0
- `feat` Biblioteca pessoal com Firebase Auth + Firestore
- `feat` Aba Séries com próximo episódio e marcação por swipe
- `feat` Aba Filmes com lista e swipe para marcar/abandonar
- `feat` Busca e Explorar com TMDB API
- `feat` Avaliação por estrelas
- `feat` Perfil com estatísticas
- `feat` PWA com cache offline (Service Worker + Workbox)

## Acesso

Disponível em produção via Vercel.
