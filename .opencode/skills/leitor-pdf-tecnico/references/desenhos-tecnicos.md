# Lendo desenhos e plantas de engenharia

Desenhos costumam ter pouco texto extraível e muita informação visual. Por isso: **sempre renderize e olhe a imagem**, e use o texto extraído só como apoio.

## Roteiro de leitura

1. **Carimbo / legenda do desenho** (geralmente canto inferior direito): título, número do desenho, revisão, data, escala, unidade, projetista, folha X de Y. Registre a **revisão** e a **escala**; vão na fonte da resposta.
2. **Notas gerais e especificações**: costumam ficar em uma coluna ou bloco de texto. Leia inteiras (materiais, fck, cobrimento, tolerâncias, normas, soldas, acabamentos). Podem alterar qualquer cota.
3. **Legenda e simbologia**: confirme o que cada símbolo, hachura, tipo de linha e abreviação significa **neste desenho**, sem assumir o padrão de outro projeto.
4. **Cotas e dimensões**: renderize com `--dpi 200` a `300` e recorte a região. Confira unidade (mm, cm, m) e se a cota é **acumulada**, **entre eixos** ou **parcial**. Some as cotas parciais para checar se fecham com o total; se não fecharem, avise.
5. **Tabelas** (materiais, quantitativos, armaduras, lista de peças, furação): use `tables` e confirme visualmente. Cuidado com linhas cortadas, unidades por coluna e notas de rodapé da tabela.
6. **Cortes, detalhes e vistas**: siga as chamadas (ex.: "Corte A-A", "Detalhe 3/05") e leia a folha de destino.
7. **Referências cruzadas**: se o desenho remete a outra folha ou documento que não foi fornecido, diga isso em vez de supor.

## Cuidados específicos

- **Escala:** nunca meça com régua na imagem; use só valores cotados. Se a cota não existe, diga que não está cotada.
- **Unidade padrão** costuma estar na nota geral ("cotas em mm, níveis em m"); confirme.
- **Diferença entre texto e desenho:** se a nota diz uma coisa e a cota mostra outra, apresente as duas com a localização de cada uma.
- **Desenho escaneado:** o OCR de cotas é pouco confiável; leia na imagem ampliada e marque qualquer valor duvidoso como incerto.
- **Folhas grandes (A1/A0):** divida em quadrantes com `--crop` (ex.: `0 0 0.5 0.5`, `0.5 0 1 0.5`...) para ler sem perder detalhe.

## Redesenho explicativo (quando o usuário pedir imagem)

- Reproduza a geometria **esquemática** do que foi pedido (ex.: seção de viga, detalhe de ancoragem, layout de furos), com os rótulos e cotas **exatamente como estão no documento**.
- Use cores só para separar elementos (ex.: concreto, armadura, solo) e coloque legenda.
- Inclua no rodapé da imagem: arquivo, página/folha, revisão e o aviso "Redesenho esquemático. Conferir no original."
- Elementos sem informação no PDF ficam como "não informado", nunca preenchidos por palpite.
