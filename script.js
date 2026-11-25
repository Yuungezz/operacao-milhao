/* ===== Operação Milhão – Guerra Fria ===== */
const PRIZES = [1000,2000,3000,4000,5000,10000,20000,30000,40000,50000,100000,200000,300000,400000,500000,1000000];
const API_URL = 'https://opentdb.com/api.php?amount=50&category=23&type=multiple&encode=url3986'; // categoria 23 = História
const COLD_WAR = /\b(soviet|ussr|cold war|cuba|castro|berlin|korea|vietnam|nuclear|atomic|missile|kennedy|eisenhower|truman|reagan|stalin|khrushchev|gorbachev|nato|warsaw|sputnik|apollo|communis|iron curtain|cia|kgb|yalta|potsdam|mao|nixon|space race|russia)/i;

// Banco local (reserva): usado quando a API não entrega perguntas suficientes ou está offline
const L = (diff, text, correct, wrong) => ({ diff, text, correct, wrong, src: 'local' });
const LOCAL = [
 L('easy','Que muro dividiu a capital alemã durante a Guerra Fria?','Muro de Berlim',['Muro das Lamentações','Muralha da China','Muro de Adriano']),
 L('easy','Qual país lançou o satélite Sputnik em 1957?','União Soviética',['Estados Unidos','China','Reino Unido']),
 L('easy','Qual aliança militar foi liderada pelos EUA?','OTAN',['Pacto de Varsóvia','ONU','Mercosul']),
 L('easy','Quem foi o primeiro ser humano a ir ao espaço?','Yuri Gagarin',['Neil Armstrong','Buzz Aldrin','Alan Shepard']),
 L('easy','A Guerra Fria opôs quais superpotências?','EUA e URSS',['França e Alemanha','China e Japão','Reino Unido e Espanha']),
 L('medium','Em qual país mísseis soviéticos causaram a crise de 1962?','Cuba',['Panamá','México','Nicarágua']),
 L('medium','Qual bloco militar era liderado pela URSS?','Pacto de Varsóvia',['OTAN','Eixo','Liga Árabe']),
 L('medium','Qual plano dos EUA financiou a reconstrução da Europa após 1945?','Plano Marshall',['New Deal','Plano Schuman','Doutrina Monroe']),
 L('medium','Quem liderava a URSS durante a Crise dos Mísseis?','Nikita Khrushchev',['Josef Stálin','Leonid Brejnev','Mikhail Gorbachev']),
 L('medium','Em que ano o Muro de Berlim foi construído?','1961',['1948','1969','1953']),
 L('hard','Como se chama a política de Truman de conter o avanço comunista?','Doutrina Truman',['Doutrina Monroe','Doutrina Brejnev','Doutrina Carter']),
 L('hard','O que significavam glasnost e perestroika?','Transparência e reestruturação',['Guerra e paz','Capital e trabalho','Ordem e progresso']),
 L('hard','Em que ano a URSS foi formalmente dissolvida?','1991',['1989','1985','1993']),
 L('hard','Qual guerra (1950–53) dividiu uma península em dois países?','Guerra da Coreia',['Guerra do Vietnã','Guerra do Golfo','Guerra do Afeganistão']),
 L('hard','Qual tratado de 1987 eliminou mísseis nucleares de alcance intermediário?','Tratado INF',['SALT I','Tratado de Tlatelolco','START II']),
 L('hard','Quem denunciou os crimes de Stálin em 1956?','Nikita Khrushchev',['Georgy Malenkov','Leonid Brejnev','Yuri Andropov'])
];

const $ = s => document.querySelector(s);
const rand = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const brl = n => 'R$ ' + n.toLocaleString('pt-BR');
const show = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

let pool = [];   // perguntas vindas da API (já filtradas pelo tema)
let st = {};     // estado da partida

/* ===== CONSUMO DE API #1: Open Trivia DB (perguntas e alternativas) ===== */
async function fetchBatch() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(API_URL, { signal: ctrl.signal });   // fetch + await
    const data = await res.json();
    if (data.response_code !== 0) return;                        // 5 = limite de requisições
    data.results.forEach(r => {
      const d = decodeURIComponent;                              // a API devolve texto codificado (url3986)
      const q = { diff: d(r.difficulty), text: d(r.question), correct: d(r.correct_answer), wrong: r.incorrect_answers.map(d), src: 'api' };
      // Só entra no jogo o que tem relação com a Guerra Fria
      if (COLD_WAR.test(q.text + ' ' + q.correct) && !pool.some(p => p.text === q.text)) pool.push(q);
    });
  } catch (e) { console.warn('API indisponível:', e.message); }
  finally { clearTimeout(timer); }
}

