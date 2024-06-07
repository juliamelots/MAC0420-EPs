/*
    dengue.js de MAC0420/MAC5744 - Mata Mosquito

    Nome: Júlia Melo Teixeira dos Santos
    NUSP: 12542306
*/

window.onload = main;

/* ==================================================================
    Constantes e variáveis globais
*/
// inseticida
const BICO_INSETICIDA = 0.075;
const LAR_INSETICIDA = 0.05;
const ALT_MIN_INSETICIDA = 0.25;
const ALT_MAX_INSETICIDA = 0.75;
const ANG_MIN_INSETICIDA = -35;
const ANG_MAX_INSETICIDA =  75;
const COR_INSETICIDA_BASE = [0, .7, .9, 1];
const COR_INSETICIDA_PARAFUSO = [0, 0.2, 0.5, 1];
const COR_INSETICIDA_BICO = [0, 0.8, 1, 1];
const ALT_PASSO = 0.02;
const ANG_PASSO = 2;

// veneno
const TIRO_VX = 0.01;
const TIRO_VY = 0.01;
const COR_TIRO = [0, 0, 0, 1]
const G = 0.0008;

// mosquito
const ALT_DENGUE = 0.05;
const LAR_DENGUE = 0.05;
const MAX_VEL_DENGUE = 0.05;
const ANG_MAX_DENGUE =  45;
const ANG_VEL = 15;
const COR_DENGUE = [0.5, 0.3, 0.2, 1];
const BORDA = 0.15;

var gGL;
var gShader = {};
var gInterface = {};
var gGame = { dt: 0.1, activeStep: false };

/* ==================================================================
    Classes
*/
/**
 * Representação do inseticida, com altura e ângulo do bico variáveis.
 * Capaz de atirar com veneno.
 */
class Inseticida {
    constructor(y, ang) {
        this.y = y;
        this.ang = ang;
    }
    updateHeight(step) {
        this.y = Math.min(ALT_MAX_INSETICIDA,
            Math.max(ALT_MIN_INSETICIDA, this.y + step * ALT_PASSO));
        console.log("Altura do inseticida é", this.y);
    }
    updateAngle(step) {
        this.ang = Math.min(ANG_MAX_INSETICIDA,
            Math.max(ANG_MIN_INSETICIDA, this.ang + step * ANG_PASSO));
        console.log("Ângulo do inseticida é", this.ang);
    }
    shoot(shot) {
        shot.set(LAR_INSETICIDA/2 + BICO_INSETICIDA * Math.cos(toRad(this.ang)),
            this.y - BICO_INSETICIDA * Math.sin(toRad(this.ang)),
            this.ang);
        console.log("Tiro em (", shot.x, ",", shot.y, ")");
    }
}

/**
 * Representação do tiro de veneno, com posição (2D) e velocidade
 * (afetada por aceleração da gravidade) variáveis.
 * Capaz de ser ativado por inseticida, que define sua posição e velocidade iniciais.
 */
class Tiro {
    constructor() {
        this.active = false;
        this.x = LAR_INSETICIDA/2;
        this.y = ALT_MIN_INSETICIDA;
        this.vx = TIRO_VX;
        this.vy = -TIRO_VY;
    }
    updatePosition() {
        this.x += this.vx * gGame.dt * gInterface.alpha.value;
        this.y += this.vy * gGame.dt * gInterface.alpha.value;
    }
    updateVelocity() {
        this.vy -= G * gGame.dt;
    }
    set(x, y, ang) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.vx = TIRO_VX * Math.cos(toRad(ang));
        this.vy = -TIRO_VY * Math.sin(toRad(ang));
    }
}

/**
 * Representação do mosquito da dengue, com posição e velocidade (2D) variáveis.
 * Possui estilização de olhos e asas com cor e ângulo de asas também variáveis.
 * Capaz de ser atingido por tiro de veneno ativo.
 */
