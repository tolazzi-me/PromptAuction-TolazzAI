# Prompt Auction 🔨🤖

Um laboratório gamificado de engenharia de prompt desenvolvido pela **TolazzAI**. Aprenda a construir prompts eficientes, balanceando clareza, contexto e restrições em uma disputa direta contra a inteligência artificial.

## 🎯 Sobre o Jogo

**"Quanto melhor a pergunta, melhor a resposta."**
A Engenharia de Prompt não se trata de programar, mas de saber comunicar intenções. O **Prompt Auction** transforma esse conceito em um jogo de estratégia. Em vez de digitar um texto livremente, você recebe um orçamento limitado (moedas) para "comprar" elementos estruturais de um prompt no mercado — como *Persona*, *Público*, *Tom Amigável*, *Cadeia de Pensamento (CoT)* ou *Autoavaliação*.

O objetivo não é apenas ter a maior qualidade bruta, mas a melhor **eficiência** (Qualidade ÷ Custo), provando que um prompt enxuto e bem direcionado vale mais que um texto longo e genérico.

## ⚙️ Mecânicas Principais

* **Mercado Dinâmico:** A cada rodada, 16 cartas aleatórias ficam disponíveis. Você deve analisar o *brief* (desafio da rodada) e comprar as peças que melhor resolvem o problema sem estourar o orçamento.
* **Eficiência vs. Qualidade:** Cartas mais baratas rendem menos qualidade isolada, mas podem ser o diferencial matemático para vencer a CPU na relação Custo-Benefício.
* **Sinergias Secretas:** Combinar cartas específicas desbloqueia multiplicadores de pontuação e preenche sua "Biblioteca de Descobertas". Exemplos incluem:
* *Método PITACO:* Persona + Tarefa + Público + Contexto + Formato (+55 pontos).
* *Chain of Thought (CoT):* Obriga a IA a descrever a lógica antes do resultado (+20 pontos).
* *Autoavaliação e Crítica:* Força a IA a revisar a própria resposta (+15 pontos).


* **Adversários Adaptativos:** Jogue contra perfis distintos de CPU:
* **Íris (Econômica):** Foca apenas no custo-benefício.
* **Nexo (Estrategista):** Lê as *tags* do desafio e busca sinergias.
* **Bia (Caótica):** Gasta agressivamente sem olhar para trás.
* **Ares (BOSS):** Um oponente implacável que surge aleatoriamente com uma vantagem injusta de +20 pontos nativos de qualidade.



## 🛠️ Stack Tecnológico

**Frontend:**

* [React](https://reactjs.org/?utm_source=gemini) + [Vite](https://vitejs.dev/?utm_source=gemini)
* TypeScript
* CSS nativo + TailwindCSS (para utilitários)
* [Lucide React](https://lucide.dev/?utm_source=gemini) (Ícones SVG)

**Infraestrutura e Deploy:**

* **Ambiente:** Servidor Oracle Cloud VPS (Ubuntu).
* **Containerização:** Docker & Docker Compose.
* **Servidor Web:** Nginx servindo os arquivos estáticos de forma leve e performática.
* **Proxy Reverso & SSL:** Caddy Server cuidando da interceptação de tráfego e certificados automáticos HTTPS.

## 🚀 Como rodar o projeto localmente

Pré-requisitos: Node.js e gerenciador de pacotes (`pnpm` recomendado).

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/prompt-auction.git
cd prompt-auction/client

```

2. Instale as dependências:

```bash
pnpm install

```

3. Inicie o servidor de desenvolvimento:

```bash
pnpm run dev

```

4. Acesse no navegador: `http://localhost:5173`

## 📦 Como fazer o Build para Produção

Para gerar a versão otimizada pronta para o Nginx:

```bash
pnpm run build

```

Os arquivos minificados serão gerados na pasta `dist`. Em ambiente de produção, basta mapear esta pasta compilada (`/public` ou `/dist` dependendo da configuração do volume) diretamente para o Nginx via Docker Compose.

## 📄 Créditos e Licença

Desenvolvido por **Saimon Tolazzi** para disponibilidade gratuita para todos e como parte do ecossistema de soluções da **TolazzAI** para treinamento em Inteligência Artificial e Engenharia de Prompts. Todos os direitos reservados.
