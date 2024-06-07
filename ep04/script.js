/*
    script.js de MAC0420/MAC5744 - Simulador de Voo

    Nome: Júlia Melo Teixeira dos Santos
    NUSP: 12542306
 */

window.onload = main;

/* ==================================================================
  Constantes e variáveis globais
*/
const STEP_VTRANS = 10.0;
const STEP_THETA = 1.0;
const X = 0;
const Y = 1;
const Z = 2;
const G = 0.0;

const COLOR = [vec4(0.0, 0.0, 0.0, 1.0),    // black    0
    vec4(1.0, 1.0, 1.0, 1.0),               // white    1
    vec4(1.0, 0.0, 0.0, 1.0),               // red      2
    vec4(0.0, 1.0, 1.0, 1.0),               // cyan     3
    vec4(0.0, 1.0, 0.0, 1.0),               // green    4
    vec4(1.0, 0.0, 1.0, 1.0),               // magenta  5
    vec4(0.0, 0.0, 1.0, 1.0),               // blue     6
    vec4(1.0, 1.0, 0.0, 1.0)];              // yellow   7

const CUBE = {
    vertex: [vec3(-0.5, -0.5, 0.5),
        vec3(-0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, -0.5, 0.5),
        vec3(-0.5, -0.5, -0.5),
        vec3(-0.5, 0.5, -0.5),
        vec3(0.5, 0.5, -0.5),
        vec3(0.5, -0.5, -0.5)]
}

const SPHERE = {
    vertex: [[vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0)],
        [vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, -1.0)],
        [vec3(1.0, 0.0, 0.0), vec3(0.0, -1.0, 0.0), vec3(0.0, 0.0, 1.0)],
        [vec3(1.0, 0.0, 0.0), vec3(0.0, -1.0, 0.0), vec3(0.0, 0.0, -1.0)],
        [vec3(-1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0)],
        [vec3(-1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, -1.0)],
        [vec3(-1.0, 0.0, 0.0), vec3(0.0, -1.0, 0.0), vec3(0.0, 0.0, 1.0)],
        [vec3(-1.0, 0.0, 0.0), vec3(0.0, -1.0, 0.0), vec3(0.0, 0.0, -1.0)]],
};

var gGL;
var gShader = { n: 0, vertex: [], color: [] };
var gInterface = { theta: vec3(0.0, 0.0, 0.0) };
var gSimulator = { time: 0.0, dt: 0.0 };

/* ==================================================================
  Classes
*/
/**
 * Representação da câmera, com posição, magnitude de velocidade linear
 * angulação e sistema de coordenadas próprio.
 * Capaz de atualizar posição e sistema de coordenadas.
 */
class Camera {
    constructor() {
        this.trans = vec3(0.0, 0.0, 0.0);
        this.vtrans = 0.0;
        this.theta = vec3(0.0, 0.0, 0.0);

        // sistema de coordenadas da câmera
        this.right = vec3(1.0, 0.0, 0.0);   // x+
        this.up = vec3(0.0, 1.0, 0.0);      // +y
        this.front = vec3(0.0, 0.0, -1.0);  // -z
    }
    updateTrans() {
        this.trans = add(this.trans, mult(this.vtrans * gSimulator.dt, this.front));
    }
    updateCoordinateSystem() {
        let new_theta = gInterface.theta;
        let delta_theta = subtract(new_theta, this.theta);

        let rX = rotate(delta_theta[X], this.right);
        let rY = rotate(delta_theta[Y], this.up);
        let rZ = rotate(delta_theta[Z], this.front);
        let r = mult(rZ, mult(rY, rX));

        let new_right = mult(r, vec4(this.right[X], this.right[Y], this.right[Z], 0));
        this.right = vec3(new_right[X], new_right[Y], new_right[Z]);
        let new_up = mult(r, vec4(this.up[X], this.up[Y], this.up[Z], 0));
        this.up = vec3(new_up[X], new_up[Y], new_up[Z]);
        let new_front = mult(r, vec4(this.front[X], this.front[Y], this.front[Z], 0));
        this.front = vec3(new_front[X], new_front[Y], new_front[Z]);
        this.theta = vec3(new_theta[X], new_theta[Y], new_theta[Z]);
    }
}

/**
 * Representação do obstáculo, com escala, posição, angulação e velocidades (linear e angular).
 * Capaz de atualizar posição, angulação e velocidade linear.
 */