/* A API limita 1 requisição a cada 5 s: busca a 1ª leva, libera o jogo e reforça o acervo em segundo plano */
async function loadPool() {
  for (let i = 0; i < 4 && pool.length < 14; i++) {
    await fetchBatch();
    $('#status').textContent = pool.length ? `📡 ${pool.length} dossiês interceptados via satélite` : '📡 Sem sinal: usando arquivo local';
    $('#btn-start').disabled = false;
    await sleep(5500);
  }
}

/* ===== CONSUMO DE API #2: MyMemory (tradução EN → PT-BR, com reserva no texto original) ===== */
async function tr(txt) {
  if (/^[\d\s.,-]+$/.test(txt)) return txt;
  try {
    const res = await fetch('https://api.mymemory.translated.net/get?langpair=en|pt-BR&q=' + encodeURIComponent(txt));
    const d = await res.json();
    const t = d.responseData.translatedText;
    return d.responseStatus == 200 && t && !/MYMEMORY/i.test(t) ? t : txt;
  } catch (e) { return txt; }
}

/* Escolhe a pergunta da vez: prioriza a API (dificuldade certa), senão o banco local */
function pick(i) {
  const d = i < 5 ? 'easy' : i < 10 ? 'medium' : 'hard';
  const order = { easy: ['easy','medium'], medium: ['medium','easy','hard'], hard: ['hard','medium'] }[d];
  for (const df of order) {
    const c = pool.filter(q => q.diff === df && !st.used.has(q.text));
    if (c.length) return rand(c);
  }
  const c = LOCAL.filter(q => q.diff === d && !st.used.has(q.text));
  return rand(c.length ? c : LOCAL.filter(q => !st.used.has(q.text)));
}

const defcon = i => i < 4 ? 5 : i < 8 ? 4 : i < 11 ? 3 : i < 14 ? 2 : 1;
const stopValue = i => i ? PRIZES[i - 1] : 0;
const loseValue = i => i === 15 ? 0 : stopValue(i) / 2;   // regra do programa: errar = metade; na última = zero

function newGame() {
  st = { i: 0, skips: 3, cards: true, plates: true, used: new Set(), hits: 0, api: 0, name: $('#name').value.trim() || 'Agente X', locked: false };
  $('#agent').textContent = st.name;
  $('#ll-skip').disabled = $('#ll-cards').disabled = $('#ll-plates').disabled = false;
  show('#game');
  nextQuestion();
}

async function nextQuestion(keepIndex) {
  st.locked = true; st.sel = null; $('#btn-confirm').disabled = true;
  const q = pick(st.i);
  st.used.add(q.text);
  $('#question').textContent = 'Descriptografando mensagem…';
  $('#answers').innerHTML = '';
  let texts = [q.text, q.correct, ...q.wrong];
  if (q.src === 'api' && $('#tr').checked) texts = await Promise.all(texts.map(tr));  // tradução usa os dados da API
  const opts = shuffle(texts.slice(1).map((t, k) => ({ t, ok: k === 0, off: false })));
  st.q = { opts, diff: q.diff, src: q.src };
  if (q.src === 'api') st.api++;
  render(texts[0]);
  st.locked = false;
}

function render(text) {
  const i = st.i;
  $('#question').textContent = text;
  $('#qnum').textContent = `Dossiê ${i + 1} de 16`;
  $('#qdiff').textContent = { easy: 'Nível fácil', medium: 'Nível médio', hard: 'Nível difícil' }[st.q.diff];
  $('#qsrc').textContent = st.q.src === 'api' ? 'Fonte: Open Trivia DB' : 'Fonte: arquivo local';
  $('#qsrc').className = st.q.src === 'api' ? 'badge-api' : '';
  $('#score').textContent = brl(stopValue(i));
  $('#p-win').textContent = 'Acertar: ' + brl(PRIZES[i]);
  $('#p-stop').textContent = 'Parar: ' + brl(stopValue(i));
  $('#p-lose').textContent = 'Errar: ' + brl(loseValue(i));
  $('#defcon').innerHTML = [5,4,3,2,1].map(n => `<i class="${n === defcon(i) ? 'on' + (n <= 2 ? ' hot' : '') : ''}">${n}</i>`).join('');
  $('#ladder').innerHTML = PRIZES.map((p, k) => `<li class="${k < i ? 'done' : k === i ? 'now' : ''}"><span>${k + 1}</span><span>${brl(p)}</span></li>`).join('');
  $('#ll-skip').textContent = `Pular (${st.skips})`;
  $('#ll-skip').disabled = !st.skips;
  $('#ll-cards').disabled = !st.cards;
  $('#ll-plates').disabled = !st.plates;
  $('#answers').innerHTML = '';
  st.q.opts.forEach((o, k) => {
    const b = document.createElement('button');
    b.className = 'ans' + (o.off ? ' off' : '');
    b.innerHTML = '<b>' + 'ABCD'[k] + ')</b><span></span><span class="pct"></span><i class="bar"></i>';
    b.children[1].textContent = o.t;
    b.onclick = () => select(k);
    $('#answers').appendChild(b);
  });
}

