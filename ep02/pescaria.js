/*
    pescaria de MAC0420/MAC5744 - Pescaria

    Nome: Júlia Melo Teixeira dos Santos
    NUSP: 12542306
 */

// A `main()` só deve ser executada quando tudo estiver carregado
window.onload = main;

/* ==================================================================
    constantes e variáveis globais
*/
const RADIUS_MAX = 0.065;
const RADIUS_MIN = 0.015;
const AREIA_ALT = 0.30;
// cores pré-definidas
const COLORS = ["darkslategray", "darkmagenta", "darkred", "darksalmon", "darkgoldenrod"];
// polígonos canônicos pré-definidos
const POLY = [generateVertex(4), generateVertex(6), generateVertex(8), generateVertex(10), generateVertex(16)];

var gCtx;

var gInterface = {
};

var gGame = {
  fish: []
};

/* ==================================================================
  Função main
*/
function main() {
  buildInterface();
  buildGame();
  nextFrame();
};

/**
 * Registra os elementos HTML responsáveis pela interação no objeto
 * interface e os associa às rotinas de callback.
 */
function buildInterface() {
  // botões
  gInterface.play = document.getElementById("btPlay");
  gInterface.step = document.getElementById("btStep");
  gInterface.activeStep = false;
  gInterface.alpha = document.getElementById("fishVel");
  gInterface.beta = document.getElementById("bubbleVel");
  gInterface.canvas = document.getElementById("canvas");

  // canvas
  gCtx = gInterface.canvas.getContext("2d");
  if (!gCtx) { alert("Não foi possível abrir o contexto 2D."); }
  gCtx.canvas.width = window.innerWidth;
  gCtx.canvas.height = window.innerHeight;

  // mouse
  onmousemove = callbackHarpoon;
  onmousedown = callbackBubble;

  // teclado
  onkeypress = callbackKBoard;

  // registro das funções de callback
  gInterface.play.onclick = callbackPlay;
  gInterface.step.onclick = callbackStep;
  window.onresize = callbackSize;
}

/**
 * Registra os elementos da pescaria no objeto jogo.
 */
function buildGame() {
  // gera peixes aleatórios
  for (let i = 0; i < 15; i++) {
    let newFish = {x: randomIn(2 - AREIA_ALT, -1.0 + AREIA_ALT),
                  y: randomIn(2 - AREIA_ALT, -1.0 + AREIA_ALT),
                  vx: randomIn(0.01), vy: randomIn(0.01),
                  r: randomIn(RADIUS_MAX - RADIUS_MIN, RADIUS_MIN),
                  color: COLORS[randomIndex(COLORS.length)],
                  poly: POLY[randomIndex(POLY.length)]};
    gGame.fish.push(newFish);
  }

  // agentes do jogo
  gGame.harpoon = [[0.0, -1 + 0.20],
                   [-RADIUS_MIN, -1 + 0.10],
                   [RADIUS_MIN, -1 + 0.10]];
  gGame.bubble = [0.0, -1.0];

  // elementos gráficos
  gCtx.save();
  gCtx.translate(gInterface.canvas.width/2, gInterface.canvas.height/2);
  gCtx.scale(gInterface.canvas.width/2, -gInterface.canvas.height/2);

  gCtx.fillStyle = "lightblue";
  gCtx.fillRect(-1.0, -1.0, 2.0, 2.0);

  gCtx.fillStyle = "lime";
  gCtx.fillRect(-1.0, -1.0, 2.0, AREIA_ALT);
  
  gCtx.fillStyle = "green"
  drawPolygon(gGame.harpoon);
  gCtx.restore();
}

/**
 * Atualiza os elementos da pescaria.
 */
function updateGame() {
  if (gGame.bubble[1] >= -1.0 + AREIA_ALT)  {
    gGame.bubble[1] += 0.01 * gInterface.beta.value;
    // elimina bolhas fora de vista
    if (gGame.bubble[1] > 1.0 + RADIUS_MIN) {
      gGame.bubble[0] = 0.0;
      gGame.bubble[1] = -1.0;
    }
  }

  for (let i = 0; i < gGame.fish.length; i++) {
    let f = gGame.fish.at(i);
    f.x += f.vx * gInterface.alpha.value;
    f.y += f.vy * gInterface.alpha.value;

    // verifica colisões com bordas
    if (f.x + f.r > 1.0 || f.x - f.r < -1.0)
      f.vx = -f.vx;
    if (f.y + f.r > 1.0 || f.y - f.r < -1.0 + AREIA_ALT)
      f.vy = -f.vy;

    // verifica captura por bolha
    let dist = Math.pow(gGame.bubble[0] - f.x, 2) + Math.pow(gGame.bubble[1] - f.y, 2);
    if ((gGame.bubble[1] >= -1.0 + AREIA_ALT) && (dist <= Math.pow(f.r, 2))) {
      gGame.fish.splice(i,1);
      gGame.bubble[0] = 0.0;
      gGame.bubble[1] = -1.0;
    }
  }
  
}

