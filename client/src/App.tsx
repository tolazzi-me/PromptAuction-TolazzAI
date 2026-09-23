import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  ChevronLeft,
  CircleHelp,
  Coins,
  Compass,
  Eye,
  Flame,
  Gavel,
  Gauge,
  Info,
  Layers,
  Library,
  Lightbulb,
  LockKeyhole,
  RotateCcw,
  Skull,
  Sparkles,
  Swords,
  Target,
  TriangleAlert,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";

type IconComponent = ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;
type Phase = "auction" | "thinking" | "result" | "gameover";
type Winner = "player" | "cpu" | "tie";

type Task = {
  id: string;
  eyebrow: string;
  title: string;
  brief: string;
  audience: string;
  signal: string;
  tip: string;
  accent: string;
  synergyOptions: {
    label: string;
    tags: string[];
    bonus: number;
    note: string;
  }[];
};

type Card = {
  id: string;
  label: string;
  type: string;
  description: string;
  cost: number;
  quality: number;
  tags: string[];
  symbol: string;
  liveCost?: number;
  trap?: boolean;
};

type Personality = {
  name: string;
  title: string;
  detail: string;
  icon: IconComponent;
  color: string;
};

type RoundState = {
  round: number;
  task: Task;
  market: Card[];
  synergy: Task["synergyOptions"][number];
  personality: Personality;
  playerBudget: number;
  cpuBudget: number;
  cpuPlan: string[];
};

type SpecialSynergy = {
  label: string;
  bonus: number;
  note: string;
};

type Evaluation = {
  cards: Card[];
  spent: number;
  baseQuality: number;
  focusBonus: number;
  trapPenalty: number;
  redundancyPenalty: number;
  redundantTypes: string[];
  synergyBonus: number;
  specialSynergy: SpecialSynergy | null;
  specialSynergies: SpecialSynergy[];
  discoveredLibraryIds: string[];
  quality: number;
  efficiency: number;
  matchedTags: string[];
};

type RoundResult = {
  player: Evaluation;
  cpu: Evaluation;
  winner: Winner;
  synergy: Task["synergyOptions"][number];
};

type LibrarySynergy = {
  id: string;
  label: string;
  category: string;
  requirement: string;
  detail: string;
  bonus: number;
  matches: (cards: Card[], task: Task, taskSynergyActive: boolean) => boolean;
};

const TOTAL_ROUNDS = 5;
const MAX_WALLET = 35;

const TASKS: Task[] = [
  {
    id: "apology",
    eyebrow: "MENSAGEM DELICADA",
    title: "Pedir desculpas por um atraso",
    brief:
      "Escreva uma mensagem sincera para uma pessoa cliente explicando um atraso de dois dias sem soar como desculpa esfarrapada.",
    audience: "Cliente frustrado · WhatsApp",
    signal: "clareza + empatia",
    tip: "Um bom prompt define o contexto e o tom antes de pedir a resposta.",
    accent: "orange",
    synergyOptions: [
      {
        label: "Empatia contextual",
        tags: ["context", "empathy"],
        bonus: 13,
        note: "Contexto + empatia desbloqueiam uma resposta mais humana.",
      },
      {
        label: "Reparo concreto",
        tags: ["repair", "specific"],
        bonus: 15,
        note: "Um próximo passo específico faz a promessa parecer crível.",
      },
    ],
  },
  {
    id: "slogan",
    eyebrow: "CRIATIVIDADE",
    title: "Criar um slogan para um café",
    brief:
      "Crie cinco slogans curtos para uma cafeteria de bairro que quer parecer acolhedora, autoral e memorável.",
    audience: "Marca local · Instagram",
    signal: "restrição + voz",
    tip: "Restrições bem escolhidas (quantidade, tamanho e público) alimentam a criatividade.",
    accent: "blue",
    synergyOptions: [
      {
        label: "Voz memorável",
        tags: ["creative", "tone"],
        bonus: 14,
        note: "Uma voz clara combinada com uma faísca criativa gera slogans distintos.",
      },
      {
        label: "Formato comparável",
        tags: ["structure", "brief"],
        bonus: 11,
        note: "Estruturar alternativas torna a escolha final mais rápida.",
      },
    ],
  },
  {
    id: "summary",
    eyebrow: "SÍNTESE",
    title: "Resumir um texto longo",
    brief:
      "Resuma um relatório de 12 páginas para uma diretoria ocupada, preservando decisões, números e riscos em até 120 palavras.",
    audience: "Diretoria · Memo interno",
    signal: "prioridade + limite",
    tip: "Diga para quem é a resposta e o que não pode ser perdido. Isso vale mais do que pedir apenas 'resuma'.",
    accent: "purple",
    synergyOptions: [
      {
        label: "Sinal executivo",
        tags: ["structure", "evidence"],
        bonus: 12,
        note: "Estrutura + evidência mantém a síntese curta sem ficar rasa.",
      },
      {
        label: "Filtro de corte",
        tags: ["constraint", "specific"],
        bonus: 14,
        note: "Um limite específico ajuda a IA a decidir o que cabe.",
      },
    ],
  },
  {
    id: "vacation",
    eyebrow: "PERSUASÃO",
    title: "Convencer a chefia a dar férias",
    brief:
      "Monte um pedido profissional de férias mostrando planejamento, cobertura da equipe e o ganho de produtividade no retorno.",
    audience: "Gestor direto · E-mail",
    signal: "argumento + prova",
    tip: "Pedidos persuasivos ficam mais fortes quando antecipam objeções e oferecem um plano concreto.",
    accent: "green",
    synergyOptions: [
      {
        label: "Caso irrefutável",
        tags: ["evidence", "context"],
        bonus: 15,
        note: "Dados + contexto transformam um desejo em uma proposta defensável.",
      },
      {
        label: "Plano sem atrito",
        tags: ["repair", "structure"],
        bonus: 12,
        note: "Uma estrutura de cobertura reduz o risco percebido pela chefia.",
      },
    ],
  },
  {
    id: "feedback",
    eyebrow: "LIDERANÇA",
    title: "Dar feedback positivo",
    brief:
      "Escreva um feedback que reconheça uma entrega excelente, cite um comportamento observável e incentive o próximo passo.",
    audience: "Pessoa do time · 1:1",
    signal: "especificidade + cuidado",
    tip: "Feedback útil troca adjetivos vagos por exemplos observáveis e uma direção de crescimento.",
    accent: "pink",
    synergyOptions: [
      {
        label: "Reconhecimento real",
        tags: ["empathy", "specific"],
        bonus: 13,
        note: "Cuidado + especificidade fazem o elogio soar merecido.",
      },
      {
        label: "Próximo degrau",
        tags: ["context", "creative"],
        bonus: 12,
        note: "Contexto e uma visão de futuro transformam elogio em desenvolvimento.",
      },
    ],
  },
  {
    id: "ex-recado",
    eyebrow: "CONSTRANGIMENTO",
    title: "Explicar para a sogra por que o Wi-Fi caiu",
    brief:
      "Escreva uma explicação técnica-mas-compreensível de por que a internet caiu no almoço de domingo, sem admitir que você desligou o roteador para jogar.",
    audience: "Sogra desconfiada · Grupo da família",
    signal: "clareza + tom",
    tip: "Quando o público não é técnico, o prompt precisa dizer o nível de linguagem esperado.",
    accent: "orange",
    synergyOptions: [
      {
        label: "Diplomacia doméstica",
        tags: ["empathy", "tone"],
        bonus: 13,
        note: "Empatia com o tom certo evita virar assunto de Natal.",
      },
      {
        label: "Versão oficial",
        tags: ["context", "structure"],
        bonus: 12,
        note: "Contexto organizado faz qualquer desculpa parecer laudo técnico.",
      },
    ],
  },
  {
    id: "bio-app",
    eyebrow: "AUTOPROMOÇÃO",
    title: "Escrever uma bio de app de encontros",
    brief:
      "Crie três bios de até 140 caracteres que soem espirituosas, honestas e não mencionem 'amo viajar e comer bem'.",
    audience: "Pessoas estranhas · Perfil público",
    signal: "restrição + voz",
    tip: "Proibir clichês dentro do prompt é uma restrição criativa poderosa.",
    accent: "pink",
    synergyOptions: [
      {
        label: "Charme calibrado",
        tags: ["creative", "tone"],
        bonus: 14,
        note: "Criatividade com voz própria vence frase pronta.",
      },
      {
        label: "Curto e afiado",
        tags: ["constraint", "specific"],
        bonus: 13,
        note: "Limite de caracteres força cada palavra a trabalhar.",
      },
    ],
  },
  {
    id: "gato-ata",
    eyebrow: "BUROCRACIA ABSURDA",
    title: "Redigir a ata de reunião do meu gato",
    brief:
      "Transforme 'o gato dormiu 14 horas e derrubou um copo' em uma ata corporativa formal com pauta, deliberações e próximos passos.",
    audience: "Conselho felino · Documento oficial",
    signal: "estrutura + humor",
    tip: "Contraste de registro (assunto bobo + formato sério) é ouro para prompts criativos.",
    accent: "purple",
    synergyOptions: [
      {
        label: "Solenidade absurda",
        tags: ["structure", "creative"],
        bonus: 15,
        note: "Formato rígido aplicado a conteúdo tolo gera o humor.",
      },
      {
        label: "Pauta impecável",
        tags: ["structure", "brief"],
        bonus: 12,
        note: "Formato explícito mantém a piada legível.",
      },
    ],
  },
  {
    id: "audio-desculpa",
    eyebrow: "CRIME DIGITAL",
    title: "Justificar um áudio de 9 minutos no grupo",
    brief:
      "Escreva uma mensagem curta defendendo por que você mandou um áudio de 9 minutos no grupo do trabalho às 23h, e resuma o conteúdo em 3 linhas para quem não vai ouvir.",
    audience: "Colegas irritados · Grupo do trabalho",
    signal: "constraint + empathy",
    tip: "Pedir o resumo junto com o texto ensina que o prompt pode exigir dois formatos na mesma resposta.",
    accent: "green",
    synergyOptions: [
      {
        label: "Pedido de perdão eficiente",
        tags: ["empathy", "constraint"],
        bonus: 14,
        note: "Assumir o erro em poucas palavras vale mais que nove minutos de explicação.",
      },
      {
        label: "TL;DR salvador",
        tags: ["structure", "specific"],
        bonus: 13,
        note: "Um resumo estruturado recupera a atenção de quem já pulou o áudio.",
      },
    ],
  },
];

