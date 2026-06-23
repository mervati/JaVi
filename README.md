# JáVi 🎬📺

![version](https://img.shields.io/badge/version-1.7.4-f5b730?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

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
- **Perfil** — tabs Resumo (estatísticas, listas, notificações) e Conquistas (23 achievements desbloqueáveis com pixel art)
- **Conquistas** — sistema de achievements com critérios automáticos (gêneros TMDB, horário, sequência de dias) e manuais
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

### v1.7.4
- `fix` Altura do container calculada via `window.innerHeight` no resize, corrigindo deslocamento do menu inferior no iOS Safari

### v1.7.3
- `fix` Barra de navegação inferior no iOS: substituído `position:fixed` por `flex-shrink-0` ancorado ao `100dvh`, eliminando o deslocamento inicial no Safari

### v1.7.2
- `fix` Reduz padding da barra de navegação inferior no iOS (`pt-8px pb-2px`) — menos espaço visual acima do safe-area

### v1.7.1
- `fix` Espaçamento excessivo na barra de navegação inferior no iOS — padding assimétrico (`pt-10px pb-6px`) evita sobreposição com safe-area

### v1.7.0
- `feat` Tela de carregamento com logo animado, barra de progresso azul (50% largura) e porcentagem
- `feat` Barra de navegação inferior visível dentro do modal de busca da biblioteca
- `fix` Datas de início/fim registradas automaticamente ao mudar status em séries e filmes

### v1.6.0
- `feat` Busca flutuante na biblioteca — FAB de lupa arrastável em Séries e Filmes, filtra por título, #tag, tipo e status
- `feat` Datas de início e fim — registradas automaticamente ao mudar status; editáveis com seletor nativo na aba Sobre

### v1.5.0
- `feat` Tags customizadas em filmes e séries — crie tags livres na aba "Sobre" e veja como pills nos cards
- `feat` Seção "Arquivadas" em Séries — swipe direito em "Assistir a Seguir" arquiva a série
- `feat` Ordenação de seções por drag-and-drop nos cabeçalhos (Assistir a Seguir, Quero Ver, Todas as Séries, Arquivadas); primeira posição bloqueada
- `fix` Popup de atualização disponível não fecha ao clicar fora — apenas pelos botões "Agora não" e "Atualizar"
- `fix` Input de nova tag com font-size 16px para evitar zoom automático no iOS

### v1.4.4
- `feat` Seções colapsáveis em Séries e Filmes — "Assistir a seguir" e "Quero ver" abertas por padrão, demais recolhidas

### v1.4.3
- `feat` Botão X dentro do campo de busca para limpar o texto com um toque

### v1.4.2
- `feat` Animação de caça-níquel no "Me surpreenda": posters trocam rapidamente e desaceleram até pousar no resultado com pop elástico

### v1.4.1
- `feat` Botão de adicionar ao Google Calendar na aba Calendário de Séries e Filmes
- Séries: abre evento com título, temporada, episódio e data de exibição
- Filmes: abre evento com título e data de estreia nos cinemas

### v1.4.0
- `feat` Sistema de conquistas com 23 achievements desbloqueáveis e pixel art individual
- `feat` Critérios automáticos: gêneros via TMDB (Terror, Romance, Documentário, países), sequência de dias, horário de acesso
- `feat` Critérios manuais: Sommelier de Trailer (5 trailers), De Volta para o Passado (reassistir série), Maratonista, Sem Olhar para Trás, O Indeciso, Dormiu no Ponto
- `feat` Toast global de conquista desbloqueada (aparece em qualquer tela)
- `feat` Conquistas revogáveis: critérios computados são removidos automaticamente se o usuário desfaz a condição
- `feat` Devorador de Séries em 3 tiers com imagens distintas (Bronze, Prata, Ouro)
- `feat` Perfil reorganizado em tabs "Resumo" e "Conquistas"

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
