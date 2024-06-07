/* ==================================================
    cronometro.js

    Nome: Júlia Melo Teixeira dos Santos
    NUSP: 12542306

    Ao preencher esse cabeçalho com o meu nome e o meu número USP,
    declaro que todas as partes originais desse exercício programa (EP)
    foram desenvolvidas e implementadas por mim e que portanto não 
    constituem desonestidade acadêmica ou plágio.
    Declaro também que sou responsável por todas as cópias desse
    programa e que não distribui ou facilitei a sua distribuição.
    Estou ciente que os casos de plágio e desonestidade acadêmica
    serão tratados segundo os critérios divulgados na página da 
    disciplina.
    Entendo que EPs sem assinatura devem receber nota zero e, ainda
    assim, poderão ser punidos por desonestidade acadêmica.

    Abaixo descreva qualquer ajuda que você recebeu para fazer este
    EP.  Inclua qualquer ajuda recebida por pessoas (inclusive
    monitores e colegas). Com exceção de material da disciplina, caso
    você tenha utilizado alguma informação, trecho de código,...
    indique esse fato abaixo para que o seu programa não seja
    considerado plágio ou irregular.

    Descrição de ajuda ou indicação de fonte:

================================================== */

window.onload = main;

/* ==================================================================
    constantes e variáveis globais
*/
var gClock = {
  mm: 0,
  ss: 0,
  ms: 0,
  toString: function() {
    // retorna string no formato "mm : ss : ms"
    return `${f(this.mm)} : ${f(this.ss)} : ${f(this.ms)}`;
  },
  toSimpleString: function() {
    // retorna string no formato "mm:ss"
    return `${f(this.mm)}:${f(this.ss)}`;
  },
  toClock: function(s) {
    // recebe string s no formato "mm:ss"
    // normaliza valores de mm e ss para no máximo 59
    this.mm = Math.min(59, parseInt(s.slice(0,2)));
    this.ss = Math.min(59, parseInt(s.slice(3,5)));
    this.ms = 0;
  },
  fromMS: function(t) {
    // transforma tempo t em unidades separadas
    this.ms = Math.floor(t / 10) % 100;
    t = Math.floor(t / 1000);
    this.mm = Math.floor(t / 60);
    this.ss = t - this.mm * 60;
    return this.toString();
  },
  toMS: function() {
    // transforma unidades separadas em milissegundos
    return this.mm * 60000 + this.ss * 1000 + this.ms * 10;
  },
  reset: function() {
    this.mm = 0;
    this.ss = 0;
    this.ms = 0;
  }
};

var gInterface = {
  init: 0,  // valor de referência como início da contagem em ms
  end: 0,   // valor de referência como fim da contagem em ms
  acc: 0    // valor acumulativo para restaurar contagem após pausas em ms
};

/* ==================================================================
    função main
*/
function main() {
  console.log("EP01 - Cronômetro e Timer");
  buildInterface();
  nextFrame();
};

/**
 * Registra os elementos HTML responsáveis pela interação no objeto
 * interface e os associa às rotinas de callback.
 */
function buildInterface() {
  // teclado
  gInterface.kboard = document.getElementsByClassName("btKBoard");

  // botões
  gInterface.mode = document.getElementById("btMode");
  gInterface.start = document.getElementById("btStart");
  gInterface.pause = document.getElementById("btPause");

  // campos de texto
  gInterface.time = document.getElementById("time");
  gInterface.clock = document.getElementById("clock");

  // registro das funções de callback
  Array.prototype.forEach.call(gInterface.kboard, function(key) { key.onclick = callbackKBoard; });
  gInterface.mode.onclick = callbackMode;
  gInterface.start.onclick = callbackStart;
  gInterface.pause.onclick = callbackPause;
}

/**
 * callbackIdle
 */
function callbackIdle(e) {
  console.log("Tecla desabilitada!");
}

/**
 * callbackKBoard
 */
function callbackKBoard(e) {
  let v = gInterface.time.value;
  let k = e.currentTarget.value; // valor do botão que foi clicado
  let mm, ss;
  if (k == "Cl") {
    mm = "00";
    ss = "00";
  }
  else {
    mm = v.charAt(1) + v.charAt(3);
    ss = v.charAt(4) + k;
  }
  gInterface.time.value = mm + ":" + ss;
  console.log("Botão: " + k + " " + mm + ss);
}

/**
 * callbackMode
 */
function callbackMode(e) {
  let v = gInterface.mode.value;

  if (v == "Crono") {
    console.log("Modo Timer habilitado.");
    gInterface.mode.value = "Timer";
  }
  else {
    console.log("Modo Crono habilitado.");
    gInterface.mode.value = "Crono";
  }
}

/**
 * callbackStart
 */
function callbackStart(e) {
  let m = gInterface.mode.value;
  let v = gInterface.start.value;

  if (v == "Start") {
    gInterface.start.value = "Stop";
    gClock.toClock(gInterface.time.value);
    gInterface.time.value = gClock.toSimpleString();
    gInterface.inputTime = gClock.toMS();
    gInterface.init = Date.now();
  }
  else {
    gInterface.start.value = "Start";
  }
}

/**
 * callbackPause
 */
function callbackPause(e) {
	let v = gInterface.pause.value;
	
  if (v == "Pause") {
    gInterface.pause.value = "Run";
		console.log("Pausado.");

    // guardar contagem antes da pausa
    gInterface.acc = gClock.toMS();

		// bloquear outros botões quando está pausado
    Array.prototype.forEach.call(gInterface.kboard, function(key) { key.onclick = callbackIdle; });
    gInterface.mode.onclick = callbackIdle;
    gInterface.start.onclick = callbackIdle
  }
  else {
    gInterface.pause.value = "Pause";
    console.log("Rodando...");

    // redefinir início e restaurar contagem após pausa
    gInterface.init = Date.now();

    // desbloquear outros botões quando está rodando
    Array.prototype.forEach.call(gInterface.kboard, function(key) { key.onclick = callbackKBoard; });
    gInterface.mode.onclick = callbackMode;
    gInterface.start.onclick = callbackStart;
  }
}

/**
 * animação
 */
function nextFrame(e) {
  let m = gInterface.mode.value;
  let s = gInterface.start.value;
  let p = gInterface.pause.value;
  let df, finished = false;

  if (s == "Stop" && p == "Pause") {
    if (m == "Crono") { // inicia em 0 e vai até inputTime
      df = (Date.now() - gInterface.init) + gInterface.acc;
      gClock.fromMS(df);
      finished = df >= gInterface.inputTime;
    }
    else { // inicia em time e vai até 0
      df = gInterface.inputTime - (Date.now() - gInterface.init);
      gClock.fromMS(df);
      finished = df <= 0;
    }

    if (finished) {
      gInterface.start.value = "Start";
      gInterface.pause.value = "Pause";
      if (m == "Crono") {
        gClock.fromMS(gInterface.inputTime);
      }
      else {
        gClock.reset();
      }
    }

    gInterface.clock.innerHTML = gClock.toString();
  }

  window.requestAnimationFrame(nextFrame);
  
}

/**
 * recebe um inteiro com até dois dígitos
 * retorna uma string com zeros a esquerda.
 */
function f(x) {
  return ("00" + x).slice(-2);
}