const CARDS: Card[] = [
  {
    id: "persona",
    label: "Definir persona",
    type: "PERSONA",
    description: "Define quem a IA deve interpretar ao responder.",
    cost: 3,
    quality: 9,
    tags: ["audience", "context"],
    symbol: "◍",
  },
  {
    id: "task",
    label: "Tarefa explícita",
    type: "TAREFA",
    description: "Diz com precisão o que a IA deve fazer.",
    cost: 2,
    quality: 9,
    tags: ["brief", "specific"],
    symbol: "◆",
  },
  {
    id: "audience",
    label: "Definir público",
    type: "PÚBLICO",
    description: "Adapta a resposta a quem realmente vai ler.",
    cost: 2,
    quality: 8,
    tags: ["context", "audience"],
    symbol: "◌",
  },
  {
    id: "context",
    label: "Contexto pessoal",
    type: "CONTEXTO",
    description: "Quem fala, para quem e em qual situação.",
    cost: 3,
    quality: 8,
    tags: ["context"],
    symbol: "◎",
  },
  {
    id: "instruction",
    label: "Instrução detalhada",
    type: "INSTRUÇÃO",
    description:
      "Diz explicitamente o que a IA deve fazer com o material recebido.",
    cost: 2,
    quality: 8,
    tags: ["brief"],
    symbol: "⬟",
  },
  {
    id: "instruction-2",
    label: "Instrução do que fazer",
    type: "INSTRUÇÃO",
    description:
      "Diz explicitamente o que a IA deve fazer com o material recebido.",
    cost: 2,
    quality: 8,
    tags: ["brief"],
    symbol: "⬟",
  },
  {
    id: "instruction-3",
    label: "Instrução final do que fazer",
    type: "INSTRUÇÃO",
    description: "Diz explicitamente o que a IA deve fazer.",
    cost: 3,
    quality: 9,
    tags: ["brief"],
    symbol: "⬟",
  },
  {
    id: "instruction-4",
    label: "Da uma instrução para a IA ao pé da letra",
    type: "INSTRUÇÃO",
    description: "Diz explicitamente o que a IA deve fazer.",
    cost: 3,
    quality: 9,
    tags: ["brief"],
    symbol: "⬟",
  },
  {
    id: "objective",
    label: "Objetivo explícito",
    type: "DIREÇÃO",
    description: "Nomeia o resultado que o prompt precisa gerar.",
    cost: 2,
    quality: 8,
    tags: ["brief", "specific"],
    symbol: "↗",
  },
  {
    id: "tone",
    label: "Tom amigável",
    type: "TOM",
    description: "Deixa a linguagem acessível e próxima.",
    cost: 2,
    quality: 7,
    tags: ["tone", "empathy"],
    symbol: "~",
  },
  {
    id: "formal",
    label: "Tom formal",
    type: "TOM",
    description: "Escolha segura para contextos profissionais.",
    cost: 1,
    quality: 6,
    tags: ["tone"],
    symbol: "▱",
  },
  {
    id: "empathy",
    label: "Demonstrar empatia",
    type: "TOM",
    description: "Reconhece sentimentos sem exagerar na emoção.",
    cost: 3,
    quality: 9,
    tags: ["empathy", "tone"],
    symbol: "♡",
  },
  {
    id: "apology",
    label: "Pedir desculpas",
    type: "INTENÇÃO",
    description: "Assume responsabilidade de forma direta.",
    cost: 2,
    quality: 8,
    tags: ["empathy", "brief"],
    symbol: "↺",
  },
  {
    id: "reason",
    label: "Explicar o motivo",
    type: "EVIDÊNCIA",
    description: "Evita que a resposta pareça vaga ou evasiva.",
    cost: 3,
    quality: 8,
    tags: ["context", "evidence"],
    symbol: "∵",
  },
  {
    id: "repair",
    label: "Oferecer reparo",
    type: "AÇÃO",
    description: "Propõe um próximo passo que recupera confiança.",
    cost: 4,
    quality: 10,
    tags: ["repair", "specific"],
    symbol: "✦",
  },
  {
    id: "task-2",
    label: "Tarefa Criativa",
    type: "TAREFA",
    description: "Diz com precisão o que a IA deve fazer.",
    cost: 3,
    quality: 9,
    tags: ["brief", "specific"],
    symbol: "◆",
  },
  {
    id: "task-3",
    label: "Tarefa Guiada",
    type: "TAREFA",
    description: "Diz com precisão o que a IA deve fazer.",
    cost: 3,
    quality: 8,
    tags: ["brief", "specific"],
    symbol: "◆",
  },
  {
    id: "promise",
    label: "Prometer melhora",
    type: "AÇÃO",
    description: "Aponta como o problema não vai se repetir.",
    cost: 4,
    quality: 7,
    tags: ["repair", "brief"],
    symbol: "↑",
  },
  {
    id: "specific",
    label: "Exemplo concreto",
    type: "EXEMPLO",
    description: "Troca abstração por uma cena ou frase real.",
    cost: 2,
    quality: 10,
    tags: ["specific", "evidence", "example"],
    symbol: "▣",
  },
  {
    id: "numbers",
    label: "Dados e números",
    type: "EVIDÊNCIA",
    description: "Adiciona provas, limites ou métricas.",
    cost: 4,
    quality: 10,
    tags: ["evidence", "constraint"],
    symbol: "#",
  },
  {
    id: "constraint",
    label: "Limite de tamanho",
    type: "RESTRIÇÃO",
    description: "Define o tamanho máximo da resposta.",
    cost: 2,
    quality: 9,
    tags: ["constraint", "brief"],
    symbol: "⌁",
  },
  {
    id: "format",
    label: "Formato de saída",
    type: "FORMATO",
    description: "Pede lista, tabela, passos ou alternativas.",
    cost: 3,
    quality: 9,
    tags: ["structure", "brief"],
    symbol: "≡",
  },
  {
    id: "short",
    label: "Ser breve",
    type: "RESTRIÇÃO",
    description: "Corta desvios e acelera a leitura.",
    cost: 2,
    quality: 7,
    tags: ["constraint"],
    symbol: "·",
  },
  {
    id: "detail",
    label: "Pedir detalhamento",
    type: "RESTRIÇÃO",
    description: "Aumenta a profundidade quando há espaço.",
    cost: 4,
    quality: 8,
    tags: ["constraint", "evidence"],
    symbol: "⊹",
  },
  {
    id: "creative",
    label: "Faísca criativa",
    type: "CRIATIVIDADE",
    description: "Convida a explorar uma ideia menos óbvia.",
    cost: 3,
    quality: 9,
    tags: ["creative"],
    symbol: "✹",
  },
  {
    id: "humor",
    label: "Humor leve",
    type: "TOM",
    description: "Coloca personalidade sem perder o foco.",
    cost: 3,
    quality: 6,
    tags: ["creative", "tone"],
    symbol: "☼",
  },
  {
    id: "phrase",
    label: "Frase de efeito",
    type: "CRIATIVIDADE",
    description: "Fecha com uma formulação fácil de lembrar.",
    cost: 4,
    quality: 8,
    tags: ["creative", "specific"],
    symbol: "❝",
  },
  {
    id: "alternatives",
    label: "Gerar alternativas",
    type: "ESTRUTURA",
    description: "Cria opções para comparar antes de decidir.",
    cost: 3,
    quality: 9,
    tags: ["structure", "creative"],
    symbol: "⑂",
  },
  {
    id: "steps",
    label: "Passo a passo",
    type: "ESTRUTURA",
    description: "Organiza a resposta em uma sequência útil.",
    cost: 3,
    quality: 8,
    tags: ["structure"],
    symbol: "1",
  },
  {
    id: "greeting",
    label: "Saudação",
    type: "FORMATO",
    description: "Abre a mensagem com intenção clara.",
    cost: 1,
    quality: 5,
    tags: ["tone", "brief"],
    symbol: "⌂",
  },
  {
    id: "farewell",
    label: "Formato de despedida",
    type: "FORMATO",
    description: "Fecha o texto com cuidado e direção.",
    cost: 1,
    quality: 5,
    tags: ["tone"],
    symbol: "↳",
  },
  {
    id: "subject",
    label: "Formato de 'Título de e-mail'",
    type: "FORMATO",
    description: "Dá contexto antes mesmo da leitura.",
    cost: 2,
    quality: 8,
    tags: ["brief", "specific"],
    symbol: "▤",
  },
  {
    id: "role",
    label: "Dar um papel",
    type: "DIREÇÃO",
    description: "Define a perspectiva ou experiência desejada.",
    cost: 2,
    quality: 8,
    tags: ["brief", "context"],
    symbol: "◈",
  },
  {
    id: "criteria",
    label: "Critérios de sucesso",
    type: "DIREÇÃO",
    description: "Mostra como reconhecer uma boa resposta.",
    cost: 3,
    quality: 10,
    tags: ["specific", "constraint"],
    symbol: "✓",
  },
  {
    id: "professional",
    label: "Linguagem técnica",
    type: "TOM",
    description: "Usa vocabulário preciso para o contexto.",
    cost: 2,
    quality: 7,
    tags: ["tone", "specific"],
    symbol: "⌬",
  },
  {
    id: "urgent",
    label: "Tom urgente",
    type: "TOM",
    description: "Aumenta o senso de prioridade.",
    cost: 3,
    quality: 6,
    tags: ["tone", "brief"],
    symbol: "!",
  },
  {
    id: "praise",
    label: "Elogiar a pessoa",
    type: "INTENÇÃO",
    description: "Começa pela contribuição antes do pedido.",
    cost: 3,
    quality: 8,
    tags: ["empathy", "tone"],
    symbol: "✧",
  },
  {
    id: "reward",
    label: "Oferecer recompensa",
    type: "AÇÃO",
    description: "Cria um incentivo tangível para agir.",
    cost: 5,
    quality: 9,
    tags: ["repair", "creative"],
    symbol: "$",
  },
  {
    id: "objection",
    label: "Antecipar objeções",
    type: "ESTRATÉGIA",
    description: "Responde às dúvidas antes que apareçam.",
    cost: 4,
    quality: 10,
    tags: ["evidence", "context"],
    symbol: "◫",
  },
  {
    id: "tradeoff",
    label: "Explicar trade-off",
    type: "ESTRATÉGIA",
    description: "Deixa escolhas e limites transparentes.",
    cost: 3,
    quality: 9,
    tags: ["evidence", "specific"],
    symbol: "⇄",
  },
  {
    id: "voice",
    label: "Voz da marca",
    type: "TOM",
    description: "Mantém a personalidade reconhecível.",
    cost: 3,
    quality: 9,
    tags: ["tone", "creative"],
    symbol: "◉",
  },
  {
    id: "example",
    label: "Exemplo de referência",
    type: "EXEMPLO",
    description: "Mostra à IA o padrão, estilo ou resultado desejado.",
    cost: 3,
    quality: 10,
    tags: ["specific", "creative", "example"],
    symbol: "▧",
  },
  {
    id: "example-2",
    label: "Segundo exemplo",
    type: "EXEMPLO",
    description: "Adiciona uma segunda demonstração para revelar um padrão.",
    cost: 2,
    quality: 10,
    tags: ["specific", "creative", "example"],
    symbol: "▤",
  },
  {
    id: "quote",
    label: "Citar frase-chave",
    type: "EVIDÊNCIA",
    description: "Protege uma ideia que não pode sumir.",
    cost: 2,
    quality: 8,
    tags: ["evidence", "brief"],
    symbol: "❞",
  },
  {
    id: "decision",
    label: "Destacar decisões",
    type: "ESTRUTURA",
    description: "Puxa o que precisa virar ação.",
    cost: 3,
    quality: 10,
    tags: ["structure", "specific"],
    symbol: "◆",
  },
  {
    id: "risk",
    label: "Sinalizar riscos",
    type: "ESTRATÉGIA",
    description: "Expõe incertezas para evitar surpresa.",
    cost: 3,
    quality: 9,
    tags: ["evidence", "context"],
    symbol: "△",
  },
  {
    id: "length",
    label: "Limite de palavras",
    type: "RESTRIÇÃO",
    description: "Torna o pedido verificável.",
    cost: 2,
    quality: 8,
    tags: ["constraint", "specific"],
    symbol: "↔",
  },
  {
    id: "language",
    label: "Definir idioma",
    type: "DIREÇÃO",
    description: "Evita variações de linguagem fora do contexto.",
    cost: 1,
    quality: 6,
    tags: ["brief"],
    symbol: "文",
  },
  {
    id: "auditable",
    label: "Pedir justificativa",
    type: "DIREÇÃO",
    description: "Solicita o porquê por trás das escolhas.",
    cost: 4,
    quality: 9,
    tags: ["evidence", "specific"],
    symbol: "?",
  },
  {
    id: "friendly",
    label: "Acolhimento",
    type: "TOM",
    description: "Reduz fricção em uma conversa difícil.",
    cost: 2,
    quality: 8,
    tags: ["empathy"],
    symbol: "⌣",
  },
  {
    id: "priority",
    label: "Ordenar prioridades",
    type: "ESTRUTURA",
    description: "Diz o que vem primeiro quando tudo importa.",
    cost: 3,
    quality: 10,
    tags: ["structure", "constraint"],
    symbol: "≣",
  },
  {
    id: "callout",
    label: "Call to action",
    type: "AÇÃO",
    description: "Termina com a próxima ação desejada.",
    cost: 2,
    quality: 8,
    tags: ["repair", "brief"],
    symbol: "→",
  },
  {
    id: "review",
    label: "Pedir revisão",
    type: "DIREÇÃO",
    description: "Convida a checar a resposta antes de entregar.",
    cost: 3,
    quality: 9,
    tags: ["specific", "structure"],
    symbol: "↻",
  },
  {
    id: "self_eval",
    label: "Autoavaliação",
    type: "QUALIDADE",
    description:
      "Pede que a IA avalie criticamente a própria resposta que ela enviou anteriormente.",
    cost: 4,
    quality: 10,
    tags: ["structure", "specific", "evidence"],
    symbol: "⚖",
  },
  {
    id: "self_eval-2",
    label: "AutoCrítica",
    type: "QUALIDADE",
    description: "Pede que a IA avalie sua resposta.",
    cost: 4,
    quality: 10,
    tags: ["structure", "specific", "evidence"],
    symbol: "⚖",
  },
  {
    id: "positive_frame",
    label: "Foco Positivo",
    type: "POSITIVO",
    description:
      "Diga à IA o que fazer. Evitar a palavra 'não' e proibições reduz confusão e alucinações.",
    cost: 1,
    quality: 8,
    tags: ["constraint", "specific"],
    symbol: "⊕",
  },
  {
    id: "chain_of_thought",
    label: "Cadeia de Pensamento",
    type: "ESTRATÉGIA",
    description:
      "Pede que a IA construa o raciocínio passo a passo antes de dar a resposta final.",
    cost: 5,
    quality: 12,
    tags: ["structure", "detail", "evidence"],
    symbol: "∴",
  },
  {
    id: "chain_of_thought-2",
    label: "Cadeia de Pensamento",
    type: "ESTRATÉGIA",
    description:
      "Pede que a IA construa o raciocínio passo a passo antes de dar a resposta final.",
    cost: 5,
    quality: 12,
    tags: ["structure", "detail", "evidence"],
    symbol: "∴",
  },
  {
    id: "chaining",
    label: "Encadeamento",
    type: "ESTRATÉGIA",
    description: "Reaproveita a resposta anterior para encadear etapas.",
    cost: 3,
    quality: 10,
    tags: ["structure", "detail", "evidence"],
    symbol: "⟿",
  },
  {
    id: "chaining-2",
    label: "Encadeamento de prompt",
    type: "ESTRATÉGIA",
    description: "Reaproveita a resposta anterior para gerar mais conteúdo.",
    cost: 3,
    quality: 10,
    tags: ["structure", "detail", "evidence"],
    symbol: "⟿",
  },
  {
    id: "chaining-3",
    label: "Encadeamento de prompt",
    type: "ESTRATÉGIA",
    description: "Reaproveita a resposta anterior para gerar mais conteúdo.",
    cost: 3,
    quality: 10,
    tags: ["structure", "detail", "evidence"],
    symbol: "⟿",
  },
  {
    id: "trap-creative",
    label: "Seja criativo",
    type: "VAGO",
    description: "Pede para a IA ser criativa.",
    cost: 4,
    quality: 2,
    tags: [],
    symbol: "✧",
    trap: true,
  },
  {
    id: "trap-best",
    label: "Faça o melhor possível",
    type: "VAGO",
    description:
      "Pede para a IA fazer bem, lembrando que qualquer saída serve.",
    cost: 4,
    quality: 2,
    tags: [],
    symbol: "☆",
    trap: true,
  },
  {
    id: "trap-notlong",
    label: "Não seja muito longo",
    type: "VAGO",
    description: "Proíbe a IA de fazer um texto grande.",
    cost: 3,
    quality: 2,
    tags: [],
    symbol: "≁",
    trap: true,
  },
  {
    id: "trap-understand",
    label: "Você entendeu, né?",
    type: "VAGO",
    description: "Pede para IA entender o que você disse.",
    cost: 4,
    quality: 2,
    tags: [],
    symbol: "¿",
    trap: true,
  },
  {
    id: "trap-professional",
    label: "Deixe profissional",
    type: "VAGO",
    description: "Adjetivo genérico pedindo para deixar profissional.",
    cost: 3,
    quality: 2,
    tags: [],
    symbol: "◇",
    trap: true,
  },
  // --- RAG & DOCUMENTOS ---
  {
    id: "rag_table",
    label: "Anexar Tabela de Dados",
    type: "RAG",
    description: "Fornece dados tabulares estruturados como fonte da verdade.",
    cost: 3,
    quality: 10,
    tags: ["rag", "evidence", "specific"],
    symbol: "⛁",
  },
  {
    id: "rag_source",
    label: "Referenciar Fonte Confiável",
    type: "RAG",
    description: "Instrui o modelo a citar e embasar respostas em fontes validadas.",
    cost: 3,
    quality: 9,
    tags: ["rag", "evidence", "context"],
    symbol: "§",
  },
  {
    id: "rag_legacy",
    label: "Trecho de Código Legado",
    type: "RAG",
    description: "Anexa código ou documentação técnica como contexto de referência.",
    cost: 4,
    quality: 11,
    tags: ["rag", "specific", "brief"],
    symbol: "☷",
  },
  // --- GUARDRAILS & SEGURANÇA ---
  {
    id: "guardrail_jailbreak",
    label: "Anti-Jailbreak",
    type: "SEGURANÇA",
    description: "Impede o desvio de persona e tentativas de contornar instruções.",
    cost: 3,
    quality: 10,
    tags: ["safety", "constraint"],
    symbol: "🛡",
  },
  {
    id: "guardrail_bias",
    label: "Filtro de Viés",
    type: "SEGURANÇA",
    description: "Garante neutralidade, diversidade e conformidade ética na resposta.",
    cost: 2,
    quality: 8,
    tags: ["safety", "tone", "constraint"],
    symbol: "⛨",
  },
  {
    id: "guardrail_negative",
    label: "Instrução Negativa Explícita",
    type: "SEGURANÇA",
    description: "Define o que a IA NUNCA deve mencionar, assumir ou inventar.",
    cost: 2,
    quality: 9,
    tags: ["safety", "constraint", "specific"],
    symbol: "⌧",
  },
  // --- TOOL USE & FUNCTION CALLING ---
  {
    id: "tool_api",
    label: "Declaração de API",
    type: "TOOLS",
    description: "Estrutura a resposta como um schema/payload de chamada de API externa.",
    cost: 4,
    quality: 11,
    tags: ["tool", "structure", "specific"],
    symbol: "⌬",
  },
  {
    id: "tool_external",
    label: "Chamada de Ferramenta Externa",
    type: "TOOLS",
    description: "Permite à IA delegar buscas ou cálculos para ferramentas auxiliares.",
    cost: 3,
    quality: 10,
    tags: ["tool", "evidence", "brief"],
    symbol: "⚙",
  },
  // --- TÉCNICAS DE RACIOCÍNIO AVANÇADO ---
  {
    id: "reasoning_tot",
    label: "Tree of Thoughts (ToT)",
    type: "RACIOCÍNIO",
    description: "Explora múltiplos caminhos de raciocínio e ramos de decisão antes de concluir.",
    cost: 5,
    quality: 13,
    tags: ["reasoning", "structure", "evidence"],
    symbol: "⑂",
  },
  {
    id: "reasoning_devil",
    label: "Advogado do Diabo",
    type: "RACIOCÍNIO",
    description: "Simula contra-argumentos e cenários adversos para testar a robustez.",
    cost: 4,
    quality: 11,
    tags: ["reasoning", "evidence", "context"],
    symbol: "⚖",
  },
  {
    id: "reasoning_step",
    label: "Refinamento Passo a Passo",
    type: "RACIOCÍNIO",
    description: "Subdivide a execução em micro-etapas iterativas com checagem de qualidade.",
    cost: 3,
    quality: 10,
    tags: ["reasoning", "structure", "specific"],
    symbol: "↻",
  },
];

