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
  CircleHelp,
  Coins,
  Eye,
  Flame,
  Gavel,
  Gauge,
  Info,
  Library,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Target,
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

type Evaluation = {
  cards: Card[];
  spent: number;
  baseQuality: number;
  focusBonus: number;
  synergyBonus: number;
  specialSynergy: { label: string; bonus: number; note: string } | null;
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
    cost: 4,
    quality: 10,
    tags: ["specific", "evidence"],
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
    type: "ESTRUTURA",
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
    label: "Despedida",
    type: "FORMATO",
    description: "Fecha o texto com cuidado e direção.",
    cost: 1,
    quality: 5,
    tags: ["tone"],
    symbol: "↳",
  },
  {
    id: "subject",
    label: "Título de e-mail",
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
    cost: 4,
    quality: 10,
    tags: ["specific", "creative", "example"],
    symbol: "▧",
  },
  {
    id: "example-2",
    label: "Segundo exemplo",
    type: "EXEMPLO",
    description: "Adiciona uma segunda demonstração para revelar um padrão.",
    cost: 4,
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
    category: "RARO",
    requirement: "Persona + Tarefa + Público + Contexto + Formato",
    detail: "Os cinco pilares formam uma arquitetura completa de prompt.",
    bonus: 30,
    matches: cards =>
      hasTypes(cards, ["PERSONA", "TAREFA", "PÚBLICO", "CONTEXTO", "FORMATO"]),
  },
  {
    id: "self-eval-critique",
    label: "Autoavaliação e Crítica",
    category: "QUALIDADE",
    requirement: "1 carta de Autoavaliação",
    detail:
      "Forçar a IA a revisar criticamente a própria resposta antes de entregá-la reduz erros e alucinações.",
    bonus: 15,
    matches: cards => cards.some(card => card.id === "self_eval"),
  },
  {
    id: "cot-reasoning",
    label: "Chain of Thought (CoT)",
    category: "ESTRATÉGIA",
    requirement: "1 carta de Cadeia de Pensamento",
    detail:
      "Obrigar a IA a descrever sua lógica antes do resultado final previne erros matemáticos e alucinações complexas.",
    bonus: 20,
    matches: cards => cards.some(card => card.id === "chain_of_thought"),
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
    if (personality.title === "estrategista" || personality.title === "BOSS")
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
      : personality.title === "estrategista" || personality.title === "BOSS"
        ? 3
        : 2;
  for (const card of ranking) {
    const price = card.liveCost ?? card.cost;
    if (picks.length >= maxCards || spend + price > budget) continue;
    picks.push(card.id);
    spend += price;
  }
  return picks;
}

