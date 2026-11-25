# Operação Milhão – Edição Guerra Fria

Jogo de perguntas e respostas inspirado no Show do Milhão. O jogador assume o papel de um agente que sobe do **DEFCON 5 ao DEFCON 1** respondendo 16 perguntas sobre a Guerra Fria, de R$ 1.000 até R$ 1.000.000.

## Tema e tecnologias
- **Tema:** Guerra Fria (dossiês confidenciais, radar, DEFCON, estética de terminal CRT).
- **Tecnologias:** HTML5, CSS3 e JavaScript puro (sem frameworks), `fetch()` com `async/await`.
- **Fontes:** Special Elite (máquina de escrever) e Share Tech Mono (Google Fonts).
- **Paleta:** `#7AFFD3` `#ADFFE4` `#CCE8DF` `#394F48` `#44826D` sobre cinza-escuro esverdeado (`#0e1211`, `#171e1c`). Vermelho (`#ff6b5e`) e âmbar entram só como cor de alerta (erro e DEFCON 2/1).

## Funcionalidades
- 3 telas: abertura, jogo e resultado.
- 16 perguntas (5 fáceis, 5 médias, 6 difíceis), escada de prêmios e indicador DEFCON.
- Fluxo de resposta: escolher alternativa → **Travar resposta** (ou teclas A–D e Enter).
- Regra do programa: **Acertar / Parar / Errar** (errar = metade do acumulado; na última, zero).
- Ajudas: **Pular** (3x), **Cartas** (elimina 1 a 3 erradas) e **Placas** (votação da plateia, menos precisa em perguntas difíceis).
- Resultado final com prêmio, acertos e origem das perguntas.

## Etapas de desenvolvimento
1. **Planejamento:** identidade (radar, DEFCON, dossiê confidencial), telas e regras.
2. **Construção:** `index.html` (estrutura), `style.css` (visual), `script.js` (lógica).
3. **API:** integração com Open Trivia DB e MyMemory.
4. **Documentação e testes.**

## APIs utilizadas
| API | Finalidade | Onde no código |
|---|---|---|
| [Open Trivia DB](https://opentdb.com/api_config.php) (categoria História) | Obter perguntas e alternativas | `fetchBatch()` e `loadPool()` em `script.js` (comentário `CONSUMO DE API #1`) |
| [MyMemory](https://mymemory.translated.net/doc/spec.php) | Traduzir pergunta e alternativas de inglês para português | `tr()` (comentário `CONSUMO DE API #2`) |

**Como os dados são usados:** a Open Trivia DB não tem categoria "Guerra Fria". O jogo pede 50 perguntas de História e mantém só as que citam termos do tema (URSS, Berlim, Cuba, Sputnik, OTAN etc.; regex `COLD_WAR`). Como o filtro descarta muitas, o jogo faz até 4 buscas (a API limita 1 a cada 5 s), em segundo plano, enquanto o jogador já joga. A dificuldade (`easy/medium/hard`) da API define em qual fase a pergunta aparece. Se a API falhar ou faltar pergunta, entra o **banco local** (16 perguntas em português). Cada pergunta mostra sua fonte na tela.

## Como executar
1. Baixe a pasta com `index.html`, `style.css` e `script.js`.
2. Abra `index.html` no navegador (precisa de internet para as APIs e fontes; sem internet o jogo funciona só com o banco local).
3. Opcional, com servidor local: `python -m http.server` e acesse `http://localhost:8000`.

## Registro do uso de IA
- **Ferramenta:** Claude (Anthropic), modelo Claude Sonnet 5.5, pelo claude.ai.
- **Prompt principal:** pedi um jogo inspirado no Show do Milhão com tema Guerra Fria, paleta definida, arquivos separados (HTML, CSS, JS), consumo de API com `fetch/async/await` comentado no código e README completo.
- **Outros prompts:** *(acrescente aqui os pedidos de ajuste que você fizer, por exemplo "adicione um cronômetro" ou "explique a função `pick`")*.
- **Contribuição da IA:** propôs a identidade (DEFCON, radar, dossiê), escreveu a estrutura, o CSS e a lógica, escolheu a API e criou o filtro temático e o banco local de reserva.
- **Compreensão do código:** `pick()` escolhe a pergunta (API primeiro, local como reserva); `nextQuestion()` traduz, embaralha e monta a pergunta; `render()` desenha a tela; `confirmAnswer()` verifica a resposta e avança; `cards()`/`plates()`/`skip()` são as ajudas; `end()` mostra o resultado. O estado da partida fica no objeto `st`.

## Testes
| Teste | Resultado |
|---|---|
| Sintaxe de `script.js` (`node --check`) | Passou |
| Filtro `COLD_WAR` (aceita "Berlin Wall"/"Sputnik", recusa "Mona Lisa") | Passou |
| Valores de Parar/Errar (pergunta 6: errar = R$ 2.500; pergunta 16: parar = R$ 500.000, errar = 0) | Passou |
| Fluxo no navegador (iniciar, responder, ajudas, parar, errar, vencer, nova missão) | **Verifique você mesmo**: o ambiente de criação não tinha rede nem navegador |

Roteiro para o teste manual: (1) iniciar sem nome → "Agente X"; (2) travar resposta certa e errada; (3) usar cada ajuda uma vez; (4) parar na pergunta 3; (5) errar na 6 e conferir R$ 2.500; (6) desligar a internet e confirmar o uso do banco local.