class Mosquito {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ang = 0;
        this.vAng = ANG_VEL;
        this.color = [Math.random(), Math.random(), Math.random(), 1];
    }
    updatePosition() {
        this.x += this.vx * gGame.dt;
        this.y += this.vy * gGame.dt;

        this.ang += this.vAng * gGame.dt;
    }
    /**
     * Voo aleatório simulado por pertubações aleatórias na velocidade,
     * com intensidade [-MAX_VEL_DENGUE/8, MAX_VEL_DENGUE/8].
     * Voo limitado por bordas. Ao colidir com uma, velocidade é refletida.
     */
    updateVelocity() {
        this.vx = this.vx + randomIn(MAX_VEL_DENGUE, -MAX_VEL_DENGUE/2) * 0.25;
        this.vy = this.vy + randomIn(MAX_VEL_DENGUE, -MAX_VEL_DENGUE/2) * 0.25;

        if (this.vx > MAX_VEL_DENGUE || this.vx < -MAX_VEL_DENGUE)
            this.vx = MAX_VEL_DENGUE;
        if (this.vy > MAX_VEL_DENGUE || this.vy < -MAX_VEL_DENGUE)
            this.vy = MAX_VEL_DENGUE;

        if (this.x <= BORDA || this.x >= 1-BORDA)
            this.vx *= -1;
        if (this.y <= BORDA || this.y >= 1-BORDA)
            this.vy *= -1;

        if (this.ang <= -ANG_MAX_DENGUE || this.ang >= ANG_MAX_DENGUE)
            this.vAng *= -1;
    }
    hitBy(shot) {
        let s = shot.x <= this.x + LAR_DENGUE/2 && shot.x >= this.x - LAR_DENGUE/2;
        s &&= shot.y <= this.y + ALT_DENGUE/2 && shot.y >= this.y - ALT_DENGUE/2;
        return s;
    }
}

/* ==================================================================
  Função main
*/
function main() {
    buildInterface();
    buildGame();
    createShaders();
    nextFrame();
};

/**
 * Registra os elementos HTML responsáveis pela interação no objeto
 * interface e os associa às rotinas de callback.
 */
function buildInterface() {
    // botões
    gInterface.run = document.getElementById("bRun");
    gInterface.step = document.getElementById("bStep");
    gInterface.alpha = document.getElementById("bVel");
    gInterface.canvas = document.getElementById("glcanvas");

    // canvas
    gGL = gInterface.canvas.getContext("webgl2");
    if (!gGL)
        alert("Não foi possível usar WebGL 2.0.");
    gGL.canvas.width = window.innerWidth;
    gGL.canvas.height = window.innerHeight;

    // registro das funções de callback
    gInterface.run.onclick = callbackRun;
    gInterface.step.onclick = function() { gGame.activeStep = true; };
    gInterface.alpha.oninput = function() { console.log("Velocidade do tiro é", gInterface.alpha.value); };
    onkeypress = callbackKBoard;
}

/**
 * Registra os elementos do mata mosquitos no objeto jogo.
 */
function buildGame() {
    gGame.inseticida = new Inseticida((ALT_MIN_INSETICIDA + ALT_MAX_INSETICIDA) / 2,
        (ANG_MIN_INSETICIDA + ANG_MAX_INSETICIDA) / 2);
    gGame.tiro = new Tiro();
    gGame.dengue = [];
    for (let i = 0; i < 5; i++) {
        let m = new Mosquito(randomIn(1 - 2*BORDA, BORDA),
            randomIn(1 - 2*BORDA, BORDA),
            randomIn(MAX_VEL_DENGUE),
            randomIn(MAX_VEL_DENGUE));
        gGame.dengue.push(m);
    }

    console.log("Cena:\nInseticida", gGame.inseticida,
        "\nTiro de inseticida", gGame.tiro,
        "\nMosquitos da dengue", gGame.dengue);
}

/**
 * Atualiza os elementos do mata mosquito caso estado seja executando ou passo ativado.
 */
function updateGame() {
    if (gGame.activeStep)
        gGame.dt = 0.1;
    
    if (gGame.tiro.active) {
        gGame.tiro.updatePosition();
        gGame.tiro.updateVelocity();
    }
    
    for (let i = 0; i < gGame.dengue.length; i++) {
        let m = gGame.dengue.at(i);
        m.updatePosition();
        m.updateVelocity();
        if (gGame.tiro.active && m.hitBy(gGame.tiro)) {
            gGame.dengue.splice(i, 1);
            gGame.tiro.active = false;
            console.log("Tiro acertou mosquito em (", gGame.tiro.x, ",", gGame.tiro.y, ")");
        }
    }
    
    if (gGame.activeStep) {
        gGame.dt = 0;
        gGame.activeStep = false;
        console.log("Cena após 0.1s:\nInseticida", gGame.inseticida,
        "\nTiro de inseticida", gGame.tiro,
        "\nMosquitos da dengue", gGame.dengue);
    }
}

/**
 * Cria e configura shaders de WebGL 2.0.
 * Atributos são: lista fixa de formas canônicas, cor, resolução do espaço normalizado
 * e transformações afins (translação, escala e rotação).
 */