function buildRound(
  round: number,
  playerBudget: number,
  cpuBudget: number,
  previousTaskId = "",
  previousMarketIds: string[] = []
): RoundState {
  const entropy = Math.random() * 100000 + Date.now() + round * 7919;
  const taskPool = TASKS.filter(candidate => candidate.id !== previousTaskId);
  const task =
    taskPool[Math.floor(Math.random() * taskPool.length)] ?? TASKS[0];
  const random = Math.random();
  const synergy =
    task.synergyOptions[Math.floor(random * task.synergyOptions.length)];
  const personality = getPersonality(round);
  const previousIds = new Set(previousMarketIds);
  const randomizedCards = shuffled(CARDS, entropy);
  const freshCards = randomizedCards.filter(card => !previousIds.has(card.id));
  const coreIds = ["persona", "context", "audience"];
  const coreCards = coreIds
    .map(id => randomizedCards.find(card => card.id === id))
    .filter((card): card is Card => Boolean(card));
  const exampleCards = shuffled(
    CARDS.filter(card => card.tags.includes("example")),
    entropy + 41
  ).slice(0, 1);
  const guaranteedIds = new Set(
    [...coreCards, ...exampleCards].map(card => card.id)
  );
  const marketPool = [
    ...coreCards,
    ...exampleCards,
    ...freshCards.filter(card => !guaranteedIds.has(card.id)),
    ...randomizedCards.filter(card => !guaranteedIds.has(card.id)),
  ];
  const market = marketPool.slice(0, 10).map((card, index) => ({
    ...card,
    liveCost: Math.max(1, Math.round(card.cost * (0.8 + Math.random() * 0.4))),
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
  const synergyActive = synergy.tags.every(tag =>
    cards.some(card => card.tags.includes(tag))
  );
  const synergyBonus = synergyActive ? synergy.bonus : 0;
  const exampleCount = cards.filter(card =>
    card.tags.includes("example")
  ).length;
  const pitacoOrder = ["PERSONA", "TAREFA", "PÚBLICO", "CONTEXTO", "FORMATO"];
  const isPitaco = pitacoOrder.every(requiredType =>
    cards.some(card => card.type === requiredType)
  );
  const hasSelfEval = cards.some(card => card.id === "self_eval");
  const hasCoT = cards.some(card => card.id === "chain_of_thought");

  const specialSynergy = isPitaco
    ? {
        label: "Método PITACO",
        bonus: 30,
        note: "Persona, Tarefa, Público, Contexto e Formato na ordem certa formam uma arquitetura rara.",
      }
    : hasCoT
      ? {
          label: "Chain of Thought (CoT)",
          bonus: 20,
          note: "Obrigar a IA a raciocinar passo a passo antes da resposta previne erros de lógica.",
        }
      : hasSelfEval
        ? {
            label: "Autoavaliação e Crítica",
            bonus: 15,
            note: "Pedir uma revisão crítica antes da resposta final eleva o raciocínio da IA.",
          }
        : exampleCount > 1
          ? {
              label: "Few-shot",
              bonus: 18,
              note: "Mais de um exemplo ajuda a IA a inferir o padrão antes de responder.",
            }
          : exampleCount === 1
            ? {
                label: "One-shot",
                bonus: 10,
                note: "Um exemplo concreto mostra à IA o estilo ou padrão esperado.",
              }
            : null;
  const specialBonus = specialSynergy?.bonus ?? 0;
  const discoveredLibraryIds = LIBRARY_SYNERGIES.filter(entry =>
    entry.matches(cards, task, synergyActive)
  ).map(entry => entry.id);
  const quality = baseQuality + focusBonus + synergyBonus + specialBonus;
  return {
    cards,
    spent,
    baseQuality,
    focusBonus,
    synergyBonus,
    specialSynergy,
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
  onBuy,
  index,
}: {
  card: Card;
  selected: boolean;
  disabled: boolean;
  onBuy: () => void;
  index: number;
}) {
  return (
    <button
      className={`market-card ${selected ? "is-selected" : ""}`}
      disabled={disabled || selected}
      onClick={onBuy}
      style={{ "--delay": `${index * 45}ms` } as CSSProperties}
    >
      <div className="market-card-top">
        <span className="card-symbol">{card.symbol}</span>
        <span className="card-type">{card.type}</span>
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
    <div className="reveal-card">
      <div className="reveal-card-symbol">{card.symbol}</div>
      <div className="reveal-card-copy">
        <strong>{card.label}</strong>
        <span>{card.type}</span>
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
  const demoRound = useRef(0);
  const [infoOpen, setInfoOpen] = useState(true);
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
  const revealTimer = useRef<number | null>(null);

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
      // Bônus roubado do BOSS (20 pontos de qualidade extras)
      if (roundState.personality.title === "BOSS") {
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
      if (winner !== "tie")
        setScore(current => ({ ...current, [winner]: current[winner] + 1 }));
      setPhase("result");
      setNotice(
        winner === "player"
          ? "Sua eficiência encontrou o ponto certo."
          : winner === "cpu"
            ? "A CPU levou essa pela relação valor/moeda."
            : "Empate técnico — a eficiência ficou colada."
      );
    }, 900);
  };

  useEffect(
    () => () => {
      if (revealTimer.current) window.clearTimeout(revealTimer.current);
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
    const price = card.liveCost ?? card.cost;
    if (selectedIds.includes(card.id)) return;
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
    setRoundState(
      buildRound(
        roundState.round + 1,
        nextPlayerBudget,
        nextCpuBudget,
        roundState.task.id,
        roundState.market.map(card => card.id)
      )
    );
    setSelectedIds([]);
    setResult(null);
    setPhase("auction");
    setNotice(
      "Novo mercado, nova combinação. Nenhuma carta revela tudo de primeira."
    );
  };

  const restartMatch = () => {
    setRoundState(buildRound(1, 25, 25));
    setSelectedIds([]);
    setResult(null);
    setScore({ player: 0, cpu: 0 });
    setPhase("auction");
    setNotice(
      "Nova partida iniciada. O melhor prompt nem sempre é o mais caro."
    );
    demoRound.current = 0;
  };

  const winnerLabel =
    result?.winner === "player"
      ? "Você venceu a rodada"
      : result?.winner === "cpu"
        ? "A CPU venceu a rodada"
        : "Empate técnico";
  const phaseLabel =
    phase === "auction"
      ? "leilão aberto"
      : phase === "thinking"
        ? "revelando lógica"
        : phase === "result"
          ? "resultado"
          : "partida encerrada";

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
          <div className="wallet">
            <Coins size={15} />
            <span>seu saldo</span>
            <strong>{wallet}</strong>
            <small>/ {roundState.playerBudget}</small>
          </div>
        </section>

        <div className="board-grid">
          <div className="left-column">
            <section className={`task-panel ${roundState.task.accent}`}>
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

            <section className="market-panel">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">
                    <Gavel size={13} /> mercado de palavras
                  </div>
                  <h3>
                    Escolha suas cartas <span>· 10 disponíveis</span>
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
                    selected={selectedIds.includes(card.id)}
                    disabled={phase !== "auction" || card.liveCost! > wallet}
                    onBuy={() => buyCard(card)}
                    index={index}
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
                <button
                  className="primary-button"
                  onClick={() => finishRound(selectedIds)}
                  disabled={phase !== "auction" || selectedIds.length === 0}
                >
                  {phase === "thinking" ? "CPU pensando…" : "Parar e revelar"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>

            {phase === "result" && result && (
              <section className="result-panel reveal-in">
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
                  <div className={`winner-stamp ${result.winner}`}>
                    <Trophy size={18} />
                    <span>
                      {result.winner === "tie" ? "0 pts" : "+1 ponto"}
                    </span>
                  </div>
                </div>
                <div className="reveal-grid">
                  <div
                    className={`reveal-side player-side ${result.winner === "player" ? "winner-side" : ""}`}
                  >
                    <div className="reveal-side-head">
                      <span>
                        <UserRound size={14} /> seu prompt
                      </span>
                      <b>
                        {formatScore(result.player.efficiency)}{" "}
                        <small>efic.</small>
                      </b>
                    </div>
                    {result.player.cards.length ? (
                      result.player.cards.map(card => (
                        <RevealCard key={card.id} card={card} />
                      ))
                    ) : (
                      <div className="empty-reveal">
                        Você parou sem comprar cartas.
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
                  <div
                    className={`reveal-side cpu-side ${result.winner === "cpu" ? "winner-side" : ""}`}
                  >
                    <div className="reveal-side-head">
                      <span>
                        {roundState.personality.title === "BOSS" ? (
                          <Flame size={14} color="#ff5252" />
                        ) : (
                          <Bot size={14} />
                        )}{" "}
                        {roundState.personality.name} ·{" "}
                        {roundState.personality.title}
                      </span>
                      <b>
                        {formatScore(result.cpu.efficiency)}{" "}
                        <small>efic.</small>
                      </b>
                    </div>
                    {result.cpu.cards.map(card => (
                      <RevealCard key={card.id} card={card} />
                    ))}
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
                    {(result.player.specialSynergy ||
                      result.cpu.specialSynergy) && (
                      <div className="special-synergy">
                        <strong>
                          {result.player.specialSynergy?.label ||
                            result.cpu.specialSynergy?.label}
                        </strong>
                        <span>
                          {result.player.specialSynergy?.note ||
                            result.cpu.specialSynergy?.note}
                        </span>
                        <b>
                          +
                          {result.player.specialSynergy?.bonus ||
                            result.cpu.specialSynergy?.bonus}{" "}
                          qualidade
                        </b>
                      </div>
                    )}
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
                <span className="deck-count">{selectedCards.length}/10</span>
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
            <section className="cpu-panel">
              <div className="cpu-head">
                <div
                  className="cpu-avatar"
                  style={
                    roundState.personality.title === "BOSS"
                      ? { background: "#ff5252", color: "#4a0000" }
                      : {}
                  }
                >
                  {roundState.personality.title === "BOSS" ? (
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
            <div className="eyebrow" style={{ marginTop: "20px" }}>
              <CircleHelp size={13} /> engenharia de prompt
            </div>
            <h2
              id="info-title"
              style={{ marginTop: "16px", marginBottom: "16px" }}
            >
              Quanto melhor a pergunta - melhor a resposta
            </h2>
            <p className="help-lead" style={{ marginBottom: "28px" }}>
              A <b>Engenharia de Prompt</b> é a habilidade de guiar a
              Inteligência Artificial. Não se trata de código, mas de combinar
              clareza, contexto e restrições para extrair exatamente a resposta
              que você imaginou.
            </p>

            <div className="prompt-explainer" style={{ padding: "20px" }}>
              <div
                className="prompt-explainer-title"
                style={{ marginBottom: "12px" }}
              >
                <Sparkles size={14} /> Os Elementos de um Prompt
              </div>
              <p>
                Para a IA não ter que "adivinhar" o que você quer, forneça as
                peças do quebra-cabeça. Veja como transformar um pedido genérico
                em uma instrução de alto nível:
              </p>
              <div
                className="prompt-example"
                style={{ marginTop: "16px", marginBottom: "16px" }}
              >
                <span>exemplo prático estruturado</span>
                <code>
                  <b style={{ color: "#ffb461", fontWeight: 600 }}>[Persona]</b>{" "}
                  Aja como um professor criativo...
                  <br />
                  <b style={{ color: "#ffb461", fontWeight: 600 }}>
                    [Tarefa]
                  </b>{" "}
                  Explique o que é a gravidade...
                  <br />
                  <b style={{ color: "#ffb461", fontWeight: 600 }}>
                    [Público]
                  </b>{" "}
                  Para uma criança de 10 anos que gosta de espaço...
                  <br />
                  <b style={{ color: "#ffb461", fontWeight: 600 }}>
                    [Formato]
                  </b>{" "}
                  Em apenas 1 parágrafo, usando a metáfora de um lençol
                  esticado.
                </code>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 14px",
                  borderRadius: "6px",
                  background: "rgba(255, 173, 85, 0.1)",
                  borderLeft: "3px solid #ffad55",
                  color: "#ffd6a5",
                  fontSize: "12px",
                  lineHeight: "1.4",
                }}
              >
                <strong>💡 Dica da Arena:</strong> No jogo você não escreve o
                prompt de forma literal. O seu objetivo é escolher e comprar as
                cartas que representam os melhores <strong>elementos</strong>{" "}
                para compor o resultado solicitado!
              </div>
            </div>

            <div className="info-divider" style={{ margin: "36px 0" }} />

            <div className="eyebrow" style={{ marginBottom: "16px" }}>
              <Gavel size={13} /> como funciona o jogo
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
                    A qualidade das cartas é oculta. O vencedor não é quem gasta
                    mais moedas, mas quem gera mais valor pelo menor custo.
                  </small>
                </div>
              </div>
              <div className="help-step">
                <span>03</span>
                <div>
                  <strong>Descubra sinergias</strong>
                  <small>
                    Existem combinações secretas. Juntar as cartas certas (como
                    a estrutura PITACO) destrava multiplicadores de pontuação!
                  </small>
                </div>
              </div>
            </div>

            <div className="info-divider" style={{ margin: "32px 0 20px" }} />
            <small className="help-footer">
              Cada rodada embaralha tarefas, cartas, preços e sinergias. Jogue,
              revele e use a reflexão para melhorar seu próximo prompt.
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
