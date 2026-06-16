export interface AchievementDef {
  id: string
  name: string
  description: string
  image: string
  tier?: string
  untrackable?: boolean
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'primeiros-passos',
    name: 'Primeiros Passos',
    description: 'Assistiu ao primeiro filme ou episódio',
    image: '/conquistas/primeiros-passos.png',
  },
  {
    id: 'devorador-i',
    name: 'Devorador de Séries',
    description: 'Completou 5 séries',
    image: '/conquistas/devorador-bronze.png',
    tier: 'Bronze',
  },
  {
    id: 'devorador-ii',
    name: 'Devorador de Séries',
    description: 'Completou 20 séries',
    image: '/conquistas/devorador-prata.png',
    tier: 'Prata',
  },
  {
    id: 'devorador-iii',
    name: 'Devorador de Séries',
    description: 'Completou 50 séries',
    image: '/conquistas/devorador-ouro.png',
    tier: 'Ouro',
  },
  {
    id: 'cinefilo',
    name: 'Cinéfilo de Carteirinha',
    description: 'Assistiu a 50 filmes',
    image: '/conquistas/cinefilo-de-carteirinha.png',
  },
  {
    id: 'habito-diario',
    name: 'Hábito Diário',
    description: 'Assistiu por 7 dias seguidos',
    image: '/conquistas/habito-diario.png',
  },
  {
    id: 'sextou',
    name: 'Sextou!',
    description: 'Assistiu algo em uma sexta-feira à noite',
    image: '/conquistas/sextou.png',
  },
  {
    id: 'madrugador',
    name: 'Madrugador',
    description: 'Assistiu entre meia-noite e 5h da manhã',
    image: '/conquistas/madrugador.png',
  },
  {
    id: 'almoco',
    name: 'Almoço com Companhia',
    description: 'Assistiu a algo no horário do almoço',
    image: '/conquistas/almoco-com-companhia.png',
  },
  {
    id: 'fiel-domingo',
    name: 'Fiel ao Domingo',
    description: 'Assistiu por 4 domingos consecutivos',
    image: '/conquistas/fiel-ao-domingo.png',
  },
  {
    id: 'critico-cinema',
    name: 'Crítico de Cinema',
    description: 'Avaliou 10 produções',
    image: '/conquistas/critico-de-cinema.png',
  },
  {
    id: 'planejador',
    name: 'Planejador',
    description: 'Adicionou 15 itens à lista "Quero ver"',
    image: '/conquistas/planejador.png',
  },
  {
    id: 'sem-medo',
    name: 'Sem Medo do Escuro',
    description: 'Assistiu a 5 produções de Terror ou Suspense',
    image: '/conquistas/sem-medo-do-escuro.png',
  },
  {
    id: 'romantico',
    name: 'Romântico Incorrigível',
    description: 'Assistiu a 5 comédias românticas',
    image: '/conquistas/romantico-incorrigivel.png',
  },
  {
    id: 'historiador',
    name: 'Historiador',
    description: 'Assistiu a um documentário ou produção histórica',
    image: '/conquistas/historiador.png',
  },
  {
    id: 'fundo-bau',
    name: 'Do Fundo do Baú',
    description: 'Assistiu a um filme com mais de 25 anos',
    image: '/conquistas/do-fundo-do-bau.png',
  },
  {
    id: 'cidadao-mundo',
    name: 'Cidadão do Mundo',
    description: 'Assistiu a produções de 5 países diferentes',
    image: '/conquistas/cidadao-do-mundo.png',
  },
  {
    id: 'sommelier',
    name: 'Sommelier de Trailer',
    description: 'Assistiu a 5 trailers',
    image: '/conquistas/sommelier-de-trailer.png',
  },
  {
    id: 'volta-passado',
    name: 'De Volta para o Passado',
    description: 'Reassistiu a uma série',
    image: '/conquistas/de-volta-para-o-passado.png',
  },
  {
    id: 'maratonista',
    name: 'Maratonista Olímpico',
    description: '3 episódios da mesma série no mesmo dia',
    image: '/conquistas/maratonista-olimpico.png',
    untrackable: true,
  },
  {
    id: 'sem-olhar',
    name: 'Sem Olhar para Trás',
    description: 'Uma temporada inteira em menos de 48 horas',
    image: '/conquistas/sem-olhar-para-tras.png',
    untrackable: true,
  },
  {
    id: 'indeciso',
    name: 'O Indeciso',
    description: 'Navegou pelo app por mais de 15 minutos',
    image: '/conquistas/o-indeciso.png',
    untrackable: true,
  },
  {
    id: 'dormiu',
    name: 'Dormiu no Ponto',
    description: 'Deixou o app parado por mais de 30 minutos',
    image: '/conquistas/dormiu-no-ponto.png',
    untrackable: true,
  },
]