function createShaders() {
    gShader.aVertex =   [[[0, 0], [1, -1], [1, 1]],
                        [[-1, 1], [-1, -1], [1, -1], [1, 1]],
                        generateVertexList(8)].flat();

    // cria programa (shaders)
    gShader.program = makeProgram(gGL, glVertexShaderSrc, glFragmentShaderSrc);
    gGL.useProgram(gShader.program);

    // buffer de vértices
    gShader.bufVertex = gGL.createBuffer();
    gGL.bindBuffer(gGL.ARRAY_BUFFER, gShader.bufVertex);
    gGL.bufferData(gGL.ARRAY_BUFFER, flatten(gShader.aVertex), gGL.STATIC_DRAW); // TO-DO aVertex
    let aVertexLoc = gGL.getAttribLocation(gShader.program, "aVertex");

    // configuração de leitura do buffer para aVertex
    let size = 2;           // 2 elementos de cada vez - vec2
    let type = gGL.FLOAT;   // tipo de 1 elemento = float 32 bits
    let normalize = false;  // não normalize os dados
    let stride = 0;         // passo, quanto avançar a cada iteração depois de size*sizeof(type) 
    let offset = 0;         // começo do buffer
    gGL.vertexAttribPointer(aVertexLoc, size, type, normalize, stride, offset);
    gGL.enableVertexAttribArray(aVertexLoc);

    // atributos uniformes
    gShader.uColor = gGL.getUniformLocation(gShader.program, "uColor");
    gShader.uResolution = gGL.getUniformLocation(gShader.program, "uResolution");
    gShader.uTranslate = gGL.getUniformLocation(gShader.program, "uTranslate");
    gShader.uScale = gGL.getUniformLocation(gShader.program, "uScale");
    gShader.uRotate = gGL.getUniformLocation(gShader.program, "uRotate");
}

/**
 * Gera próximo frame para ilustração do estado do jogo (animação).
 */
function nextFrame(e) {
    updateGame();
    gGL.viewport(0, 0, gInterface.canvas.width, gInterface.canvas.height);
    gGL.clearColor(0.0, 1.0, 1.0, 1.0);
    gGL.clear( gGL.COLOR_BUFFER_BIT );

    gGL.uniform2f(gShader.uResolution, 1.0, 1.0);
    gGL.uniform2f(gShader.uRotate, 1, 0);

    // desenha tiro de veneno
    if (gGame.tiro.active) {
        gGL.uniform4f(gShader.uColor, COR_TIRO[0], COR_TIRO[1], COR_TIRO[2], COR_TIRO[3]);
        gGL.uniform2f(gShader.uTranslate, gGame.tiro.x, gGame.tiro.y);
        gGL.uniform2f(gShader.uScale, BICO_INSETICIDA/8, BICO_INSETICIDA/8);
        gGL.drawArrays(gGL.TRIANGLE_FAN, 7, 8);
    }

    // desenha base do inseticida
    gGL.uniform4f(gShader.uColor, COR_INSETICIDA_BASE[0], COR_INSETICIDA_BASE[1], COR_INSETICIDA_BASE[2], COR_INSETICIDA_BASE[3]);
    gGL.uniform2f(gShader.uTranslate, LAR_INSETICIDA/2, gGame.inseticida.y/2);
    gGL.uniform2f(gShader.uScale, LAR_INSETICIDA/2, gGame.inseticida.y/2);
    gGL.drawArrays(gGL.TRIANGLE_FAN, 3, 4);

    // desenha parafuso do inseticida
    gGL.uniform4f(gShader.uColor, COR_INSETICIDA_PARAFUSO[0], COR_INSETICIDA_PARAFUSO[1], COR_INSETICIDA_PARAFUSO[2], COR_INSETICIDA_PARAFUSO[3]);
    gGL.uniform2f(gShader.uTranslate, LAR_INSETICIDA/2, gGame.inseticida.y);
    gGL.uniform2f(gShader.uScale, LAR_INSETICIDA/4, LAR_INSETICIDA/4);
    gGL.drawArrays(gGL.TRIANGLE_FAN, 7, 8);
    
    // desenha bico do inseticida
    gGL.uniform4f(gShader.uColor, COR_INSETICIDA_BICO[0], COR_INSETICIDA_BICO[1], COR_INSETICIDA_BICO[2], COR_INSETICIDA_BICO[3]);
    gGL.uniform2f(gShader.uTranslate, LAR_INSETICIDA/2, gGame.inseticida.y);
    gGL.uniform2f(gShader.uScale, BICO_INSETICIDA, BICO_INSETICIDA/6);
    gGL.uniform2f(gShader.uRotate, Math.cos(toRad(gGame.inseticida.ang)), Math.sin(toRad(gGame.inseticida.ang)));
    gGL.drawArrays(gGL.TRIANGLES, 0, 3);

    // desenha mosquitos
    for (let i = 0; i < gGame.dengue.length; i++) {
        let m = gGame.dengue.at(i);
        
        // desenha corpo dos mosquitos
        gGL.uniform4f(gShader.uColor, COR_DENGUE[0], COR_DENGUE[1], COR_DENGUE[2], COR_DENGUE[3]);
        gGL.uniform2f(gShader.uTranslate, m.x, m.y);
        gGL.uniform2f(gShader.uScale, LAR_DENGUE/2, ALT_DENGUE/2);
        gGL.uniform2f(gShader.uRotate, 1, 0);
        gGL.drawArrays(gGL.TRIANGLE_FAN, 3, 4);
        
        // desenha asas dos mosquitos
        gGL.uniform4f(gShader.uColor, m.color[0], m.color[1], m.color[2], m.color[3]);
        gGL.uniform2f(gShader.uTranslate, m.x + LAR_DENGUE/2, m.y);
        gGL.uniform2f(gShader.uScale, LAR_DENGUE/4, ALT_DENGUE/4);
        gGL.uniform2f(gShader.uRotate, Math.cos(toRad(m.ang)), Math.sin(toRad(m.ang)));
        gGL.drawArrays(gGL.TRIANGLES, 0, 3);

        gGL.uniform2f(gShader.uTranslate, m.x - LAR_DENGUE/2, m.y);
        gGL.uniform2f(gShader.uScale, -LAR_DENGUE/4, ALT_DENGUE/4);
        gGL.uniform2f(gShader.uRotate, Math.cos(toRad(-m.ang)), Math.sin(toRad(-m.ang)));
        gGL.drawArrays(gGL.TRIANGLES, 0, 3);

        // desenha olhos dos mosquitos
        gGL.uniform2f(gShader.uTranslate, m.x + LAR_DENGUE/4, m.y);
        gGL.uniform2f(gShader.uScale, LAR_DENGUE/8, ALT_DENGUE/8);
        gGL.uniform2f(gShader.uRotate, 1, 0);
        gGL.drawArrays(gGL.TRIANGLE_FAN, 7, 8);

        gGL.uniform2f(gShader.uTranslate, m.x - LAR_DENGUE/4, m.y);
        gGL.drawArrays(gGL.TRIANGLE_FAN, 7, 8);
    }

    window.requestAnimationFrame(nextFrame);
}