class Obstacle {
    constructor(polyhedron = null) {
        this.polyhedron = polyhedron;
        this.scale = vec3(1.0, 1.0, 1.0);
        this.trans = vec3(0.0, 0.0, 0.0);
        this.vtrans = vec3(0.0, 0.0, 0.0);
        this.theta = vec3(0.0, 0.0, 0.0);
        this.vtheta = vec3(0.0, 0.0, 0.0);
    }
    updateTrans() {
        this.trans = add(this.trans, mult(gSimulator.dt, this.vtrans));
    }
    updateVTrans() {
        this.vtrans[2] -= G * gSimulator.dt;
    }
    updateTheta() {
        this.theta = add(this.theta, mult(gSimulator.dt, this.vtheta));
    }
}

/**
 * Representação do poliedro cubo com vértices e cores para cada face
 * ou componente de face (triângulo).
 */
class Cube {
    constructor(c) {
        this.n = 0;
        if (c.length == 2) {
            this.createTriangle(1, 0, 3, c[0]);
            this.createTriangle(3, 2, 1, c[1]);
            this.createTriangle(2, 3, 7, c[0]);
            this.createTriangle(7, 6, 2, c[1]);
            this.createTriangle(3, 0, 4, c[0]);
            this.createTriangle(4, 7, 3, c[1]);
            this.createTriangle(6, 5, 1, c[0]);
            this.createTriangle(1, 2, 6, c[1]);
            this.createTriangle(4, 5, 6, c[0]);
            this.createTriangle(6, 7, 4, c[1]);
            this.createTriangle(5, 4, 0, c[0]);
            this.createTriangle(0, 1, 5, c[1]);
            console.log("Criação de cubo com triângulos completa. NVERT", gShader.n);
        }
        else if (c.length == 6) {
            this.createFace(1, 0, 3, 2, c[0]);
            this.createFace(2, 3, 7, 6, c[1]);
            this.createFace(3, 0, 4, 7, c[2]);
            this.createFace(6, 5, 1, 2, c[3]);
            this.createFace(4, 5, 6, 7, c[4]);
            this.createFace(5, 4, 0, 1, c[5]);
            console.log("Criação de cubo com faces completa. NVERT", gShader.n);
        }
        else
            console.log("Criação de cubo inválida.");
    }
    createFace(a, b, c, d, color) {
        // primeira meia-face (triângulo)
        gShader.vertex.push(CUBE.vertex[a]);
        gShader.vertex.push(CUBE.vertex[b]);
        gShader.vertex.push(CUBE.vertex[c]);

        // segunda meia-face (triângulo)
        gShader.vertex.push(CUBE.vertex[a]);
        gShader.vertex.push(CUBE.vertex[c]);
        gShader.vertex.push(CUBE.vertex[d]);

        // atribui mesma cor para todos os vértices de ambos os triângulos
        for (let i = 0; i < 6; i++)
            gShader.color.push(COLOR[color]);
        gShader.n += 6;
        this.n += 6;
    }
    createTriangle(a, b, c, color) {
        // única meia-face (triângulo)
        gShader.vertex.push(CUBE.vertex[a]);
        gShader.vertex.push(CUBE.vertex[b]);
        gShader.vertex.push(CUBE.vertex[c]);

        // atribui mesma cor para todos os vértices do triângulo
        for (let i = 0; i < 3; i++)
            gShader.color.push(COLOR[color]);
        gShader.n += 3;
        this.n += 3;
    }
}

/**
 * Representação do poliedro esfera com vértices e cores para cada face
 * ou componente de face (triângulo).
 */
class Sphere {
    constructor(n = 2) {
        this.n = 0;
        for (let i = 0; i < SPHERE.vertex.length; i++) {
            let a, b, c;
            [a, b, c] = SPHERE.vertex[i];
            this.divideTriangle(a, b, c, n)
        }
        console.log("Criação de esfera com triângulos completa. NVERT", gShader.n);
    }
    divideTriangle(a, b, c, ndivs) {
        if (ndivs > 0) {
            let ab = mix(a, b, 0.5);
            let bc = mix(b, c, 0.5);
            let ca = mix(c, a, 0.5);
        
            ab = normalize(ab);
            bc = normalize(bc);
            ca = normalize(ca);
        
            this.divideTriangle(a, ab, ca, ndivs - 1);
            this.divideTriangle(b, bc, ab, ndivs - 1);
            this.divideTriangle(c, ca, bc, ndivs - 1);
            this.divideTriangle(ab, bc, ca, ndivs - 1);
        }
        else {
            gShader.vertex.push(a);
            gShader.vertex.push(b);
            gShader.vertex.push(c);

            let color = Math.floor(randomIn(COLOR.length));
            for (let i = 0; i < 3; i++)
                gShader.color.push(COLOR[color]);
            gShader.n += 3;
            this.n += 3;
        }
    }
}