const PERSONALITIES: Personality[] = [
  {
    name: "Íris",
    title: "econômica",
    detail: "Compra só o que entrega mais valor por moeda.",
    icon: Gauge,
    color: "green",
  },
  {
    name: "Nexo",
  title: "estrategista",
    detail: "Lê os sinais da tarefa e caça sinergias.",
    icon: Target,
    color: "blue",
  },
  {
    name: "Bia",
    title: "caótica",
    detail: "Confia no instinto e gasta sem olhar para trás.",
    icon: Zap,
    color: "orange",
  },
  {
    name: "Ares",
    title: "BOSS",
    detail:
      "Um oponente implacável com 20 pontos de vantagem nativa em cada rodada por ser uma LLM.",
    icon: Flame,
    color: "red",
  },
];

const SKULL_PERSONALITY: Personality = {
  name: "Skull",
  title: "ANOMALIA",
  detail:
    "Uma força insondável com 40 pontos de vantagem nativa em cada rodada.",
  icon: Skull,
  color: "black",
};

const TIPS = [
  "Gastar pouco, mas certo, costuma vencer gastar muito errado.",
  "Qualidade é importante; eficiência é qualidade por moeda.",
  "Contexto, público e objetivo são a fundação de qualquer prompt.",
  "Uma restrição boa reduz ambiguidade sem bloquear a criatividade.",
];

const hasTag = (cards: Card[], tag: string) =>
  cards.some(card => card.tags.includes(tag));
const hasTags = (cards: Card[], tags: string[]) =>
  tags.every(tag => hasTag(cards, tag));
const hasTypes = (cards: Card[], types: string[]) =>
  types.every(type => cards.some(card => card.type === type));

/** Tipos cuja repetição é intencional e já premiada por sinergias próprias. */
const REDUNDANCY_EXEMPT = new Set([
  "EXEMPLO",
  "ESTRATÉGIA",
  "QUALIDADE",
  "RAG",
  "SEGURANÇA",
  "TOOLS",
  "RACIOCÍNIO",
]);