/**
 * Controla execução do jogo.
 */
function callbackRun(e) {
    let v = gInterface.run.value;

    if (v == "Pausar") {
        console.log("Jogo pausado.");
        gGame.dt = 0;
        gInterface.run.value = "Executar";
        gInterface.step.value = "Passo";
        gInterface.step.disabled = false;
    }
    else {
        console.log("Jogo iniciado.");
        gGame.dt = 0.1;
        gInterface.run.value = "Pausar";
        gInterface.step.value = "";
        gInterface.step.disabled = true;
    }
}

/**
 * Conecta interação do usuário com estado do jogo.
 * Capaz de ativar tiro de veneno e variar altura e ângulo do inseticida.
 */
function callbackKBoard(e) {
    if (e.key == `t`)
        gGame.inseticida.shoot(gGame.tiro);
    else if (e.key == `i`)
        gGame.inseticida.updateHeight(1);
    else if (e.key == `k`)
        gGame.inseticida.updateHeight(-1);
    else if (e.key == `j`)
        gGame.inseticida.updateAngle(-1);
    else if (e.key == `l`)
        gGame.inseticida.updateAngle(1);
}

/* ==================================================================
  Funções auxiliares
*/
/**
 * Gera lista de n vértices de um polígono canônico
 * equivalente à aproximação de uma circunferência
 */
function generateVertexList(n) {
    let vertex = [];
    let angle = 2*Math.PI / n;
    for (let i = 0; i < n; i++) {
        vertex.push([Math.cos(angle*i), Math.sin(angle*i)]);
    }
    return vertex;
}

/**
 * Converte ângulo em graus para radianos.
 */
function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Gera aleatoriamente um valor em intervalo de tamanho size
 * com limite inferior offset
 */
function randomIn(size, offset = 0) {
    return Math.random() * size + offset;
}

/* ==================================================================
  Códigos de shaders
*/
var glVertexShaderSrc = `#version 300 es
in vec2 aVertex;
uniform vec4 uColor;
uniform vec2 uResolution;
uniform vec2 uTranslate;
uniform vec2 uScale;
uniform vec2 uRotate;
out vec4 vColor;

void main() {
    vec2 v = aVertex;
    v = v * uScale;
    v = vec2(
        v.x * uRotate.x + v.y * uRotate.y,
        v.y * uRotate.x - v.x * uRotate.y
    );
    v = v + uTranslate;
    v = (v / uResolution) * 2.0 - 1.0;

    gl_Position = vec4(v, 0, 1);
    vColor = uColor;
}
`;

var glFragmentShaderSrc = `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 outColor;

void main() {
  outColor = vColor;
}
`;