/* ==================================================================
  Funções principais
*/
function main() {
    buildInterface();
    buildSimulator();
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
    gInterface.activeStep = false;
    gInterface.canvas = document.getElementById("glCanvas");

    // canvas
    gGL = gInterface.canvas.getContext("webgl2");
    if (!gGL)
        alert("Não foi possível usar WebGL 2.0.");

    // registro das funções de callback
    gInterface.run.onclick = callbackRun;
    gInterface.step.onclick = callbackStep;
    onkeypress = callbackKBoard;
}

/**
 * Registra os elementos do simulador de voo em seu objeto.
 */
function buildSimulator() {
    gSimulator.ship = new Camera();
    gSimulator.ship.trans = vec3(-100, -100, 300);
    
    gSimulator.obstacles = [];

    let floor_poly = new Cube([0, 1]);
    let floor = new Obstacle(floor_poly);
    floor.scale = vec3(500, 500, 20);
    floor.trans = vec3(0, 0, -10);
    gSimulator.obstacles.push(floor);

    let ball_poly = new Cube([6, 2, 5, 4, 7, 3]);
    let ball = new Obstacle(ball_poly);
    ball.scale = vec3(30, 30, 30);
    ball.trans = vec3(0, 0, 90);
    ball.vtheta = vec3(10, 10, 10);
    gSimulator.obstacles.push(ball);

    let spine_poly = new Cube([7, 6]);
    let spine = new Obstacle(spine_poly);
    spine.scale = vec3(5, 5, 150);
    spine.trans = vec3(0, 0, 90);
    spine.vtheta = vec3(10, 10, 10);
    gSimulator.obstacles.push(spine);

    let table_poly = new Cube([2, 5]);
    let table = new Obstacle(table_poly);
    table.scale = vec3(100, 100, 10);
    table.trans = vec3(90, -90, 90);
    table.vtheta = vec3(10, 50, 50);
    gSimulator.obstacles.push(table);

    let sphere_poly = new Sphere();
    let sphere = new Obstacle(sphere_poly);
    sphere.scale = vec3(30, 30, 30);
    sphere.trans = vec3(50, 60, 90);
    sphere.vtheta = vec3(10, 50, 10);
    gSimulator.obstacles.push(sphere);

    let oval_poly = new Sphere();
    let oval = new Obstacle(oval_poly);
    oval.scale = vec3(10, 20, 60);
    oval.trans = vec3(-90, 0, 90);
    oval.vtheta = vec3(30, 10, 30);
    gSimulator.obstacles.push(oval);
}

/**
 * Cria e configura shaders de WebGL 2.0.
 */