function select(k) {
  if (st.locked || st.q.opts[k].off) return;
  st.sel = k;
  [...$('#answers').children].forEach((b, j) => b.classList.toggle('sel', j === k));
  $('#btn-confirm').disabled = false;
}

async function confirmAnswer() {
  if (st.locked || st.sel === null) return;
  st.locked = true; $('#btn-confirm').disabled = true;
  const btns = [...$('#answers').children];
  const right = st.q.opts.findIndex(o => o.ok);
  btns.forEach(b => b.classList.remove('sel'));
  btns[right].classList.add('ok');
  const hit = st.sel === right;
  if (!hit) btns[st.sel].classList.add('bad');
  await sleep(1800);
  if (!hit) return end('lose', loseValue(st.i));
  st.hits++;
  if (st.i === 15) return end('win', PRIZES[15]);
  st.i++;
  nextQuestion();
}

/* ===== Ajudas ===== */
function skip() { if (st.locked || !st.skips) return; st.skips--; nextQuestion(); }

function cards() {                       // Cartas: elimina de 1 a 3 alternativas erradas
  if (st.locked || !st.cards) return;
  st.cards = false;
  const wrong = shuffle(st.q.opts.map((o, k) => k).filter(k => !st.q.opts[k].ok));
  wrong.slice(0, 1 + Math.floor(Math.random() * 3)).forEach(k => st.q.opts[k].off = true);
  if (st.sel !== null && st.q.opts[st.sel].off) st.sel = null;
  render($('#question').textContent);
}

function plates() {                      // Placas: a plateia vota; quanto mais difícil, mais ela erra
  if (st.locked || !st.plates) return;
  st.plates = false;
  const base = { easy: 65, medium: 48, hard: 33 }[st.q.diff] + Math.random() * 15;
  const alive = st.q.opts.map((o, k) => k).filter(k => !st.q.opts[k].off);
  const others = alive.filter(k => !st.q.opts[k].ok);
  const share = alive.length === 1 ? 100 : base, v = {};
  v[alive.find(k => st.q.opts[k].ok)] = share;
  let left = 100 - share;
  others.forEach((k, n) => { v[k] = n === others.length - 1 ? left : Math.round(Math.random() * left * .6); left -= v[k]; });
  render($('#question').textContent);
  [...$('#answers').children].forEach((b, k) => { if (v[k] !== undefined) { b.querySelector('.pct').textContent = Math.round(v[k]) + '%'; setTimeout(() => b.querySelector('.bar').style.width = v[k] + '%', 50); } });
  if (st.sel !== null) $('#answers').children[st.sel].classList.add('sel');
}

/* ===== Parar / modal ===== */
function ask(text, yes) {
  $('#modal-text').textContent = text; $('#modal').hidden = false;
  $('#modal-yes').onclick = () => { $('#modal').hidden = true; yes(); };
  $('#modal-no').onclick = () => $('#modal').hidden = true;
}

function end(kind, prize) {
  const t = {
    win: ['VITÓRIA', 'Missão cumprida!', 'DEFCON 1 superado. Você atravessou a Cortina de Ferro e levou o milhão.'],
    stop: ['RETIRADA', 'Retirada estratégica', 'Você parou a tempo e levou o prêmio acumulado.'],
    lose: ['FALHA', 'Operação comprometida', 'Resposta errada: o prêmio foi reduzido à metade.']
  }[kind];
  $('#end-stamp').textContent = t[0]; $('#end-title').textContent = t[1]; $('#end-msg').textContent = t[2];
  $('#end-prize').textContent = brl(prize);
  $('#end-stats').innerHTML = `<li>Agente: ${st.name}</li><li>Acertos: ${st.hits} de 16</li><li>Perguntas vindas da API: ${st.api}</li><li>Perguntas do arquivo local: ${Math.max(0, st.used.size - st.api)}</li>`;
  show('#end');
}

/* ===== Eventos ===== */
$('#btn-start').onclick = newGame;
$('#btn-again').onclick = () => show('#start');
$('#btn-confirm').onclick = confirmAnswer;
$('#btn-stop').onclick = () => !st.locked && ask(`Parar agora e levar ${brl(stopValue(st.i))}?`, () => end('stop', stopValue(st.i)));
$('#ll-skip').onclick = skip; $('#ll-cards').onclick = cards; $('#ll-plates').onclick = plates;
document.addEventListener('keydown', e => {              // atalhos: A–D escolhem, Enter trava
  if (!$('#game').classList.contains('active')) return;
  const k = 'abcd'.indexOf(e.key.toLowerCase());
  if (k >= 0 && document.activeElement.tagName !== 'INPUT') select(k);
  if (e.key === 'Enter' && !$('#btn-confirm').disabled) confirmAnswer();
});
loadPool();