/** Conta apenas as repetições realmente penalizáveis. */
function getRedundantTypes(cards: Card[]) {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (REDUNDANCY_EXEMPT.has(card.type)) continue;
    counts.set(card.type, (counts.get(card.type) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .flatMap(([type, count]) => Array(count - 1).fill(type) as string[]);
}

const LIBRARY_SYNERGIES: LibrarySynergy[] = [
  {
    id: "one-shot",
    label: "One-shot",
    category: "EXEMPLOS",
    requirement: "1 carta de Exemplo",
    detail: "Um exemplo concreto mostra à IA o padrão ou estilo desejado.",
    bonus: 10,
    matches: cards =>
      cards.filter(card => card.tags.includes("example")).length === 1,
  },
  {
    id: "few-shot",
    label: "Few-shot",
    category: "EXEMPLOS",
    requirement: "2 ou mais cartas de Exemplo",
    detail:
      "Vários exemplos ajudam a IA a inferir um padrão com mais segurança.",
    bonus: 18,
    matches: cards =>
      cards.filter(card => card.tags.includes("example")).length > 1,
  },
  {
    id: "pitaco",
    label: "Método PITACO",
    category: "LENDÁRIO",
    requirement: "Persona + Instrução + Tarefa + Público + Contexto + Formato",
    detail:
      "Os seis pilares cobrem quem responde, o que fazer, qual a tarefa, para quem, em que situação e em qual formato de saída.",
    bonus: 55,
    matches: cards =>
      hasTypes(cards, [
        "PERSONA",
        "INSTRUÇÃO",
        "TAREFA",
        "PÚBLICO",
        "CONTEXTO",
        "FORMATO",
      ]),
  },
  {
    id: "vague-trap",
    label: "Armadilha da vagueza",
    category: "ARMADILHA",
    requirement: "Qualquer carta VAGO no prompt",
    detail:
      "Adjetivos sem critério ('criativo', 'profissional', 'o melhor possível') custam caro e não guiam nada. Cada uma delas derruba a qualidade do prompt.",
    bonus: -5,
    matches: cards =>
      cards.some(card => card.trap || card.type.toUpperCase() === "VAGO"),
  },
  {
    id: "redundancy",
    label: "Redundância",
    category: "ARMADILHA",
    requirement: "2 cartas do mesmo tipo sem sinergia",
    detail:
      "Dois TOMs ou dois FORMATOS competindo entre si criam instruções contraditórias. A IA escolhe uma e ignora a outra — você pagou pelas duas. Exemplos e Estratégias são exceção: ali repetir é técnica.",
    bonus: -15,
    matches: cards => getRedundantTypes(cards).length > 0,
  },
  {
    id: "chaining-multi",
    label: "Encadeamento de Prompt",
    category: "ESTRATÉGIA",
    requirement: "1 ou mais cartas de Encadeamento + 1 outro card",
    detail:
      "O encadeamento de prompt parte da resposta anterior. Escolhido com pelo menos 1 outro card qualquer, cada encadeamento acumula +10 de qualidade.",
    bonus: 10,
    matches: cards => {
      const cCount = cards.filter(card =>
        card.id.startsWith("chaining")
      ).length;
      return cCount > 0 && cards.length > cCount;
    },
  },

  {
    id: "self-eval-critique",
    label: "Autoavaliação e Crítica",
    category: "QUALIDADE",
    requirement: "1 carta de Autoavaliação",
    detail:
      "Forçar a IA a revisar criticamente a própria resposta antes de entregá-la reduz erros e alucinações.",
    bonus: 15,
    matches: cards => cards.some(card => card.id.startsWith("self_eval")),
  },
  {
    id: "cot-reasoning",
    label: "Chain of Thought (CoT)",
    category: "ESTRATÉGIA",
    requirement: "1 carta de Cadeia de Pensamento",
    detail:
      "Obrigar a IA a descrever sua lógica antes do resultado final previne erros matemáticos e alucinações complexas.",
    bonus: 20,
    matches: cards =>
      cards.some(card => card.id.startsWith("chain_of_thought")),
  },
  {
    id: "task-synergy",
    label: "Sinergia da tarefa",
    category: "RODADA",
    requirement: "Combinação secreta do brief",
    detail:
      "Cada tarefa esconde uma combinação diferente entre intenção, contexto e forma.",
    bonus: 0,
    matches: (_cards, _task, active) => active,
  },
  {
    id: "clear-brief",
    label: "Brief cristalino",
    category: "FUNDAMENTOS",
    requirement: "Objetivo + Critérios de sucesso",
    detail:
      "Um objetivo claro acompanhado de critérios torna o pedido mensurável.",
    bonus: 12,
    matches: cards => hasTags(cards, ["brief", "specific"]),
  },
  {
    id: "audience-context",
    label: "Mapa do leitor",
    category: "FUNDAMENTOS",
    requirement: "Público + Contexto",
    detail: "Conhecer quem lê e em qual situação reduz respostas genéricas.",
    bonus: 10,
    matches: cards => hasTypes(cards, ["PÚBLICO", "CONTEXTO"]),
  },
  {
    id: "persona-voice",
    label: "Voz encarnada",
    category: "TOM",
    requirement: "Persona + Voz da marca",
    detail: "Uma persona bem definida dá consistência para a voz da resposta.",
    bonus: 11,
    matches: cards => hasTypes(cards, ["PERSONA"]) && hasTag(cards, "tone"),
  },
  {
    id: "warm-conversation",
    label: "Conversa humana",
    category: "TOM",
    requirement: "Empatia + Tom",
    detail:
      "Empatia combinada com tom adequado evita respostas frias ou artificiais.",
    bonus: 11,
    matches: cards => hasTags(cards, ["empathy", "tone"]),
  },
  {
    id: "evidence-proof",
    label: "Prova concreta",
    category: "EVIDÊNCIA",
    requirement: "Evidência + Exemplo",
    detail: "Exemplos e evidências dão lastro para a resposta.",
    bonus: 13,
    matches: cards => hasTags(cards, ["evidence", "example"]),
  },
  {
    id: "structured-answer",
    label: "Resposta organizada",
    category: "ESTRUTURA",
    requirement: "Estrutura + Formato",
    detail:
      "Uma estrutura explícita ajuda a IA a entregar uma resposta fácil de usar.",
    bonus: 12,
    matches: cards => hasTags(cards, ["structure", "brief"]),
  },
  {
    id: "precision-limit",
    label: "Precisão sem excesso",
    category: "RESTRIÇÕES",
    requirement: "Restrição + Especificidade",
    detail:
      "Limites verificáveis aumentam a precisão sem desperdiçar palavras.",
    bonus: 12,
    matches: cards => hasTags(cards, ["constraint", "specific"]),
  },
  {
    id: "action-plan",
    label: "Plano de ação",
    category: "AÇÃO",
    requirement: "Reparo + Call to action",
    detail: "Uma próxima ação transforma uma boa resposta em algo executável.",
    bonus: 12,
    matches: cards => hasTags(cards, ["repair", "brief"]),
  },
  {
    id: "creative-voice",
    label: "Assinatura criativa",
    category: "CRIATIVIDADE",
    requirement: "Criatividade + Tom",
    detail: "Criatividade com voz consistente produz ideias memoráveis.",
    bonus: 13,
    matches: cards => hasTags(cards, ["creative", "tone"]),
  },
  {
    id: "executive-filter",
    label: "Filtro executivo",
    category: "ESTRATÉGIA",
    requirement: "Decisões + Prioridades",
    detail:
      "Destacar decisões e ordenar prioridades faz a resposta chegar ao ponto.",
    bonus: 14,
    matches: cards =>
      hasTags(cards, ["structure", "specific"]) && hasTag(cards, "constraint"),
  },
  {
    id: "role-play",
    label: "Papel com propósito",
    category: "PERSONA",
    requirement: "Persona + Objetivo",
    detail:
      "Dar um papel à IA funciona melhor quando o resultado esperado está explícito.",
    bonus: 11,
    matches: cards => hasTags(cards, ["context", "brief"]),
  },
  {
    id: "review-loop",
    label: "Loop de revisão",
    category: "QUALIDADE",
    requirement: "Revisão + Critérios",
    detail:
      "Pedir uma checagem contra critérios cria uma camada extra de qualidade.",
    bonus: 14,
    matches: cards => hasTags(cards, ["specific", "structure"]),
  },
  {
    id: "tradeoff-aware",
    label: "Trade-off consciente",
    category: "ESTRATÉGIA",
    requirement: "Trade-off + Dados",
    detail: "Explicitar trocas e apoiar a decisão em dados reduz ambiguidades.",
    bonus: 13,
    matches: cards => hasTags(cards, ["evidence", "specific"]),
  },
  {
    id: "complete-brief",
    label: "Brief 360º",
    category: "RARO",
    requirement: "Contexto + Público + Objetivo + Formato",
    detail:
      "Um pedido completo antecipa as perguntas que normalmente ficam subentendidas.",
    bonus: 22,
    matches: cards =>
      hasTypes(cards, ["CONTEXTO", "PÚBLICO", "FORMATO"]) &&
      hasTags(cards, ["brief", "specific"]),
  },
  // --- NOVAS SINERGIAS: RAG, SEGURANÇA, TOOLS, RACIOCÍNIO & COMBOS HÍBRIDOS ---
  {
    id: "rag-grounding",
    label: "Grounding RAG",
    category: "RAG",
    requirement: "2 ou mais cartas de RAG",
    detail:
      "Ancoragem factual e citação de fontes eliminam alucinações e trazem lastro ao contexto.",
    bonus: 22,
    matches: cards => cards.filter(card => card.type === "RAG").length >= 2,
  },
  {
    id: "safety-shield",
    label: "Blindagem de Segurança",
    category: "SEGURANÇA",
    requirement: "2 ou mais cartas de Segurança",
    detail:
      "Guardrails e restrições negativas criam um escudo contra jailbreaks e desvios de conduta.",
    bonus: 20,
    matches: cards =>
      cards.filter(card => card.type === "SEGURANÇA").length >= 2,
  },
  {
    id: "tool-orchestration",
    label: "Orquestração de Ferramentas",
    category: "TOOLS",
    requirement: "2 cartas de Ferramentas (API + Chamada)",
    detail:
      "Capacita o modelo para agir sobre o mundo real através de chamadas estruturadas de ferramentas.",
    bonus: 25,
    matches: cards => cards.filter(card => card.type === "TOOLS").length >= 2,
  },
  {
    id: "tot-critical-tree",
    label: "Árvore Crítica de Raciocínio",
    category: "RACIOCÍNIO",
    requirement: "Tree of Thoughts + (Advogado do Diabo ou Refinamento)",
    detail:
      "Exploração de hipóteses combinada com contraposição crítica eleva o raciocínio a nível especialista.",
    bonus: 28,
    matches: cards =>
      cards.some(card => card.id === "reasoning_tot") &&
      cards.some(
        card =>
          card.id === "reasoning_devil" || card.id === "reasoning_step"
      ),
  },
  {
    id: "agentic-architecture",
    label: "Arquitetura Agêntica Completa",
    category: "LENDÁRIO",
    requirement: "1 RAG + 1 TOOLS + 1 RACIOCÍNIO (ou CoT)",
    detail:
      "O combo supremo de IA: Contexto documental, raciocínio profundo e integração com ferramentas externas.",
    bonus: 38,
    matches: cards =>
      cards.some(card => card.type === "RAG") &&
      cards.some(card => card.type === "TOOLS") &&
      cards.some(
        card =>
          card.type === "RACIOCÍNIO" ||
          card.id.startsWith("chain_of_thought")
      ),
  },
  {
    id: "react-pattern",
    label: "Engenharia ReAct (Reason + Act)",
    category: "AGENTE",
    requirement: "(Tree of Thoughts ou CoT) + (Ferramenta ou API)",
    detail:
      "O padrão ReAct alterna raciocínio explícito com execução de ferramentas para resolver problemas dinâmicos.",
    bonus: 30,
    matches: cards =>
      cards.some(
        card =>
          card.type === "RACIOCÍNIO" ||
          card.id.startsWith("chain_of_thought")
      ) && cards.some(card => card.type === "TOOLS"),
  },
  {
    id: "factual-grounding",
    label: "Validação Factual Estrita",
    category: "EVIDÊNCIA",
    requirement: "1 carta RAG + (Dados e números ou Citar frase-chave)",
    detail:
      "Vincular métricas concretas e citações diretas a fontes de dados elimina completamente suposições inventadas.",
    bonus: 24,
    matches: cards =>
      cards.some(card => card.type === "RAG") &&
      cards.some(card => card.id === "numbers" || card.id === "quote"),
  },
  {
    id: "api-contract",
    label: "Contrato de API Estruturado",
    category: "ESTRUTURA",
    requirement: "Declaração de API + Formato de saída",
    detail:
      "Declarar schemas de API com formatos de saída explícitos garante respostas 100% integráveis sem erros de parsing.",
    bonus: 22,
    matches: cards =>
      cards.some(card => card.id === "tool_api") &&
      cards.some(card => card.type === "FORMATO"),
  },
  {
    id: "dialectical-debate",
    label: "Debate Dialético Especialista",
    category: "ESTRATÉGIA",
    requirement: "Persona + Advogado do Diabo + Antecipar objeções",
    detail:
      "Uma persona experiente simulando objeções e contra-ataques cria uma análise estratégica blindada contra falhas.",
    bonus: 32,
    matches: cards =>
      cards.some(card => card.type === "PERSONA") &&
      cards.some(card => card.id === "reasoning_devil") &&
      cards.some(card => card.id === "objection"),
  },
  {
    id: "self-correction-loop",
    label: "Loop de Auto-Correção",
    category: "QUALIDADE",
    requirement: "Refinamento Passo a Passo + Autoavaliação",
    detail:
      "Dividir a tarefa em micro-passos e submeter cada etapa a uma auto-revisão crítica maximiza a precisão do resultado.",
    bonus: 25,
    matches: cards =>
      cards.some(card => card.id === "reasoning_step") &&
      cards.some(card => card.id.startsWith("self_eval")),
  },
  {
    id: "safe-institutional-tone",
    label: "Comunicação Segura & Institucional",
    category: "TOM",
    requirement: "1 Segurança + (Voz da marca ou Tom formal/técnico) + Público",
    detail:
      "Alinhar o tom institucional com guardrails de conformidade e foco no leitor protege a reputação da marca.",
    bonus: 26,
    matches: cards =>
      cards.some(card => card.type === "SEGURANÇA") &&
      cards.some(
        card =>
          card.id === "voice" ||
          card.id === "formal" ||
          card.id === "professional"
      ) &&
      cards.some(card => card.type === "PÚBLICO"),
  },
  {
    id: "rag-few-shot",
    label: "RAG Exemplificado (Few-Shot Grounding)",
    category: "EXEMPLOS",
    requirement: "1 carta RAG + 1 carta de Exemplo",
    detail:
      "Demonstrar com exemplos concretos como consultar e interpretar a fonte de dados acelera a precisão de extração.",
    bonus: 24,
    matches: cards =>
      cards.some(card => card.type === "RAG") &&
      cards.some(
        card => card.type === "EXEMPLO" || card.tags.includes("example")
      ),
  },
  {
    id: "secure-code-audit",
    label: "Auditoria Segura de Código",
    category: "SEGURANÇA",
    requirement:
      "Trecho de Código Legado + 1 Segurança + (Sinalizar riscos ou Critérios)",
    detail:
      "Analisar código com restrições rígidas de segurança e mapeamento de riscos previne injeções de código e vulnerabilidades.",
    bonus: 28,
    matches: cards =>
      cards.some(card => card.id === "rag_legacy") &&
      cards.some(card => card.type === "SEGURANÇA") &&
      cards.some(card => card.id === "risk" || card.id === "criteria"),
  },
];

function seeded(seed: number) {
  let value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function shuffled<T>(items: T[], seed: number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seeded(seed + i * 17.31) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getPersonality(round: number) {
  // Escolhe um oponente totalmente aleatório da lista a cada rodada
  return PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
}

function chooseCpu(
  market: Card[],
  task: Task,
  synergy: Task["synergyOptions"][number],
  personality: Personality,
  budget: number,
  seed: number
) {
  const sorted = shuffled(market, seed + 99);
  const ranking = [...sorted].sort((a, b) => {
    const aFocus = a.tags.filter(tag => task.signal.includes(tag)).length;
    const bFocus = b.tags.filter(tag => task.signal.includes(tag)).length;
    const aSyn = a.tags.filter(tag => synergy.tags.includes(tag)).length;
    const bSyn = b.tags.filter(tag => synergy.tags.includes(tag)).length;
    if (personality.title === "econômica")
      return b.quality / b.cost - a.quality / a.cost;
    if (
      personality.title === "estrategista" ||
      personality.title === "BOSS" ||
      personality.name === "Skull"
    )
      return (
        bFocus * 4 + bSyn * 5 + b.quality - (aFocus * 4 + aSyn * 5 + a.quality)
      );
    return seeded(seed + b.quality) - seeded(seed + a.quality);
  });
  const picks: string[] = [];
  let spend = 0;
  const maxCards =
    personality.title === "caótica"
      ? 4
      : personality.title === "estrategista" ||
          personality.title === "BOSS" ||
          personality.name === "Skull"
        ? 3
        : 2;
  const chaotic = personality.title === "caótica";
  const takenTypes = new Set<string>();
  for (const card of ranking) {
    if (card.trap && !chaotic) continue;
    if (
      !chaotic &&
      !REDUNDANCY_EXEMPT.has(card.type) &&
      takenTypes.has(card.type)
    )
      continue;
    const price = card.liveCost ?? card.cost;
    if (picks.length >= maxCards || spend + price > budget) continue;
    picks.push(card.id);
    takenTypes.add(card.type);
    spend += price;
  }

  return picks;
}

function buildRound(
  round: number,
  playerBudget: number,
  cpuBudget: number,
  previousTaskId = "",
  previousMarketIds: string[] = [],
  overridePersonality?: Personality
): RoundState {
  const entropy = Math.random() * 100000 + Date.now() + round * 7919;
  const taskPool = TASKS.filter(candidate => candidate.id !== previousTaskId);
  const task =
    taskPool[Math.floor(Math.random() * taskPool.length)] ?? TASKS[0];
  const random = Math.random();
  const synergy =
    task.synergyOptions[Math.floor(random * task.synergyOptions.length)];
  const personality = overridePersonality ?? getPersonality(round);
  const previousIds = new Set(previousMarketIds);
  const randomizedCards = shuffled(CARDS, entropy);
  const freshCards = randomizedCards.filter(card => !previousIds.has(card.id));
  const coreIds = ["persona", "context", "audience", "task"];
  const coreCards = coreIds
    .map(id => randomizedCards.find(card => card.id === id))
    .filter((card): card is Card => Boolean(card));
  const exampleCards = shuffled(
    CARDS.filter(card => card.tags.includes("example")),
    entropy + 41
  ).slice(0, 1);
  const trapCards = shuffled(
    CARDS.filter(card => card.trap),
    entropy + 77
  ).slice(0, round >= 3 ? 2 : 1);

  const guaranteedIds = new Set(
    [...coreCards, ...exampleCards, ...trapCards].map(card => card.id)
  );
  const marketPool = [
    ...coreCards,
    ...exampleCards,
    ...trapCards,
    ...freshCards.filter(card => !guaranteedIds.has(card.id)),
    ...randomizedCards.filter(card => !guaranteedIds.has(card.id)),
  ];

  const market = marketPool.slice(0, 16).map(card => ({
    ...card,
    liveCost: card.trap
      ? Math.max(3, Math.round(card.cost * (1 + Math.random() * 0.3)))
      : Math.max(1, Math.round(card.cost * (0.8 + Math.random() * 0.4))),
  }));

  const cpuPlan = chooseCpu(
    market,
    task,
    synergy,
    personality,
    cpuBudget,
    entropy + 2
  );
  return {
    round,
    task,
    market,
    synergy,
    personality,
    playerBudget,
    cpuBudget,
    cpuPlan,
  };
}

function evaluate(
  cards: Card[],
  task: Task,
  synergy: Task["synergyOptions"][number]
): Evaluation {
  const spent = cards.reduce(
    (total, card) => total + (card.liveCost ?? card.cost),
    0
  );
  const baseQuality = cards.reduce((total, card) => total + card.quality, 0);
  const matchedTags = Array.from(
    new Set(
      cards.flatMap(card => card.tags).filter(tag => task.signal.includes(tag))
    )
  );
  const focusBonus = matchedTags.length * 2;
  const trapCount = cards.filter(card => card.trap).length;
  const trapPenalty = trapCount * 10;
  const redundantTypes = getRedundantTypes(cards);
  // −15% por repetição, com teto de −45% para não zerar prompts grandes.
  const redundancyRate = Math.min(0.45, redundantTypes.length * 0.15);

  const synergyActive = synergy.tags.every(tag =>
    cards.some(card => card.tags.includes(tag))
  );
  const synergyBonus = synergyActive ? synergy.bonus : 0;
  const exampleCount = cards.filter(card =>
    card.tags.includes("example")
  ).length;
  const pitacoOrder = [
    "PERSONA",
    "INSTRUÇÃO",
    "TAREFA",
    "PÚBLICO",
    "CONTEXTO",
    "FORMATO",
  ];
  const pitacoScore = pitacoOrder.filter(t =>
    cards.some(card => card.type === t)
  ).length;
  const isPitaco = pitacoScore === pitacoOrder.length;

  const hasSelfEval = cards.some(card => card.id.startsWith("self_eval"));
  const hasCoT = cards.some(card => card.id.startsWith("chain_of_thought"));
  const chainCount = cards.filter(card =>
    card.id.startsWith("chaining")
  ).length;

  const specialSynergies: SpecialSynergy[] = [];

  if (isPitaco) {
    specialSynergies.push({
      label: "Método PITACO",
      bonus: 55,
      note: "Persona, Instrução, Tarefa, Público, Contexto e Formato formam a arquitetura completa do prompt lendário.",
    });
  } else if (pitacoScore === 5) {
    specialSynergies.push({
      label: "PITACO incompleto",
      bonus: 20,
      note: "Cinco dos seis pilares. Falta um elemento para o modelo parar de adivinhar.",
    });
  }

  if (hasCoT) {
    specialSynergies.push({
      label: "Chain of Thought (CoT)",
      bonus: 20,
      note: "Obrigar a IA a raciocinar passo a passo antes da resposta previne erros de lógica.",
    });
  }

  if (hasSelfEval) {
    specialSynergies.push({
      label: "Autoavaliação e Crítica",
      bonus: 15,
      note: "Pedir uma revisão crítica antes da resposta final eleva o raciocínio da IA.",
    });
  }

  if (exampleCount > 1) {
    specialSynergies.push({
      label: "Few-shot",
      bonus: 18,
      note: "Mais de um exemplo ajuda a IA a inferir o padrão antes de responder.",
    });
  } else if (exampleCount === 1) {
    specialSynergies.push({
      label: "One-shot",
      bonus: 10,
      note: "Um exemplo concreto mostra à IA o estilo ou padrão esperado.",
    });
  }

  const nonChainCount = cards.length - chainCount;
  if (chainCount > 0 && nonChainCount >= 1) {
    const chainBonus = chainCount * 10;
    specialSynergies.push({
      label:
        chainCount > 1
          ? `Encadeamento múltiplo (${chainCount}x)`
          : "Encadeamento de prompt",
      bonus: chainBonus,
      note:
        chainCount > 1
          ? `${chainCount} etapas encadeadas acumulando valor (+${chainBonus}) a partir da resposta do prompt anterior.`
          : "Encadeia uma nova etapa a partir da resposta do prompt anterior (+10).",
    });
  }

  // --- NOVAS SINERGIAS ESPECIAIS & COMBOS HÍBRIDOS ---
  const ragCount = cards.filter(c => c.type === "RAG").length;
  const safetyCount = cards.filter(c => c.type === "SEGURANÇA").length;
  const toolCount = cards.filter(c => c.type === "TOOLS").length;
  const hasToT = cards.some(c => c.id === "reasoning_tot");
  const hasDevil = cards.some(c => c.id === "reasoning_devil");
  const hasStep = cards.some(c => c.id === "reasoning_step");
  const hasReasoning =
    cards.some(c => c.type === "RACIOCÍNIO") || hasCoT || hasToT;

  // 1. Grounding RAG (+22)
  if (ragCount >= 2) {
    specialSynergies.push({
      label: "Grounding RAG",
      bonus: 22,
      note: "Ancoragem factual e citação de fontes eliminam alucinações e trazem lastro ao contexto.",
    });
  }

  // 2. Blindagem de Segurança (+20)
  if (safetyCount >= 2) {
    specialSynergies.push({
      label: "Blindagem de Segurança",
      bonus: 20,
      note: "Guardrails e restrições negativas criam um escudo contra jailbreaks e desvios de conduta.",
    });
  }

  // 3. Orquestração de Ferramentas (+25)
  if (toolCount >= 2) {
    specialSynergies.push({
      label: "Orquestração de Ferramentas",
      bonus: 25,
      note: "Capacita o modelo para agir sobre o mundo real através de chamadas estruturadas de ferramentas.",
    });
  }

  // 4. Árvore Crítica de Raciocínio (+28)
  if (hasToT && (hasDevil || hasStep)) {
    specialSynergies.push({
      label: "Árvore Crítica de Raciocínio",
      bonus: 28,
      note: "Exploração de hipóteses combinada com contraposição crítica eleva o raciocínio a nível especialista.",
    });
  }

  // 5. Arquitetura Agêntica Completa (Super Combo +38)
  if (ragCount >= 1 && toolCount >= 1 && hasReasoning) {
    specialSynergies.push({
      label: "Arquitetura Agêntica Completa",
      bonus: 38,
      note: "O combo supremo de IA: Contexto documental, raciocínio profundo e integração com ferramentas externas.",
    });
  }

  // 6. Engenharia ReAct (+30) - quando não ativou a arquitetura completa para evitar sobreposição excessiva
  if (hasReasoning && toolCount >= 1 && !(ragCount >= 1 && toolCount >= 1 && hasReasoning)) {
    specialSynergies.push({
      label: "Engenharia ReAct (Reason + Act)",
      bonus: 30,
      note: "O padrão ReAct alterna raciocínio explícito com execução de ferramentas para resolver problemas dinâmicos.",
    });
  }

  // 7. Validação Factual Estrita (+24)
  const hasFactualData = cards.some(c => c.id === "numbers" || c.id === "quote");
  if (ragCount >= 1 && hasFactualData) {
    specialSynergies.push({
      label: "Validação Factual Estrita",
      bonus: 24,
      note: "Vincular métricas concretas e citações diretas a fontes de dados elimina completamente suposições inventadas.",
    });
  }

  // 8. Contrato de API Estruturado (+22)
  const hasApi = cards.some(c => c.id === "tool_api");
  const hasFormat = cards.some(c => c.type === "FORMATO");
  if (hasApi && hasFormat) {
    specialSynergies.push({
      label: "Contrato de API Estruturado",
      bonus: 22,
      note: "Declarar schemas de API com formatos de saída explícitos garante respostas 100% integráveis sem erros de parsing.",
    });
  }

  // 9. Debate Dialético Especialista (+32)
  const hasPersona = cards.some(c => c.type === "PERSONA");
  const hasObjection = cards.some(c => c.id === "objection");
  if (hasPersona && hasDevil && hasObjection) {
    specialSynergies.push({
      label: "Debate Dialético Especialista",
      bonus: 32,
      note: "Uma persona experiente simulando objeções e contra-ataques cria uma análise estratégica blindada contra falhas.",
    });
  }

  // 10. Loop de Auto-Correção (+25)
  if (hasStep && hasSelfEval) {
    specialSynergies.push({
      label: "Loop de Auto-Correção",
      bonus: 25,
      note: "Dividir a tarefa em micro-passos e submeter cada etapa a uma auto-revisão crítica maximiza a precisão do resultado.",
    });
  }

  // 11. Comunicação Segura & Institucional (+26)
  const hasInstitutionalTone = cards.some(
    c => c.id === "voice" || c.id === "formal" || c.id === "professional"
  );
  const hasAudience = cards.some(c => c.type === "PÚBLICO");
  if (safetyCount >= 1 && hasInstitutionalTone && hasAudience) {
    specialSynergies.push({
      label: "Comunicação Segura & Institucional",
      bonus: 26,
      note: "Alinhar o tom institucional com guardrails de conformidade e foco no leitor protege a reputação da marca.",
    });
  }

  // 12. RAG Exemplificado / Few-Shot Grounding (+24)
  if (ragCount >= 1 && (exampleCount >= 1 || cards.some(c => c.type === "EXEMPLO"))) {
    specialSynergies.push({
      label: "RAG Exemplificado (Few-Shot Grounding)",
      bonus: 24,
      note: "Demonstrar com exemplos concretos como consultar e interpretar a fonte de dados acelera a precisão de extração.",
    });
  }

  // 13. Auditoria Segura de Código (+28)
  const hasLegacy = cards.some(c => c.id === "rag_legacy");
  const hasRiskOrCriteria = cards.some(c => c.id === "risk" || c.id === "criteria");
  if (hasLegacy && safetyCount >= 1 && hasRiskOrCriteria) {
    specialSynergies.push({
      label: "Auditoria Segura de Código",
      bonus: 28,
      note: "Analisar código com restrições rígidas de segurança e mapeamento de riscos previne injeções de código e vulnerabilidades.",
    });
  }

  const specialSynergy = specialSynergies[0] ?? null;
  const positiveSpecialBonus = specialSynergies
    .filter(syn => syn.bonus > 0)
    .reduce((total, syn) => total + syn.bonus, 0);
  const discoveredLibraryIds = LIBRARY_SYNERGIES.filter(entry =>
    entry.matches(cards, task, synergyActive)
  ).map(entry => entry.id);
  const rawQuality = Math.max(
    0,
    baseQuality + focusBonus + synergyBonus + positiveSpecialBonus - trapPenalty
  );
  const redundancyPenalty = Math.round(rawQuality * redundancyRate);
  const quality = Math.max(0, rawQuality - redundancyPenalty);
  return {
    cards,
    spent,
    baseQuality,
    focusBonus,
    trapPenalty,
    redundancyPenalty, // ← nova
    redundantTypes, // ← nova
    synergyBonus,
    specialSynergy,
    specialSynergies,
    discoveredLibraryIds,
    quality,
    efficiency: spent ? quality / spent : 0,
    matchedTags,
  };
}

function formatScore(value: number) {
  return value.toFixed(1);
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent = "",
}: {
  icon: IconComponent;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="mini-stat">
      <div className={`mini-stat-icon ${accent}`}>
        <Icon size={15} strokeWidth={2.2} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function MarketCard({
  card,
  selected,
  disabled,
  scolded,
  redundant,
  onBuy,
  index,
}: {
  card: Card;
  selected: boolean;
  disabled: boolean;
  scolded: boolean;
  redundant: boolean;
  onBuy: () => void;
  index: number;
}) {
  return (
    <button
      className={`market-card ${selected ? "is-selected" : ""} ${scolded ? "is-scolded" : ""} ${card.trap ? "is-trap-card" : ""} ${redundant ? "is-redundant" : ""}`}
      disabled={disabled}
      onClick={onBuy}
      style={{ "--delay": `${index * 45}ms` } as CSSProperties}
    >
      {scolded && (
        <span className="card-scold" role="status">
          <Gavel size={13} /> Isso é um leilão, não pode vender depois de
          comprar
        </span>
      )}
      <div className="market-card-top">
        <span className="card-symbol">{card.symbol}</span>
        <span className="card-type">
          {card.type}
          {redundant && <i className="dupe-flag">dup</i>}
        </span>
        <span className="card-price">
          <Coins size={13} />
          {card.liveCost}
        </span>
      </div>
      <div className="market-card-copy">
        <strong>{card.label}</strong>
        <span>{card.description}</span>
      </div>
      <div className="market-card-bottom">
        <span className="masked-value">
          <LockKeyhole size={11} /> valor oculto
        </span>
        <span className="buy-link">
          {selected ? "comprada" : "comprar"}
          <ChevronRight size={14} />
        </span>
      </div>
    </button>
  );
}

function RevealCard({ card }: { card: Card }) {
  return (
    <div className={`reveal-card ${card.trap ? "is-trap" : ""}`}>
      <div className="reveal-card-symbol">{card.symbol}</div>
      <div className="reveal-card-copy">
        <strong>{card.label}</strong>
        <span>{card.trap ? "armadilha · −10" : card.type}</span>
      </div>
      <div className="revealed-value">
        <span>valor</span>
        <strong>{card.quality}</strong>
      </div>
    </div>
  );
}

function Scorebar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div className="scorebar">
      <div className="scorebar-label">
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <div className="scorebar-track">
        <span
          className={color}
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

type TutorialStep = {
  targetId: string;
  badge: string;
  title: string;
  description: string;
  tip: string;
};

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: "tutorial-brief",
    badge: "Passo 1 de 4 · O Briefing",
    title: "1. Veja o que a IA precisa gerar",
    description:
      "Toda rodada apresenta um desafio com público-alvo e objetivo específicos. Olhe para o 'sinal visível' e o 'insight': eles indicam os temas e palavras-chave que garantem notas altas!",
    tip: "Na vida real: antes de abrir o ChatGPT ou Claude, tenha total clareza de quem é o público e o objetivo da mensagem.",
  },
  {
    targetId: "tutorial-market",
    badge: "Passo 2 de 4 · O Mercado de Elementos",
    title: "2. Escolha as Cartas Estratégicas",
    description:
      "Cada carta representa uma peça do prompt (Persona, Contexto, Tom, Formato). Clique para adicionar cartas ao seu prompt. Atenção: evite cartas do mesmo tipo para não sofrer penalidade de redundância!",
    tip: "A regra de ouro da IA é 'Menos é Mais'. Uma ou duas cartas precisas valem mais que encher o carrinho.",
  },
  {
    targetId: "tutorial-wallet",
    badge: "Passo 3 de 4 · Moedas & Eficiência",
    title: "3. Controle o Custo (Tokens da IA)",
    description:
      "Suas moedas representam o tempo e o custo de processamento (tokens). Sua pontuação final é calculada por EFICIÊNCIA = Qualidade ÷ Custo. Se gastar pouco e acertar o alvo, sua eficiência dispara!",
    tip: "Prompts gigantescos gastam mais tempo e dinheiro (tokens). Seja direto e cirúrgico.",
  },
  {
    targetId: "tutorial-submit",
    badge: "Passo 4 de 4 · O Duelo",
    title: "4. Teste seu Prompt na Arena",
    description:
      "Quando escolher ao menos 2 cartas complementares, clique em 'Parar e revelar'. A CPU vai revelar a lógica dela e o placar comparará a eficiência dos dois prompts!",
    tip: "Pronto para duelar? Escolha suas cartas e clique no botão para testar sua eficiência!",
  },
];

export default function App() {
  const demo = useMemo(
    () => new URLSearchParams(window.location.search).has("demo"),
    []
  );
  const [roundState, setRoundState] = useState<RoundState>(() =>
    buildRound(1, 25, 25)
  );
  const [phase, setPhase] = useState<Phase>("auction");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [score, setScore] = useState({ player: 0, cpu: 0 });
  const [notice, setNotice] = useState(
    "Monte um prompt enxuto. A CPU está de olho."
  );
  const [minCardsWarning, setMinCardsWarning] = useState(false);
  const warnTimer = useRef<number | null>(null);

  const demoRound = useRef(0);
  const [infoOpen, setInfoOpen] = useState(true);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [tutorialTargetRect, setTutorialTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [discoveredSynergies, setDiscoveredSynergies] = useState<string[]>(
    () => {
      try {
        return JSON.parse(
          localStorage.getItem("prompt-auction-discovered-synergies") || "[]"
        );
      } catch {
        return [];
      }
    }
  );
  const [hasDefeatedAres, setHasDefeatedAres] = useState<boolean>(() => {
    try {
      if (
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("ares") === "true"
      ) {
        localStorage.setItem("prompt-auction-ares-defeated", "true");
        return true;
      }
      return localStorage.getItem("prompt-auction-ares-defeated") === "true";
    } catch {
      return false;
    }
  });
  const [dismissSkullScreen, setDismissSkullScreen] = useState(false);
  const isTestWinSkull = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("win_skull") === "true" ||
      params.get("winskull") === "true" ||
      params.get("skull") === "win" ||
      params.get("win_black") === "true" ||
      params.get("winblack") === "true" ||
      params.get("black") === "win" ||
      params.get("vitoria") === "skull" ||
      params.get("vitoria") === "black"
    );
  }, []);
  const [dismissWhiteVictoryScreen, setDismissWhiteVictoryScreen] =
    useState(false);
  const revealTimer = useRef<number | null>(null);
  const [scoldedId, setScoldedId] = useState<string | null>(null);
  const scoldTimer = useRef<number | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  const scold = (cardId: string) => {
    setScoldedId(cardId);
    if (scoldTimer.current) window.clearTimeout(scoldTimer.current);
    scoldTimer.current = window.setTimeout(() => setScoldedId(null), 2200);
  };

  const selectedCards = useMemo(
    () => roundState.market.filter(card => selectedIds.includes(card.id)),
    [roundState.market, selectedIds]
  );
  const playerSpent = useMemo(
    () =>
      selectedCards.reduce(
        (total, card) => total + (card.liveCost ?? card.cost),
        0
      ),
    [selectedCards]
  );
  const wallet = roundState.playerBudget - playerSpent;
  const cpuCards = useMemo(
    () =>
      roundState.market.filter(card => roundState.cpuPlan.includes(card.id)),
    [roundState.market, roundState.cpuPlan]
  );
  const tip = TIPS[(roundState.round - 1) % TIPS.length];

  const finishRound = (ids: string[]) => {
    if (phase !== "auction") return;
    if (ids.length < 2) {
      setMinCardsWarning(true);
      if (warnTimer.current) window.clearTimeout(warnTimer.current);
      warnTimer.current = window.setTimeout(
        () => setMinCardsWarning(false),
        3000
      );
      return;
    }

    const playerCards = roundState.market.filter(card => ids.includes(card.id));
    setSelectedIds(ids);
    setPhase("thinking");
    setNotice(
      `${roundState.personality.name} está comparando eficiência e sinergias…`
    );
    if (revealTimer.current) window.clearTimeout(revealTimer.current);
    revealTimer.current = window.setTimeout(() => {
      const playerEval = evaluate(
        playerCards,
        roundState.task,
        roundState.synergy
      );
      const cpuEval = evaluate(cpuCards, roundState.task, roundState.synergy);
      // Bônus roubado da CPU: Skull (+40) ou BOSS (+20)
      if (roundState.personality.name === "Skull") {
        cpuEval.quality += 40;
        cpuEval.efficiency = cpuEval.spent
          ? cpuEval.quality / cpuEval.spent
          : 0;
      } else if (roundState.personality.title === "BOSS") {
        cpuEval.quality += 20;
        // Recalcula a eficiência com os novos pontos
        cpuEval.efficiency = cpuEval.spent
          ? cpuEval.quality / cpuEval.spent
          : 0;
      }
      const winner: Winner =
        Math.abs(playerEval.efficiency - cpuEval.efficiency) < 0.01
          ? "tie"
          : playerEval.efficiency > cpuEval.efficiency
            ? "player"
            : "cpu";
      setResult({
        player: playerEval,
        cpu: cpuEval,
        winner,
        synergy: roundState.synergy,
      });
      setDismissSkullScreen(false);
      setDismissWhiteVictoryScreen(false);
      const newlyDiscovered = playerEval.discoveredLibraryIds;
      if (newlyDiscovered.length)
        setDiscoveredSynergies(current => {
          const next = Array.from(new Set([...current, ...newlyDiscovered]));
          localStorage.setItem(
            "prompt-auction-discovered-synergies",
            JSON.stringify(next)
          );
          return next;
        });
      if (winner === "player" && roundState.personality.name === "Ares") {
        try {
          localStorage.setItem("prompt-auction-ares-defeated", "true");
        } catch {
          // ignore
        }
        setHasDefeatedAres(true);
      }
      if (winner !== "tie")
        setScore(current => ({ ...current, [winner]: current[winner] + 1 }));
      setPhase("result");
      setNotice(
        winner === "player"
          ? roundState.personality.name === "Skull"
            ? "Triunfo lendário! Você superou os 40 pontos de vantagem de Skull!"
            : "Sua eficiência encontrou o ponto certo."
          : winner === "cpu"
            ? roundState.personality.name === "Skull"
              ? "Skull venceu a rodada com sua vantagem insondável (+40)."
              : "A CPU levou essa pela relação valor/moeda."
            : "Empate técnico — a eficiência ficou colada."
      );
    }, 900);
  };

  useEffect(
    () => () => {
      if (revealTimer.current) window.clearTimeout(revealTimer.current);
      if (scoldTimer.current) window.clearTimeout(scoldTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!libraryOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [libraryOpen]);

  useEffect(() => {
    if (phase !== "result" || !result) return;
    const timer = window.setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [phase, result]);

  useEffect(() => {
    if (!demo || phase !== "auction" || demoRound.current === roundState.round)
      return;
    demoRound.current = roundState.round;
    const timer = window.setTimeout(() => {
      const picks: string[] = [];
      let spend = 0;
      for (const card of roundState.market) {
        const price = card.liveCost ?? card.cost;
        if (spend + price <= roundState.playerBudget && picks.length < 2) {
          picks.push(card.id);
          spend += price;
        }
      }
      finishRound(picks);
    }, 1700);
    return () => window.clearTimeout(timer);
  }, [demo, phase, roundState.round]);

  const buyCard = (card: Card) => {
    if (phase !== "auction") return;
    if (selectedIds.includes(card.id)) {
      scold(card.id);
      return;
    }
    const price = card.liveCost ?? card.cost;
    if (price > wallet) {
      setNotice(
        "Essa carta passa do seu saldo. Eficiência também é saber parar."
      );
      return;
    }
    setSelectedIds(current => [...current, card.id]);
    setNotice(
      `${card.label} entrou no seu prompt. Ainda restam ${wallet - price} moedas.`
    );
  };

  const startNextRound = () => {
    if (!result) return;
    const finished =
      roundState.round >= TOTAL_ROUNDS || score.player >= 3 || score.cpu >= 3;
    if (finished) {
      setPhase("gameover");
      return;
    }
    const nextPlayerBudget = Math.min(
      MAX_WALLET,
      roundState.playerBudget - result.player.spent + 10
    );
    const nextCpuBudget = Math.min(
      MAX_WALLET,
      roundState.cpuBudget - result.cpu.spent + 10
    );
    const isVersusSkull = roundState.personality.name === "Skull";
    setRoundState(
      buildRound(
        roundState.round + 1,
        nextPlayerBudget,
        nextCpuBudget,
        roundState.task.id,
        roundState.market.map(card => card.id),
        isVersusSkull ? SKULL_PERSONALITY : undefined
      )
    );
    setSelectedIds([]);
    setResult(null);
    setPhase("auction");
    setDismissSkullScreen(false);
    setDismissWhiteVictoryScreen(false);
    setNotice(
      isVersusSkull
        ? "Novo mercado contra Skull. O abismo ainda tem +40 de vantagem."
        : "Novo mercado, nova combinação. Nenhuma carta revela tudo de primeira."
    );
  };

  const restartMatch = () => {
    setRoundState(buildRound(1, 25, 25));
    setSelectedIds([]);
    setResult(null);
    setScore({ player: 0, cpu: 0 });
    setPhase("auction");
    setDismissSkullScreen(false);
    setDismissWhiteVictoryScreen(false);
    setNotice(
      "Nova partida iniciada. O melhor prompt nem sempre é o mais caro."
    );
    demoRound.current = 0;
  };

  const startGuidedTutorial = () => {
    setInfoOpen(false);
    setLibraryOpen(false);
    if (phase !== "auction" || roundState.round !== 1) {
      setRoundState(buildRound(1, 25, 25));
      setSelectedIds([]);
      setResult(null);
      setScore({ player: 0, cpu: 0 });
      setPhase("auction");
      setDismissSkullScreen(false);
      setDismissWhiteVictoryScreen(false);
      demoRound.current = 0;
    }
    setTutorialStep(0);
    setNotice(
      "Tutorial iniciado: Siga os callouts para dominar a primeira rodada!"
    );
  };

  useEffect(() => {
    if (tutorialStep === null) {
      setTutorialTargetRect(null);
      document.querySelectorAll(".tutorial-highlight-target").forEach(el => {
        el.classList.remove("tutorial-highlight-target");
      });
      return;
    }
    const step = TUTORIAL_STEPS[tutorialStep];
    if (!step) return;

    const updateRect = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTutorialTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    const el = document.getElementById(step.targetId);
    document.querySelectorAll(".tutorial-highlight-target").forEach(elem => {
      if (elem !== el) elem.classList.remove("tutorial-highlight-target");
    });
    if (el) {
      el.classList.add("tutorial-highlight-target");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const t1 = window.setTimeout(updateRect, 50);
    const t2 = window.setTimeout(updateRect, 350);

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      const targetEl = document.getElementById(step.targetId);
      targetEl?.classList.remove("tutorial-highlight-target");
    };
  }, [tutorialStep]);

  const fightSkull = () => {
    if (phase === "thinking") return;
    setDismissSkullScreen(false);
    setDismissWhiteVictoryScreen(false);
    setRoundState(buildRound(1, 25, 25, "", [], SKULL_PERSONALITY));
    setSelectedIds([]);
    setResult(null);
    setScore({ player: 0, cpu: 0 });
    setPhase("auction");
    setNotice(
      "Você desafiou Skull. Ele possui 40 pontos de vantagem nativa em cada rodada."
    );
  };

  const winnerLabel =
    result?.winner === "player"
      ? roundState.personality.name === "Skull"
        ? "Você derrotou Skull!"
        : "Você venceu a rodada"
      : result?.winner === "cpu"
        ? roundState.personality.name === "Skull"
          ? "Skull venceu a rodada"
          : "A CPU venceu a rodada"
        : "Empate técnico";
  const phaseLabel =
    phase === "auction"
      ? "leilão aberto"
      : phase === "thinking"
        ? "revelando lógica"
        : phase === "result"
          ? "resultado"
          : "partida encerrada";

  const CpuIcon = roundState.personality.icon;
  const aresWins =
    result?.winner === "cpu" && roundState.personality.name === "Ares";
  const skullWins =
    result?.winner === "cpu" && roundState.personality.name === "Skull";
  const playerWinsAgainstSkull =
    (result?.winner === "player" && roundState.personality.name === "Skull") ||
    (phase === "gameover" &&
      roundState.personality.name === "Skull" &&
      score.player > score.cpu) ||
    isTestWinSkull;

  return (
    <div className="game-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <img src="LogoSemFundo.png" alt="Prompt Auction" />
          </div>
          <div>
            <div className="brand-name">
              Prompt Auction <span>•</span>
              <img
                className="brand-wordmark"
                src="/LogoSemFundoComBranco.png"
                alt="TolazzAI"
              />
            </div>
            <div className="brand-kicker">
              laboratório de engenharia de prompt
            </div>
          </div>
        </div>
        <div className="topbar-center">
          <span className="live-dot" /> partida local
        </div>
        <div className="topbar-actions">
          <button
            className="icon-button"
            title="Sobre o jogo"
            aria-label="Sobre o jogo"
            onClick={() => setInfoOpen(true)}
          >
            <CircleHelp size={17} />
          </button>
          <button
            className="icon-button"
            title="Reiniciar partida"
            aria-label="Reiniciar partida"
            onClick={restartMatch}
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="game-intro">
          <div>
            <div className="eyebrow">
              <Sparkles size={13} /> prompt arena · temporada 01
            </div>
            <h1>
              Compre as palavras.
              <br />
              <em>Venda a ideia.</em>
            </h1>
            <p>
              Uma disputa de eficiência contra a CPU: construa o prompt certo,
              descubra as sinergias escondidas e aprenda por que contexto vale
              mais que volume.
            </p>
          </div>
          <div className="intro-scoreboard">
            <div className="score-header">
              <span>placar da mesa</span>
              <span>primeiro a 3</span>
            </div>
            <div className="score-players">
              <div className="score-player">
                <span className="avatar avatar-player">
                  <UserRound size={16} />
                </span>
                <div>
                  <span>você</span>
                  <strong>{score.player}</strong>
                </div>
              </div>
              <div className="score-divider">:</div>
              <div className="score-player cpu">
                <span className="avatar avatar-cpu">
                  <Bot size={16} />
                </span>
                <div>
                  <span>CPU</span>
                  <strong>{score.cpu}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="round-strip">
          <div className="round-progress">
            <span className="round-label">
              rodada <strong>0{roundState.round}</strong>{" "}
              <i>/ 0{TOTAL_ROUNDS}</i>
            </span>
            <div className="round-dots">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, index) => (
                <span
                  key={index}
                  className={
                    index + 1 < roundState.round
                      ? "done"
                      : index + 1 === roundState.round
                        ? "current"
                        : ""
                  }
                />
              ))}
            </div>
          </div>
          <div className={`phase-state ${phase}`}>
            <span className="phase-dot" /> {phaseLabel}
          </div>
          <div className="wallet" id="tutorial-wallet">
            <Coins size={15} />
            <span>seu saldo</span>
            <strong>{wallet}</strong>
            <small>/ {roundState.playerBudget}</small>
          </div>
        </section>

        <div className="board-grid">
          <div className="left-column">
            <section
              className={`task-panel ${roundState.task.accent}`}
              id="tutorial-brief"
            >
              <div className="task-meta">
                <span className="task-number">0{roundState.round}</span>
                <div>
                  <div className="eyebrow">brief da rodada</div>
                  <div className="task-audience">
                    {roundState.task.audience}
                  </div>
                </div>
                <div className="task-signal">
                  <span>sinal visível</span>
                  <strong>{roundState.task.signal}</strong>
                </div>
              </div>
              <h2>{roundState.task.title}</h2>
              <p>{roundState.task.brief}</p>
              <div className="task-tip">
                <Info size={15} />
                <span>
                  <b>insight:</b> {roundState.task.tip}
                </span>
              </div>
            </section>

            <section className="market-panel" id="tutorial-market">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">
                    <Gavel size={13} /> mercado de palavras
                  </div>
                  <h3>
                    Escolha suas cartas{" "}
                    <span>· {roundState.market.length} disponíveis</span>
                  </h3>
                </div>
                <div className="market-instruction">
                  <LockKeyhole size={13} /> qualidade oculta até o fim
                </div>
              </div>
              <div className="market-grid">
                {roundState.market.map((card, index) => (
                  <MarketCard
                    key={card.id}
                    card={card}
                    index={index}
                    selected={selectedIds.includes(card.id)}
                    disabled={phase !== "auction"}
                    scolded={scoldedId === card.id}
                    redundant={
                      !selectedIds.includes(card.id) &&
                      !REDUNDANCY_EXEMPT.has(card.type) &&
                      selectedCards.some(picked => picked.type === card.type)
                    }
                    onBuy={() => buyCard(card)}
                  />
                ))}
              </div>

              <div className="market-footer">
                <div className="selected-summary">
                  <span className="selected-count">{selectedCards.length}</span>
                  <span>
                    {selectedCards.length === 1 ? "carta" : "cartas"} no seu
                    prompt
                  </span>
                  <span className="selected-cost">{playerSpent} moedas</span>
                </div>
                <div className="seal-wrap">
                  {minCardsWarning && (
                    <span className="min-cards-callout" role="alert">
                      <TriangleAlert size={13} /> Um bom prompt é formado por 2
                      ou mais elementos
                    </span>
                  )}
                  <button
                    id="tutorial-submit"
                    className="primary-button"
                    disabled={phase !== "auction" || selectedIds.length === 0}
                    onClick={() => finishRound(selectedIds)}
                  >
                    {phase === "thinking" ? "CPU pensando…" : "Parar e revelar"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </section>

            {phase === "result" && result && (
              <section className="result-panel reveal-in" ref={resultRef}>
                <div className="result-heading">
                  <div>
                    <div className="eyebrow">
                      <Eye size={13} /> reflexão da rodada
                    </div>
                    <h3>{winnerLabel}</h3>
                    <p>
                      Agora a parte que ensina: compare valor absoluto com
                      eficiência.
                    </p>
                  </div>
                  <div
                    className={`winner-stamp ${result.winner} ${
                      aresWins ? "ares" : skullWins ? "skull" : ""
                    }`}
                  >
                    <Trophy size={18} />
                    <span>
                      {result.winner === "tie" ? "0 pts" : "+1 ponto"}
                    </span>
                  </div>
                </div>
                <div className="reveal-grid">
                  {/* ---------- LADO DO JOGADOR ---------- */}
                  <div
                    className={`reveal-side ${result.winner === "player" ? "winner-side" : ""}`}
                  >
                    <div className="reveal-side-head">
                      <span>
                        <UserRound size={13} /> seu prompt
                      </span>
                      <span>
                        <b>{formatScore(result.player.efficiency)}</b>
                        <small>efic.</small>
                      </span>
                    </div>
                    {result.player.cards.length ? (
                      result.player.cards.map(card => (
                        <RevealCard key={card.id} card={card} />
                      ))
                    ) : (
                      <div className="empty-reveal">
                        Nenhuma carta comprada nesta rodada.
                      </div>
                    )}
                    <div className="reveal-math">
                      <span>
                        qualidade <b>{result.player.quality}</b>
                      </span>
                      <span>
                        custo <b>{result.player.spent}</b>
                      </span>
                    </div>
                  </div>

                  {/* ---------- LADO DA CPU / ARES / SKULL ---------- */}
                  <div
                    className={`reveal-side ${result.winner === "cpu" ? "winner-side" : ""} ${
                      aresWins ? "ares-rage" : ""
                    } ${skullWins ? "skull-rage" : ""}`}
                  >
                    {aresWins && (
                      <div className="ares-taunt">
                        <Flame size={13} />
                        <span>Haha, desista</span>
                      </div>
                    )}
                    {skullWins && (
                      <div className="skull-taunt">
                        <Skull size={13} />
                        <span>Skull Persiste</span>
                      </div>
                    )}
                    <div className="reveal-side-head">
                      <span>
                        <roundState.personality.icon size={13} />{" "}
                        {roundState.personality.name} ·{" "}
                        {roundState.personality.title}
                      </span>
                      <span>
                        <b>{formatScore(result.cpu.efficiency)}</b>
                        <small>efic.</small>
                      </span>
                    </div>
                    {result.cpu.cards.length ? (
                      result.cpu.cards.map(card => (
                        <RevealCard key={card.id} card={card} />
                      ))
                    ) : (
                      <div className="empty-reveal">
                        A CPU não comprou nada.
                      </div>
                    )}
                    <div className="reveal-math">
                      <span>
                        qualidade <b>{result.cpu.quality}</b>
                      </span>
                      <span>
                        custo <b>{result.cpu.spent}</b>
                      </span>
                    </div>
                  </div>
                </div>

                {result.player.redundancyPenalty > 0 && (
                  <div className="trap-warning is-redundancy">
                    <Layers size={15} />
                    <span>
                      <b>−{result.player.redundancyPenalty} por redundância</b>{" "}
                      (
                      {Array.from(new Set(result.player.redundantTypes)).join(
                        ", "
                      )}
                      ). Duas instruções do mesmo tipo competem entre si — a IA
                      obedece uma e descarta a outra.{" "}
                      <b>Comprar tudo não é estratégia.</b>
                    </span>
                  </div>
                )}

                <div className="synergy-reveal">
                  <div className="synergy-icon">
                    <Zap size={15} />
                  </div>
                  <div>
                    <span>sinergia secreta revelada</span>
                    <strong>
                      {result.synergy.label} <b>+{result.synergy.bonus}</b>
                    </strong>
                    <p>
                      {result.synergy.note}{" "}
                      {result.player.synergyBonus || result.cpu.synergyBonus
                        ? "Ela estava ativa nesta mesa."
                        : "Ninguém montou a combinação completa."}
                    </p>
                    {result.player.specialSynergies
                      ?.filter(synergy => synergy.bonus > 0)
                      .map((synergy, index) => (
                        <div
                          key={`player-special-${index}`}
                          className="special-synergy is-player"
                        >
                          <span className="synergy-owner">você</span>
                          <div className="synergy-body">
                            <strong>{synergy.label}</strong>
                            <span>{synergy.note}</span>
                          </div>
                          <b>+{synergy.bonus} qualidade</b>
                        </div>
                      ))}

                    {result.player.cards.some(
                      c => c.trap || c.type.toUpperCase() === "VAGO"
                    ) && (
                      <div className="trap-synergy-reveal">
                        <div className="trap-synergy-icon">
                          <TriangleAlert size={16} />
                        </div>
                        <div>
                          <span className="trap-synergy-tag">
                            sinergia de armadilha ativada
                          </span>
                          <strong>
                            Armadilha da Vagueza{" "}
                            <b>−{result.player.trapPenalty} qualidade</b>
                          </strong>
                          <p>
                            <b>Por que você errou:</b> Você escolheu{" "}
                            {result.player.cards
                              .filter(
                                c => c.trap || c.type.toUpperCase() === "VAGO"
                              )
                              .map(c => `"${c.label}"`)
                              .join(", ")}
                            . Na Engenharia de Prompt, pedir para a IA "ser
                            criativa", "seja profissional", "Não seja muito
                            longo" ou "fazer o melhor possível" não dá nenhuma
                            instrução concreta sobre o que gerar. O modelo
                            precisa de regras, contexto, público e formato.
                            Cartas vagas apenas consomem moedas e derrubam sua
                            eficiência!
                          </p>
                        </div>
                      </div>
                    )}

                    {result.cpu.specialSynergies
                      ?.filter(synergy => synergy.bonus > 0)
                      .map((synergy, index) => (
                        <div
                          key={`cpu-special-${index}`}
                          className="special-synergy is-cpu"
                        >
                          <span className="synergy-owner">
                            {roundState.personality.name}
                          </span>
                          <div className="synergy-body">
                            <strong>{synergy.label}</strong>
                            <span>{synergy.note}</span>
                          </div>
                          <b>+{synergy.bonus} qualidade</b>
                        </div>
                      ))}
                  </div>
                </div>
                <button className="next-button" onClick={startNextRound}>
                  {roundState.round >= TOTAL_ROUNDS ||
                  score.player >= 3 ||
                  score.cpu >= 3
                    ? "Ver placar final"
                    : "Próxima rodada"}
                  <ChevronRight size={17} />
                </button>
              </section>
            )}
          </div>

          <aside className="right-column">
            <section className="coach-panel">
              <div className="coach-top">
                <div className="coach-icon">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="eyebrow">coach de eficiência</div>
                  <strong>O que faz um prompt bom?</strong>
                </div>
              </div>
              <p>{roundState.task.tip}</p>
              <div className="coach-rule">
                <span>regra #0{roundState.round}</span>
                <strong>{tip}</strong>
              </div>
            </section>
            <section className="deck-panel">
              <div className="panel-title">
                <span>seu prompt em construção</span>
                <span className="deck-count">
                  {selectedCards.length}/{roundState.market.length}
                </span>
              </div>
              {selectedCards.length === 0 ? (
                <div className="deck-empty">
                  <div className="empty-orbit">+</div>
                  <span>
                    Clique em uma carta do mercado
                    <br />
                    para começar a montar.
                  </span>
                </div>
              ) : (
                <div className="deck-list">
                  {selectedCards.map(card => (
                    <div className="deck-row" key={card.id}>
                      <span className="deck-symbol">{card.symbol}</span>
                      <div>
                        <strong>{card.label}</strong>
                        <small>{card.type}</small>
                      </div>
                      <span className="deck-cost">{card.liveCost}</span>
                    </div>
                  ))}
                  <div className="deck-total">
                    <span>saldo após compras</span>
                    <b>
                      {wallet} <Coins size={13} />
                    </b>
                  </div>
                </div>
              )}
              <div className="efficiency-note">
                <Gauge size={14} />
                <span>
                  Seu score final será <b>qualidade ÷ custo</b>.
                </span>
              </div>
            </section>
            <button
              className="library-cta"
              title="Abrir biblioteca de sinergias"
              aria-label="Abrir biblioteca de sinergias"
              onClick={() => setLibraryOpen(true)}
            >
              <span className="library-cta-icon">
                <Library size={18} />
              </span>
              <span className="library-cta-copy">
                <strong>Descubra suas sinergias</strong>
                <small>
                  {discoveredSynergies.length}/{LIBRARY_SYNERGIES.length}{" "}
                  desbloqueadas · clique para explorar
                </small>
              </span>
              <ArrowRight size={15} />
            </button>

            {hasDefeatedAres && (
              <button
                className={`skull-challenge-btn ${
                  roundState.personality.name === "Skull" ? "is-active" : ""
                }`}
                title="Desafiar a entidade Skull (+40 de vantagem)"
                aria-label="Desafiar Skull"
                onClick={fightSkull}
                disabled={phase === "thinking"}
              >
                <span className="skull-challenge-icon">
                  <Skull size={18} />
                </span>
                <span className="skull-challenge-copy">
                  <span className="skull-challenge-heading">
                    <strong>
                      {roundState.personality.name === "Skull"
                        ? "Em duelo com Skull"
                        : "Lutar com Skull"}
                    </strong>
                    <span className="skull-challenge-tag">+40 VANTAGEM</span>
                  </span>
                  <small>
                    {roundState.personality.name === "Skull"
                      ? "Batalha ativa contra o Abismo"
                      : "Oponente secreto desbloqueado"}
                  </small>
                </span>
                <Swords size={16} className="skull-challenge-swords" />
              </button>
            )}

            <section className="cpu-panel">
              <div className="cpu-head">
                <div
                  className={`cpu-avatar ${
                    roundState.personality.name === "Skull"
                      ? "skull-avatar"
                      : ""
                  }`}
                  style={
                    roundState.personality.name === "Skull"
                      ? {
                          background: "#08080a",
                          color: "#ffffff",
                          border: "1px solid rgba(255, 255, 255, 0.28)",
                          boxShadow:
                            "0 0 16px rgba(0, 0, 0, 0.95), inset 0 0 8px rgba(255, 255, 255, 0.08)",
                        }
                      : roundState.personality.title === "BOSS"
                        ? { background: "#ff5252", color: "#4a0000" }
                        : {}
                  }
                >
                  {roundState.personality.name === "Skull" ? (
                    <Skull size={16} />
                  ) : roundState.personality.title === "BOSS" ? (
                    <Flame size={16} />
                  ) : (
                    <Bot size={16} />
                  )}
                </div>
                <div>
                  <div className="eyebrow">adversária da rodada</div>
                  <strong>
                    {roundState.personality.name}{" "}
                    <span>· {roundState.personality.title}</span>
                  </strong>
                </div>
                <span className="cpu-live">
                  <span /> ao vivo
                </span>
              </div>
              <p>
                {phase === "auction"
                  ? "Ela está escolhendo em silêncio…"
                  : phase === "thinking"
                    ? "Calculando eficiência…"
                    : roundState.personality.detail}
              </p>
              {phase === "auction" ? (
                <div className="cpu-blinds">
                  <span />
                  <span />
                  <span />
                </div>
              ) : result ? (
                <Scorebar
                  label="eficiência CPU"
                  value={result.cpu.efficiency}
                  max={12}
                  color="orange"
                />
              ) : null}
            </section>
            <div className="notice-bar">
              <div className="notice-icon">
                <Info size={14} />
              </div>
              <span>{notice}</span>
            </div>
          </aside>
        </div>

        {phase === "gameover" && (
          <div className="gameover-card">
            <div className="gameover-glow" />
            <div className="eyebrow">
              <Trophy size={14} /> fim da partida
            </div>
            <h2>
              {score.player > score.cpu
                ? "Você dominou a mesa."
                : score.cpu > score.player
                  ? "A CPU levou a série."
                  : "Série empatada."}
            </h2>
            <p>
              {score.player > score.cpu
                ? "Você aprendeu a investir em contexto, intenção e restrições — não apenas em palavras bonitas."
                : "A lição ficou clara: a carta mais cara não garante a melhor resposta. Tente outra leitura do mercado."}
            </p>
            <div className="final-score">
              <div>
                <span>você</span>
                <strong>{score.player}</strong>
              </div>
              <i>×</i>
              <div>
                <span>CPU</span>
                <strong>{score.cpu}</strong>
              </div>
            </div>
            <button className="primary-button" onClick={restartMatch}>
              <RotateCcw size={16} /> jogar novamente
            </button>
          </div>
        )}
      </main>
      {skullWins && !dismissSkullScreen && (
        <div
          className="skull-persist-screen"
          role="dialog"
          aria-modal="true"
          aria-labelledby="skull-persist-title"
        >
          <div className="skull-persist-backdrop" />
          <div className="skull-persist-vignette" />
          <div className="skull-persist-particles" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="skull-persist-content">
            <div className="skull-persist-glitch" aria-hidden="true">
              <Skull size={44} strokeWidth={1.7} />
            </div>
            <div className="skull-persist-badge">ANOMALIA · +40 VANTAGEM</div>
            <h1 id="skull-persist-title" className="skull-persist-title">
              Skull Persiste
            </h1>
            <p className="skull-persist-subtitle">
              Skull - Uma IA LLM corrompida encontrada nas entranhas da DarkWeb,
              ela sonda o cyberespaço dark infinitamente.
            </p>
            {result && (
              <div className="skull-persist-scores">
                <div className="skull-persist-card">
                  <span>SEU SCORE</span>
                  <strong>{formatScore(result.player.efficiency)}</strong>
                  <small>
                    qualidade {result.player.quality} ÷ {result.player.spent}
                  </small>
                </div>
                <div className="skull-persist-divider">VS</div>
                <div className="skull-persist-card is-skull">
                  <span>SKULL (+40)</span>
                  <strong>{formatScore(result.cpu.efficiency)}</strong>
                  <small>
                    qualidade {result.cpu.quality} ÷ {result.cpu.spent}
                  </small>
                </div>
              </div>
            )}
            <div className="skull-persist-actions">
              <button
                className="skull-persist-btn primary"
                onClick={startNextRound}
              >
                <span>Próxima rodada</span>
                <ArrowRight size={16} />
              </button>
              <button
                className="skull-persist-btn secondary"
                onClick={fightSkull}
              >
                <RotateCcw size={15} />
                <span>Tentar novamente</span>
              </button>
              <button
                className="skull-persist-btn ghost"
                onClick={() => setDismissSkullScreen(true)}
              >
                <Eye size={15} />
                <span>Ver tabuleiro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {skullWins && dismissSkullScreen && (
        <aside
          className="skull-dismissed-banner"
          onClick={() => setDismissSkullScreen(false)}
          title="Clique para restaurar a tela cheia de Skull"
        >
          <Skull size={15} />
          <span>
            <b>Skull Persiste</b> — +40 de vantagem venceu esta rodada (clique
            para voltar)
          </span>
        </aside>
      )}

      {playerWinsAgainstSkull && !dismissWhiteVictoryScreen && (
        <div
          className="white-victory-screen"
          role="dialog"
          aria-modal="true"
          aria-labelledby="white-victory-title"
        >
          <div className="white-victory-backdrop" />
          <div className="white-victory-radiance" />
          <div className="white-victory-particles" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="white-victory-content">
            <div className="white-victory-badge">
              <Sparkles size={16} />
              <span>MESTRE DA ENGENHARIA DE PROMPT · PURIFICAÇÃO TOTAL</span>
            </div>
            <div className="white-victory-icon-wrap">
              <Trophy size={48} strokeWidth={2} />
            </div>
            <h1 id="white-victory-title" className="white-victory-title">
              Você Venceu Skull!
            </h1>
            <h2 className="white-victory-subtitle">
              Você se tornou um mestre em engenharia de prompt e limpou a
              DarkWeb da IA corrompida.
            </h2>
            <p className="white-victory-desc">
              Sua maestria na arquitetura de instruções, clareza e sinergia de
              contexto superou os 40 pontos de vantagem nativa do abismo. A
              entidade corrompida que sondava o ciberespaço sombrio foi
              purificada e desintegrada pela sua precisão lógica.
            </p>

            <div className="white-victory-scores">
              <div className="white-victory-card is-player">
                <span>SUA EFICIÊNCIA</span>
                <strong>
                  {result ? formatScore(result.player.efficiency) : "18.5"}
                </strong>
                <small>
                  {result
                    ? `qualidade ${result.player.quality} ÷ custo ${result.player.spent}`
                    : "prompt arquitetado com maestria"}
                </small>
              </div>
              <div className="white-victory-vs">×</div>
              <div className="white-victory-card is-defeated">
                <span>SKULL (PURIFICADO)</span>
                <strong>
                  {result ? formatScore(result.cpu.efficiency) : "14.2"}
                </strong>
                <small>
                  {result
                    ? `qualidade ${result.cpu.quality} ÷ custo ${result.cpu.spent}`
                    : "+40 de vantagem superados"}
                </small>
              </div>
            </div>

            <div className="white-victory-actions">
              <button
                className="white-victory-btn primary"
                onClick={() => {
                  setDismissWhiteVictoryScreen(false);
                  if (isTestWinSkull) {
                    window.history.replaceState(
                      {},
                      document.title,
                      window.location.pathname
                    );
                  }
                  restartMatch();
                }}
              >
                <RotateCcw size={16} />
                <span>Jogar novamente</span>
              </button>
              {result && (
                <button
                  className="white-victory-btn secondary"
                  onClick={startNextRound}
                >
                  <span>Próxima rodada</span>
                  <ArrowRight size={16} />
                </button>
              )}
              <button
                className="white-victory-btn ghost"
                onClick={() => setDismissWhiteVictoryScreen(true)}
              >
                <Eye size={16} />
                <span>Ver tabuleiro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {playerWinsAgainstSkull && dismissWhiteVictoryScreen && (
        <aside
          className="white-dismissed-banner"
          onClick={() => setDismissWhiteVictoryScreen(false)}
          title="Clique para voltar para a tela de vitória"
        >
          <Trophy size={16} />
          <span>
            <b>Mestre em Engenharia de Prompt!</b> — Você limpou a DarkWeb e
            derrotou Skull (clique para voltar)
          </span>
        </aside>
      )}
      {tutorialStep !== null && (
        <>
          <div
            className="tutorial-backdrop-wrapper"
            onClick={e => {
              if (tutorialTargetRect) {
                const { clientX, clientY } = e;
                if (
                  clientX >= tutorialTargetRect.left - 6 &&
                  clientX <=
                    tutorialTargetRect.left + tutorialTargetRect.width + 6 &&
                  clientY >= tutorialTargetRect.top - 6 &&
                  clientY <=
                    tutorialTargetRect.top + tutorialTargetRect.height + 6
                ) {
                  return;
                }
              }
              setTutorialStep(null);
            }}
          >
            <svg
              className="tutorial-backdrop-svg"
              width="100%"
              height="100%"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <mask id="tutorial-spotlight-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {tutorialTargetRect && (
                    <rect
                      x={tutorialTargetRect.left - 6}
                      y={tutorialTargetRect.top - 6}
                      width={tutorialTargetRect.width + 12}
                      height={tutorialTargetRect.height + 12}
                      rx="10"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(2, 6, 14, 0.62)"
                mask="url(#tutorial-spotlight-mask)"
              />
              {tutorialTargetRect && (
                <rect
                  x={tutorialTargetRect.left - 6}
                  y={tutorialTargetRect.top - 6}
                  width={tutorialTargetRect.width + 12}
                  height={tutorialTargetRect.height + 12}
                  rx="10"
                  fill="none"
                  stroke="#ffb461"
                  strokeWidth="3"
                  className="tutorial-spotlight-border"
                />
              )}
            </svg>
          </div>

          <aside
            className="tutorial-overlay-container"
            role="region"
            aria-label="Tutorial guiado da primeira rodada"
          >
            <div
              className="tutorial-callout-card"
              role="dialog"
              aria-modal="false"
            >
              <div className="tutorial-card-header">
                <div className="tutorial-step-badge">
                  <Compass size={13} />
                  <span>{TUTORIAL_STEPS[tutorialStep].badge}</span>
                </div>
                <button
                  className="tutorial-dismiss-btn"
                  onClick={() => setTutorialStep(null)}
                  title="Pular tutorial"
                  aria-label="Pular tutorial"
                >
                  ×
                </button>
              </div>

              <h4 className="tutorial-title">
                {TUTORIAL_STEPS[tutorialStep].title}
              </h4>
              <p className="tutorial-desc">
                {TUTORIAL_STEPS[tutorialStep].description}
              </p>

              <div className="tutorial-tip-line">
                <Lightbulb size={15} className="tip-icon" />
                <span>{TUTORIAL_STEPS[tutorialStep].tip}</span>
              </div>

              <div className="tutorial-footer">
                <div className="tutorial-step-dots">
                  {TUTORIAL_STEPS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`step-dot ${
                        i === tutorialStep
                          ? "is-active"
                          : i < tutorialStep
                            ? "is-done"
                            : ""
                      }`}
                      onClick={() => setTutorialStep(i)}
                      title={`Ir para passo ${i + 1}`}
                      aria-label={`Passo ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="tutorial-nav-buttons">
                  {tutorialStep > 0 && (
                    <button
                      type="button"
                      className="tutorial-nav-btn back"
                      onClick={() => setTutorialStep(s => (s ?? 1) - 1)}
                    >
                      <ChevronLeft size={13} /> Anterior
                    </button>
                  )}
                  {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                    <button
                      type="button"
                      className="tutorial-nav-btn next"
                      onClick={() => setTutorialStep(s => (s ?? 0) + 1)}
                    >
                      Próximo <ChevronRight size={13} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="tutorial-nav-btn finish"
                      onClick={() => setTutorialStep(null)}
                    >
                      <Check size={13} /> Começar a Jogar!
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {libraryOpen && (
        <div
          className="info-backdrop"
          role="presentation"
          onClick={() => setLibraryOpen(false)}
        >
          <section
            className="info-modal synergy-library-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-title"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="info-back"
              aria-label="Voltar"
              onClick={() => setLibraryOpen(false)}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <button
              className="info-close"
              aria-label="Fechar biblioteca"
              onClick={() => setLibraryOpen(false)}
            >
              ×
            </button>
            <div className="eyebrow">
              <Library size={13} /> biblioteca de descobertas
            </div>
            <div className="library-title-row">
              <div>
                <h2 id="library-title">Sinergias descobertas</h2>
                <p>
                  Explore as combinações que você já revelou. As demais
                  permanecem em segredo.
                </p>
              </div>
              <strong className="library-progress">
                {discoveredSynergies.length}/{LIBRARY_SYNERGIES.length}
              </strong>
            </div>
            <div className="synergy-library-list">
              {LIBRARY_SYNERGIES.map(synergy => {
                const discovered = discoveredSynergies.includes(synergy.id);
                return (
                  <div
                    className={`library-item ${discovered ? "is-discovered" : "is-locked"}`}
                    key={synergy.id}
                  >
                    <div className="library-item-icon">
                      {discovered ? (
                        <Sparkles size={16} />
                      ) : (
                        <LockKeyhole size={15} />
                      )}
                    </div>
                    <div className="library-item-copy">
                      <div>
                        <span>{synergy.category}</span>
                        <strong>
                          {discovered ? synergy.label : "Sinergia bloqueada"}
                        </strong>
                      </div>
                      {discovered ? (
                        <>
                          <p>{synergy.detail}</p>
                          <small>
                            {synergy.requirement} · +{synergy.bonus} qualidade
                          </small>
                        </>
                      ) : (
                        <p className="locked-copy">
                          Descubra uma nova combinação durante uma rodada para
                          revelar esta entrada.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <small className="help-footer">
              A biblioteca fica salva neste navegador e cresce conforme você
              aprende a construir prompts melhores.
            </small>
          </section>
        </div>
      )}
      {infoOpen && (
        <div
          className="info-backdrop"
          role="presentation"
          onClick={() => setInfoOpen(false)}
        >
          <section
            className="info-modal help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-title"
            onClick={event => event.stopPropagation()}
          >
            <div className="info-modal-header">
              <button
                className="info-back"
                aria-label="Voltar"
                onClick={() => setInfoOpen(false)}
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <button
                className="info-close"
                aria-label="Fechar ajuda"
                onClick={() => setInfoOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="help-modal-body">
              <div className="eyebrow">
                <CircleHelp size={13} /> guia didático para iniciantes
              </div>
              <h2 id="info-title">Como dominar a Engenharia de Prompt</h2>
              <p className="help-lead">
                A <b>Engenharia de Prompt</b> não é programação de computadores:
                é a arte de saber pedir. Ao invés de digitar pedidos vagos, você
                aprende a combinar clareza, contexto e foco para extrair
                respostas precisas de qualquer Inteligência Artificial.
              </p>

              {/* SEÇÃO 1: O que são os Elementos na vida real */}
              <div className="help-didactic-card">
                <div className="help-card-header">
                  <div className="help-card-icon sparkles">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className="help-card-eyebrow">
                      Conceito Prático #01
                    </span>
                    <h3>O que são os "Elementos" do jogo na vida real?</h3>
                  </div>
                </div>

                <p className="help-card-text">
                  Na vida real, nós não "compramos cartas". Em vez disso, nós
                  digitamos esses elementos diretamente dentro de um texto
                  enviado para a IA. Um bom prompt é a soma harmônica de várias
                  instruções complementares.
                </p>

                <div className="prompt-highlighter-block">
                  <span className="highlighter-lead">
                    Na vida real, um bom prompt é a soma de vários elementos.
                    Veja como as cartas do jogo se parecem em uma frase:
                  </span>
                  <div className="prompt-highlighter-preview">
                    <span className="highlight-tag tag-persona">
                      Quero que você aja como um Especialista em Marketing.{" "}
                      <small>(Carta: Persona)</small>
                    </span>
                    <span className="highlight-tag tag-format">
                      Escreva um Post para o Instagram{" "}
                      <small>(Carta: Formato)</small>
                    </span>{" "}
                    <span className="highlight-tag tag-context">
                      sobre nosso novo tênis de corrida,{" "}
                      <small>(Carta: Contexto)</small>
                    </span>
                    <span className="highlight-tag tag-tone">
                      usando um <strong>tom empolgante.</strong>{" "}
                      <small>(Carta: Tom)</small>
                    </span>
                  </div>
                </div>

                <div className="highlighter-legend-grid">
                  <div className="legend-item persona">
                    <span className="legend-dot" />
                    <div>
                      <strong>Persona</strong>
                      <small>Quem a IA interpreta</small>
                    </div>
                  </div>
                  <div className="legend-item format">
                    <span className="legend-dot" />
                    <div>
                      <strong>Formato</strong>
                      <small>Estrutura da resposta</small>
                    </div>
                  </div>
                  <div className="legend-item context">
                    <span className="legend-dot" />
                    <div>
                      <strong>Contexto</strong>
                      <small>O assunto ou produto</small>
                    </div>
                  </div>
                  <div className="legend-item tone">
                    <span className="legend-dot" />
                    <div>
                      <strong>Tom</strong>
                      <small>Estilo e emoção</small>
                    </div>
                  </div>
                </div>

                <div className="help-callout-box">
                  <strong>💡 Dica da Arena:</strong> No jogo você não escreve o
                  prompt digitando cada palavra. O seu papel é escolher e
                  comprar as cartas que representam os melhores{" "}
                  <strong>elementos</strong> para compor o resultado solicitado
                  sem desperdícios!
                </div>
              </div>

              {/* SEÇÃO 2: A Metáfora do Custo */}
              <div className="help-didactic-card cost-card">
                <div className="help-card-header">
                  <div className="help-card-icon coins">
                    <Coins size={16} />
                  </div>
                  <div>
                    <span className="help-card-eyebrow">
                      Conceito Prático #02
                    </span>
                    <h3>A Metáfora do Custo</h3>
                  </div>
                </div>

                <p className="help-card-text quote-style">
                  Por que as cartas têm custo? O custo no jogo representa o
                  tempo que você gasta pensando e digitando aquela instrução,
                  além do 'custo de processamento' (tokens) da própria IA.
                  Elementos complexos como 'Cadeia de Pensamento' dão mais
                  trabalho para escrever, por isso custam mais caro, mas
                  entregam muita qualidade.
                </p>

                <div className="cost-pills-row">
                  <div className="cost-pill">
                    <span className="cost-pill-badge">Tempo & Esforço</span>
                    <small>
                      O tempo que você leva planejando e refinando comandos
                    </small>
                  </div>
                  <div className="cost-pill">
                    <span className="cost-pill-badge">Tokens da IA</span>
                    <small>
                      Cada palavra processada consome recursos computacionais
                    </small>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: A Lição do Boss (Menos é Mais) */}
              <div className="help-didactic-card boss-card">
                <div className="help-card-header">
                  <div className="help-card-icon swords">
                    <Swords size={16} />
                  </div>
                  <div>
                    <span className="help-card-eyebrow">
                      Estratégia Avançada #03
                    </span>
                    <h3>Como vencer o Boss (Ares) e o Over-prompting</h3>
                  </div>
                </div>

                <p className="help-card-text quote-style">
                  O Boss tem uma vantagem injusta de +20 pontos nativos,
                  simulando uma Inteligência Artificial de última geração. Para
                  vencê-lo, você não pode comprar muitas cartas. Você precisa
                  usar no máximo 1 ou 2 cartas baratas e precisas para ter uma
                  Eficiência gigante. Isso ensina a regra de ouro da IA: 'Menos
                  é Mais'. Modelos avançados não precisam de textos gigantescos
                  e cheios de regras (over-prompting). Instruções diretas,
                  cirúrgicas e curtas geram respostas mais rápidas, baratas e
                  eficientes.
                </p>

                <div className="efficiency-formula-box">
                  <div className="formula-head">
                    <Gauge size={14} /> Fórmula do Jogo: Eficiência = Qualidade
                    ÷ Custo
                  </div>
                  <div className="formula-comparison">
                    <div className="formula-side bad">
                      <span>Over-prompting (Erro Comum)</span>
                      <strong>50 Qualidade ÷ 25 Custo = 2.0</strong>
                      <small>
                        Comprou cartas demais, inflou o custo e perdeu na
                        eficiência.
                      </small>
                    </div>
                    <div className="formula-vs">vs</div>
                    <div className="formula-side good">
                      <span>Instrução Cirúrgica (Mestre)</span>
                      <strong>36 Qualidade ÷ 3 Custo = 12.0</strong>
                      <small>
                        Poucas cartas precisas = Eficiência esmagadora!
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Como Funciona o Jogo */}
              <div className="help-didactic-card rules-card">
                <div className="eyebrow" style={{ marginBottom: "12px" }}>
                  <Gavel size={13} /> como funciona a rodada
                </div>
                <div className="help-steps">
                  <div className="help-step">
                    <span>01</span>
                    <div>
                      <strong>Monte sua estratégia</strong>
                      <small>
                        Analise o brief da rodada e compre cartas de elementos
                        (Persona, Contexto, Tom) que melhor resolvem o desafio.
                      </small>
                    </div>
                  </div>
                  <div className="help-step">
                    <span>02</span>
                    <div>
                      <strong>Foque na eficiência</strong>
                      <small>
                        A qualidade das cartas é oculta. O vencedor não é quem
                        gasta mais moedas, mas quem gera mais valor pelo menor
                        custo.
                      </small>
                    </div>
                  </div>
                  <div className="help-step">
                    <span>03</span>
                    <div>
                      <strong>Descubra sinergias</strong>
                      <small>
                        Existem combinações secretas. Juntar as cartas certas
                        destrava bônus substanciais de pontuação!
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Tutorial Guiado */}
              <div className="help-tutorial-cta-wrap">
                <button
                  type="button"
                  className="help-guided-tutorial-btn"
                  onClick={startGuidedTutorial}
                >
                  <div className="btn-icon-pulse">
                    <Compass size={20} />
                  </div>
                  <div className="btn-text-block">
                    <span className="btn-main-label">Tutorial Guiado</span>
                    <small className="btn-sub-label">
                      Ir para a tela principal e ver onde clicar com callouts
                      explicativos
                    </small>
                  </div>
                  <ArrowRight size={18} className="btn-arrow" />
                </button>
              </div>

              <div className="info-divider" style={{ margin: "24px 0 16px" }} />
              <small className="help-footer">
                Cada rodada embaralha tarefas, cartas, preços e sinergias.
                Jogue, revele e use a reflexão para melhorar seus prompts na
                vida real.
              </small>
              <div className="rights-line">
                Jogo criado pela{" "}
                <img
                  className="inline-wordmark"
                  src="/LogoSemFundoComBranco.png"
                  alt="TolazzAI"
                />{" "}
                para ensinar prompt engineering · Todos os direitos reservados
              </div>
            </div>
          </section>
        </div>
      )}
      <footer className="footer">
        <span>
          Prompt Auction /{" "}
          <img
            className="footer-wordmark"
            src="LogoSemFundoComBranco.png"
            alt="TolazzAI"
          />
        </span>
        <span>construído para aprender jogando</span>
        <span>rodada local · seus dados ficam aqui</span>
      </footer>
    </div>
  );
}