/**
 * callbackPlay
 */
function callbackPlay(e) {
  let v = gInterface.play.value;
  
  if (v == "Jogar") {
    console.log("Jogo iniciado.");
    gInterface.play.value = "Pausar";
    gInterface.step.disabled = true;
  }
  else {
    console.log("Jogo pausado.");
    gInterface.play.value = "Jogar";
    gInterface.step.disabled = false;
  }
}

/**
 * callbackStep
 */
function callbackStep(e) {
  gInterface.activeStep = true;
}

/**
 * callbackSize
 */
function callbackSize(e) {
  gCtx.canvas.width = window.innerWidth;
  gCtx.canvas.height = window.innerHeight;
}

/**
 * callbackHarpoon
 */
function callbackHarpoon(e) {
  if (e.target == gInterface.canvas) {    
    let x = (e.offsetX - gInterface.canvas.width/2) / (gInterface.canvas.width/2);
    gGame.harpoon[0][0] = x;
    gGame.harpoon[1][0] = x - RADIUS_MIN;
    gGame.harpoon[2][0] = x + RADIUS_MIN;
  }
}

/**
 * callbackBubble
 */
function callbackBubble(e) {
  // botão esquerdo é codificado como 0
  if (! e.button && e.target == gInterface.canvas) {    
    gGame.bubble[0] = gGame.harpoon[0][0];
    gGame.bubble[1] = -1.0 + AREIA_ALT;
  }
}

/**
 * callbackKBoard
 */
function callbackKBoard(e) {
  if (e.key == `s`) {    
    gGame.bubble[0] = gGame.harpoon[0][0];
    gGame.bubble[1] = -1.0 + AREIA_ALT;
  }
  else if (e.key == `a`) {
    gGame.harpoon[0][0] -= 0.01;
    gGame.harpoon[1][0] -= 0.01;
    gGame.harpoon[2][0] -= 0.01;
  }
  else if (e.key == `d`) {
    gGame.harpoon[0][0] += 0.01;
    gGame.harpoon[1][0] += 0.01;
    gGame.harpoon[2][0] += 0.01;
  }
}

/**
 * animação
 */
function nextFrame(e) {
  if (gInterface.play.value == "Pausar" || gInterface.activeStep) {
    updateGame();
    gInterface.activeStep = false;
  }

  gCtx.save();
  gCtx.translate(gInterface.canvas.width/2, gInterface.canvas.height/2);
  gCtx.scale(gInterface.canvas.width/2, -gInterface.canvas.height/2);

  gCtx.fillStyle = "lightblue";
  gCtx.fillRect(-1.0, -1.0, 2.0, 2.0);

  gCtx.fillStyle = "lime";
  gCtx.fillRect(-1.0, -1.0, 2.0, AREIA_ALT);
  
  gCtx.fillStyle = "green"
  drawPolygon(gGame.harpoon);
  
  for (let i = 0; i < gGame.fish.length; i++) {
    let f = gGame.fish[i];
    gCtx.save();
    gCtx.translate(f.x, f.y);
    gCtx.scale(f.r, f.r);
    gCtx.fillStyle = f.color;
    drawPolygon(f.poly);
    gCtx.fill();
    gCtx.restore();
  }

  if (gGame.bubble[1] >= -1.0 + AREIA_ALT) {
    gCtx.fillStyle = "black";
    gCtx.fillRect(gGame.bubble[0] - RADIUS_MIN, gGame.bubble[1] - RADIUS_MIN, 2*RADIUS_MIN, 2*RADIUS_MIN);
  }
  
  gCtx.restore();
  window.requestAnimationFrame(nextFrame);
}

/* ==================================================================
  Funções auxiliares
*/

/**
 * Gera lista de n vértices de um polígono canônico
 * equivalente à aproximação de uma circunferência
 */
function generateVertex(n) {
  let vertex = [];
  let angle = 2*Math.PI / n;
  for (let i = 0; i < n; i++) {
    vertex.push([Math.cos(angle*i), Math.sin(angle*i)]);
  }
  return vertex;
}

/**
 * Converte coordenadas no espaço normalizado para o espaço do canvas
 */
function drawPolygon(v) {
  let poly = new Path2D();
  poly.moveTo(v[0][0], v[0][1]);
  for (let i = 0; i < v.length; i++) { poly.lineTo(v[i][0], v[i][1]);}
  poly.closePath();
  gCtx.fill(poly);
}

/**
 * Gera aleatoriamente um valor em intervalo de tamanho size
 * com limite inferior offset
 */
function randomIn(size, offset = 0) {
  return Math.random() * size + offset;
}

/**
 * Gera aleatoriamente um índice para um array de tamanho size
 */
function randomIndex(size) {
  return Math.floor(Math.random() * size);
}