function createShaders() {
    // inicializa
    gGL.viewport(0, 0, gInterface.canvas.width, gInterface.canvas.height);
    gGL.clearColor(0.0, 0.0, 0.55, 1.0);
    gGL.enable(gGL.DEPTH_TEST);
    console.log("Canvas: ", gInterface.canvas.width, gInterface.canvas.height);

    // cria programa (shaders)
    gShader.program = makeProgram(gGL, glVertexShaderSrc, glFragmentShaderSrc);
    gGL.useProgram(gShader.program);

    // buffer de vértices
    gShader.bufVertex = gGL.createBuffer();
    gGL.bindBuffer(gGL.ARRAY_BUFFER, gShader.bufVertex);
    gGL.bufferData(gGL.ARRAY_BUFFER, flatten(gShader.vertex), gGL.STATIC_DRAW);

    // configuração de leitura do buffer de vértices
    let aVertex = gGL.getAttribLocation(gShader.program, "aVertex");
    gGL.vertexAttribPointer(aVertex, 3, gGL.FLOAT, false, 0, 0);
    gGL.enableVertexAttribArray(aVertex);

    // buffer de cores
    gShader.bufColor = gGL.createBuffer();
    gGL.bindBuffer(gGL.ARRAY_BUFFER, gShader.bufColor);
    gGL.bufferData(gGL.ARRAY_BUFFER, flatten(gShader.color), gGL.STATIC_DRAW);

    // configuração de leitura do buffer de cores
    var aColor = gGL.getAttribLocation(gShader.program, "aColor");
    gGL.vertexAttribPointer(aColor, 4, gGL.FLOAT, false, 0, 0);
    gGL.enableVertexAttribArray(aColor);

    // atributos uniformes
    gShader.uView = gGL.getUniformLocation(gShader.program, "uView");
    gShader.uPerspective = gGL.getUniformLocation(gShader.program, "uPerspective");
    gShader.uTranslate = gGL.getUniformLocation(gShader.program, "uTranslate");
    gShader.uScale = gGL.getUniformLocation(gShader.program, "uScale");
    gShader.uRotate = gGL.getUniformLocation(gShader.program, "uRotate");

    // atributos uniformes carregados apenas uma vez
    gShader.perspective = perspective(60, 1, 0.1, 3000);
    gGL.uniformMatrix4fv(gShader.uPerspective, false, flatten(gShader.perspective));
}

/**
 * Atualiza os elementos do simulador de voo caso estado seja executando ou passo ativado.
 */
function updateSimulator() {
    if (gInterface.activeStep)
        gSimulator.dt = 1.0;
    else if (gInterface.run.value == "Pausar") {
        let time_now = Date.now()
        gSimulator.dt = (time_now - gSimulator.time) / 1000;
        gSimulator.time = time_now;
    }

    gSimulator.ship.updateTrans();
    gSimulator.ship.updateCoordinateSystem();
    
    for (let i = 0; i < gSimulator.obstacles.length; i++) {
        let o = gSimulator.obstacles.at(i);
        o.updateTrans();
        o.updateTheta();
    }
    
    if (gInterface.activeStep) {
        gSimulator.dt = 0.0;
        gInterface.activeStep = false;
    }
}

/**
 * Gera e renderiza próximo frame para ilustração do estado do simulador (animação).
 */
function nextFrame(e) {
    gGL.clear( gGL.COLOR_BUFFER_BIT | gGL.DEPTH_BUFFER_BIT);

    updateSimulator();
    
    let eye = gSimulator.ship.trans;
    let at = add(eye, gSimulator.ship.front);
    let up = gSimulator.ship.up;
    gShader.view = lookAt(eye, at, up);
    gGL.uniformMatrix4fv(gShader.uView, false, flatten(gShader.view));

    let init = 0;
    for (let i = 0; i < gSimulator.obstacles.length; i++) {
        let o = gSimulator.obstacles.at(i);

        let model_scale = scale(o.scale[X], o.scale[Y], o.scale[Z]);
        let model_rotate = rotateXYZ(o.theta[X], o.theta[Y], o.theta[Z]);
        let model_translate = translate(o.trans[X], o.trans[Y], o.trans[Z]);

        gGL.uniformMatrix4fv(gShader.uScale, false, flatten(model_scale));
        gGL.uniformMatrix4fv(gShader.uRotate, false, flatten(model_rotate));
        gGL.uniformMatrix4fv(gShader.uTranslate, false, flatten(model_translate));
        gGL.drawArrays(gGL.TRIANGLES, init, o.polyhedron.n);
        init += o.polyhedron.n;
    }

    window.requestAnimationFrame(nextFrame);
}

/* ==================================================================
  Funções de callback
*/
/**
 * callbackRun
 */
function callbackRun(e) {
    let v = gInterface.run.value;

    if (v == "Pausar") {
        console.log("Simulador pausado.");
        gSimulator.dt = 0.0;
        gInterface.run.value = "Executar";
        gInterface.step.value = "Passo";
        gInterface.step.disabled = false;
    }
    else {
        console.log("Simulador iniciado.");
        gSimulator.time = Date.now();
        gInterface.run.value = "Pausar";
        gInterface.step.value = "";
        gInterface.step.disabled = true;
    }
}

/**
 * callbackStep
 */
function callbackStep(e) {
    console.log("Passo Simulado.");
    gInterface.activeStep = true;
}

