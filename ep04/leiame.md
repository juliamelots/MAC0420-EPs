# MAC0420/MAC5744 EP04 Simulador de Voo
Júlia Melo Teixeira dos Santos - NUSP 12542306

## Introdução
Nesta simulação de voo, é possível controlar uma nave através do ponto de vista de seu piloto.
Navegue entre obstáculos no formato de cubos e esferas controlando a velocidade e a direção do voo, sem se preocupar com colisões.
Para movimentos mais certeiros, pause o jogo e programe sua trajetória no podo passo-a-passo.

## Controles
### Velocidade linear
- **K**: zera a velocidade de translação
- **J**: incrementa velocidade de translação
- **L**: decrementa velocidade de translação

### Rotação
- **W**: incrementa a rotação no eixo X, fazendo nariz da nave subir (*pitch*)
- **X**: decrementa a rotação no eixo X, fazendo nariz da nave descer (*pitch*)
- **A**: incrementa a rotação no eixo Y, fazendo a nave virar para esquerda (*yaw*)
- **D**: decrementa a rotação no eixo Y, fazendo a nave virar para direita (*yaw*)
- **Z**: incrementa a rotação no eixo Z, fazendo a nave girar no sentido anti-horário (*roll*)
- **C**: decrementa a rotação no eixo Z, fazendo a nave girar no sentido horário (*roll*)

### Geral
- **Executar/Pausar**: habilita/desabilita a atualização do estado do simulador
- **Passo**: atualiza estado do simulador com progresso de 1 segundo

## Dependências
Módulos `MVnew.js` e `macWebglUtils.js`, disponibilizados pelo docente da disciplina para uso livre.

## Dificuldades
### Controle da câmera
A compreensão das transformações aplicadas sobre o sistema de coordenadas da câmera e sua transmissão ao modo de visão do mundo através da função `lookAt(eye, at, up)` foi a parte mais desafiadora do EP.
As diferenças entre os sistemas de coordenadas do mundo, câmera e objetos tornaram-se ainda mais turvas quando a possibilidade de controlar a câmera através de seu ponto de vista foi apresentada.

Inicialmente, as rotações estavam sendo calculadas para a câmera considerando que os ângulos deveriam ser aplicados aos eixos originais do sistema de coordenadas da câmera, ou seja, +Y como *up*, +X como *right* e -Z como *front*. Entretanto, isso desconsiderava as consequências que modificar um dos eixos originais traziam aos demais eixos. Apenas após experimentação diversa com o simulador foi possível perceber o erro e sua origem, que puderam ser reparados. Na versão correta, as rotações são calculadas considerando o incremento/decremento dos ângulos comparados ao estado anterior e aplicando-os aos eixos *up*, *right* e *front* modificados ao longo da simulação.

## Bugs
Um erro na função `rotate` do módulo `MVnew.js` foi identificado. Como resultado, os controles de *pitch* e *yaw* estavam invertidos, ou seja, a tecla **W** faz o nariz descer ao invés de subir e **A** faz o nariz virar para direita ao invés de para a esquerda.

Buscando solucionar esse problema sem modificar o módulo fornecido para a disciplina, tomou-se as seguintes novas convenções por debaixo dos panos (apenas em implementação), que estão devidamente sinalizadas no código:
- **W**: **decrementa** a rotação no eixo X, fazendo nariz da nave subir (*pitch*)
- **X**: **incrementa** a rotação no eixo X, fazendo nariz da nave descer (*pitch*)
- **A**: **decrementa** a rotação no eixo Y, fazendo a nave virar para esquerda (*yaw*)
- **D**: **incrementa** a rotação no eixo Y, fazendo a nave virar para direita (*yaw*)