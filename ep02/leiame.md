# MAC0420/MAC5744 EP02 Pescaria
Júlia Melo Teixeira dos Santos - NUSP 12542306

## Introdução
Nesta simulação de pescaria, é possível controlar um arpão lançador de bolhas para atingir e capturar peixes nadando no mar.
Personalize a experiência com os _sliders_ de ajuste de velocidade, controlável para peixes e também para bolha de captura.
Para movimentos mais certeiros, pause o jogo e programe o lançamento de sua bolha no modo passo-a-passo.

### Controles
- Arpão: movimento do _mouse_ ou teclas `a` e `d`
- Bolha: botão esquerdo do mouse ou tecla `s`

## Horas de trabalho
O EP foi desenvolvido no período de 01/04 até 06/04, com a seguinte divisão de trabalho:

- 01/04 dedicado à leitura e compreensão do enunciado e à criação de um esquema com elementos básicos do jogo
    - 2 horas
- 02/04 e 03/04 dedicados ao código da simulação (movimento e interação entre os agentes do jogo) e dos elementos gráficos (agentes representados no Canvas 2D)
    - 4 horas
- 04/04 pausa no desenvolvimento
- 05/04 dedicado aos elementos de controle do jogo através da interação do usuário com a interface
    - 4 horas
- 06/04 correção de erros e escrita do relatório
    - 3 horas

Resultando em um total de 13 horas de trabalho durante uma semana de desenvolvimento.

## Dificuldades
### Transformações
Apesar de ter compreendido o conceito de transformações geométricas quando passado em aula, seu uso no EP não foi tão intuitivo. O esquema montado em papel no 1° dia de desenvolvimento foi majoritariamente focado em entender quais transformações seriam usadas para partir da região normalizada e chegar na região ajustada ao Canvas.

Inicialmente, o entendimento de que as coordenadas precisariam passar por uma transformação matemática para serem representadas no espaço do Canvas não foi imediatamente relacionado ao uso das funções de transformação geométrica `translate` e `scale`, mas sim a um ajuste manual (não repassado à API do Canvas) das posições de cada elemento do jogo. Apenas no fim do 2° dia de desenvolvimento que percebi como tais funções tornariam a implementação mais prática e melhor ajustada às boas práticas de programação gráfica.

### Refinamento das colisões
As colisões de peixes com bordas do mar e da bolha com os peixes não parecem suficientemente refinadas mesmo no estágio final de desenvolvimento.

A colisão de peixes com bordas do mar foi simplificada ao máximo possível, já que seria verificada repetidamente durante todo o jogo. O raio _r_ era somado/subtraído à coordenada _x_ para verificar se laterais do mar foram ultrapassadas e somado/subtraído à coordenada _y_ para verificar se o topo ou a areia foram ultrapassados. Como consequência, colisões que ao mesmo tempo ocorrem com os limites verticais e horizontais (diagonais), não aparentam muito refinadas.

A colisão da bolha com peixes foi aproximada para verificação de se um ponto está dentro de uma circunferência, o que elimina as dimensões da bolha, representada apenas visualmente por um quadrado, na verificação de captura de um peixe, representado visual e matematicamente por círculo de raio _r_. Como consequência, a bolha às vezes encosta no peixe, mas a captura não é contabilizada, pois eles não estavam próximos o suficiente para o centro da bolha se encontrar dentro da distância de um raio do peixe.

## Bugs
Lista de elementos da implementação que funcionam, mas que causam uma certa estranheza:

- Ainda é possível movimentar o arpão e atirar uma bolha (definir sua posição inicial, sem movimento) mesmo em seu estado pausado. Não é um _bug_ propriamente dito, pois poderia ser modificado, mas, como o estado _pausado_ do jogo estava limitado apenas à estática dos peixes e da bolha e nada foi dito sobre os outros elementos, deixei o arpão e sua função de atirar livres.
- O ajuste das dimensões do Canvas quando a tela é redimensionada faz com que a porção da "praia" no jogo fique visível apenas após o usuário dar _scroll_ na tela. Tentei algumas maneiras de solucionar esse problema, como definir a altura do canvas como apenas 90% da altura da janela, mas nenhum dos métodos levou ao resultado que eu esperava, então mantive o ajuste das dimensões inalterado.

Lista de elementos da implementação com funcionamento aparentemente inadequado:

- Peixes gerados muito próximos de bordas ficam "grudados" a ela, apenas refletindo a velocidade ao colidir com a outra borda. Por exemplo, se um peixe é gerado muito perto da areia, a componente _y_ de sua velocidade não é refletida, apenas a componente _x_ é quando ele colide com as laterais do mar. Isso está diretamente relacionado à dificuldade com refinamento de colisões.

## Opcionais
- Além de peixes como aproximações poligonais de um círculo com 4, 8 e 16 lados, foram inclusos polígonos com 6 e 10 lados.
- Além do _slider_ de ajuste da velocidade dos peixes, foi adicionado um _slider_ idêntico para ajuste da velocidade da bolha. Isso torna a pescaria mais personalizável.