/**
 * callbackKBoard
 */
function callbackKBoard(e) {
    let key = e.key.toLowerCase();
    if (key == `k`) {
        gSimulator.ship.vtrans = 0.0;
        console.log("Tecla K: VEL zerada", gSimulator.ship.vtrans);
    }
    else if (key == `j`) {
        gSimulator.ship.vtrans += STEP_VTRANS;
        console.log("Tecla J: VEL+", gSimulator.ship.vtrans);
    }
    else if (key == `l`) {
        gSimulator.ship.vtrans -= STEP_VTRANS;
        console.log("Tecla L: VEL-", gSimulator.ship.vtrans);
    }
    // INÍCIO da inversão de controles para compensar falha em MVnew.js/rotate
    else if (key == `w`) {
        gInterface.theta[X] -= STEP_THETA;
        console.log("Tecla W: ROT(X)+ sobe", gInterface.theta);
    }
    else if (key == `x`) {
        gInterface.theta[X] += STEP_THETA;
        console.log("Tecla X: ROT(X)- desce", gInterface.theta);
    }
    else if (key == `a`) {
        gInterface.theta[Y] -= STEP_THETA;
        console.log("Tecla A: ROT(Y)+ esquerda", gInterface.theta);
    }
    else if (key == `d`) {
        gInterface.theta[Y] += STEP_THETA;
        console.log("Tecla D: ROT(Y)- direita", gInterface.theta);
    }
    // FIM da inversão de controles para compensar falha em MVnew.js/rotate
    else if (key == `z`) {
        gInterface.theta[Z] += STEP_THETA;
        console.log("Tecla Z: ROT(Z)+ anti-horário", gInterface.theta);
    }
    else if (key == `c`) {
        gInterface.theta[Z] -= STEP_THETA;
        console.log("Tecla C: ROT(Z)- horário", gInterface.theta);
    }
    else
        console.log("Tecla de controle inválida.");
}

/* ==================================================================
  Funções auxiliares
*/
/**
 * Converte ângulo em graus para radianos.
 */
function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Gera aleatoriamente um valor em intervalo de tamanho size
 * com limite inferior offset.
 */
function randomIn(size, offset = 0) {
    return Math.random() * size + offset;
}

/**
 * Gera matriz de rotação conjunta de ângulos arbitrários em cada eixo.
 */
function rotateXYZ(x, y, z) {
    let rX = rotateX(x);
    let rY = rotateY(y);
    let rZ = rotateZ(z);
    return mult(rZ, mult(rY, rX));
}

/**
 * Gera cubos em extremidades de eixos com cores diferentes.
 * Auxilia em debug.
 */
function showCoordinateSystem() {
    gSimulator.ship.trans = vec3(0, 0, 0);

    let a_poly = new Cube([2, 1]);
    let a = new Obstacle(a_poly);
    a.trans = vec3(1, 0, 0);
    gSimulator.obstacles.push(a);

    a_poly = new Cube([3, 1]);
    a = new Obstacle(a_poly);
    a.trans = vec3(-1, 0, 0);
    gSimulator.obstacles.push(a);

    a_poly = new Cube([4, 1]);
    a = new Obstacle(a_poly);
    a.trans = vec3(0, 1, 0);
    gSimulator.obstacles.push(a);

    a_poly = new Cube([5, 1]);
    a = new Obstacle(a_poly);
    a.trans = vec3(0, -1, 0);
    gSimulator.obstacles.push(a);

    a_poly = new Cube([6, 1]);
    a = new Obstacle(a_poly);
    a.trans = vec3(0, 0, 1);
    gSimulator.obstacles.push(a);

    a_poly = new Cube([7, 1]);
    a = new Obstacle(a_poly);
    a.trans = vec3(0, 0, -1);
    gSimulator.obstacles.push(a);
}

/* ==================================================================
  Códigos de shaders
*/
var glVertexShaderSrc = `#version 300 es
in vec3 aVertex;
uniform mat4 uView;
uniform mat4 uPerspective;
uniform mat4 uTranslate;
uniform mat4 uScale;
uniform mat4 uRotate;

in vec4 aColor;
out vec4 vColor;

void main() {
    mat4 model = uTranslate * uRotate * uScale;
    gl_Position = uPerspective * uView * model * vec4(aVertex, 1);
    vColor = aColor;
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