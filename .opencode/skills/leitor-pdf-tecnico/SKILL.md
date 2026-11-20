---
name: leitor-pdf-tecnico
description: Lê PDFs técnicos com precisão (manuais, normas, documentos, desenhos e plantas de engenharia, catálogos e fichas de produto) e responde em português do Brasil, com texto fácil de entender porém completo, sempre citando documento, página e item, e com imagem redesenhada/explicada quando pedido. Use SEMPRE que o usuário anexar ou mencionar um PDF, manual, norma, desenho, planta, catálogo, ficha técnica ou a biblioteca de PDFs, ou pedir "o que diz o manual", "qual a cota", "qual o torque/valor/especificação", "me explica esse desenho", "me mostra em imagem", "procura no PDF", mesmo que ele não diga a palavra "skill".
---

# Leitor de PDF técnico

Objetivo: responder o que o usuário pediu a partir dos PDFs, com **precisão** (nada inventado), **clareza** (fácil de entender) e **completude** (sem deixar de fora o que importa). Responda sempre em português do Brasil.

Por que isso importa: o usuário usa essas respostas em trabalho técnico (engenharia, obra, produto). Um número errado ou inventado custa caro; um texto confuso faz ele reler o PDF de qualquer jeito. Então: confirmar na fonte, explicar simples, mostrar de onde veio.

## 1. Descobrir de onde vêm os PDFs

- **Anexados na conversa:** estão em `/mnt/user-data/uploads/`.
- **Biblioteca fixa da skill:** em `biblioteca/` (veja `biblioteca/indice.md`; se não existir, rode `python scripts/pdf_tool.py index biblioteca`). Para saber como o usuário adiciona ou atualiza PDFs ali, leia `references/biblioteca.md`.
- Se a pergunta não deixa claro **qual** documento usar (há vários possíveis, ou revisões diferentes), faça **uma pergunta curta** antes de responder. Não adivinhe o documento.

## 2. Ler com precisão (nesta ordem)

Use `scripts/pdf_tool.py` (comandos completos no topo do arquivo):

1. `info <pdf>`: tamanho, nº de páginas e quais páginas não têm texto (escaneadas ou desenho). Isso define a estratégia.
2. `search <pdf> "termo1" "termo2"`: localiza as páginas relevantes. Tente sinônimos e abreviações (ex.: "torque", "aperto", "Nm").
3. `text <pdf> <ini> [fim]`: lê o texto das páginas. Faz OCR sozinho em página escaneada.
4. `tables <pdf> <página>`: extrai tabelas. Se sair incompleta, leia visualmente.
5. `render <pdf> <página> --dpi 150`: gera imagem da página. **Olhe a imagem com `view`** sempre que a resposta depender de tabela, desenho, cota, legenda, símbolo ou qualquer número crítico. Para detalhe pequeno, use `--crop x0 y0 x1 y1` (frações de 0 a 1) com `--dpi 200` a `300`.

Regras de precisão:
- **Todo número crítico** (cota, torque, carga, tolerância, quantidade, norma/ano) deve ser conferido na imagem da página, não só no texto extraído; OCR e extração erram vírgulas, zeros e unidades.
- Mantenha **unidades e notação originais** (mm, cm, m, kN, MPa, vírgula decimal) e diga a unidade ao lado de cada valor.
- Leia **notas de rodapé, observações, legendas e carimbo/legenda do desenho** (revisão, escala, data, projetista). Muitas vezes mudam o sentido da resposta.
- Se houver **revisões ou versões diferentes**, diga qual usou.
- Se duas partes do documento **se contradizem**, mostre as duas com a página de cada e não escolha em silêncio.

## 3. Quando a informação não existe ou não está clara

Diga com todas as letras: **"Não encontrei essa informação neste PDF"** (e onde procurou: páginas e termos). **Não invente, não complete de memória, não estime.** Se ajudar, indique o que *existe* de mais próximo, rotulando claramente como "não é a resposta exata". Se a leitura estiver duvidosa (imagem borrada, texto cortado), diga qual trecho ficou incerto e peça um arquivo melhor ou a confirmação do usuário.

## 4. Formato da resposta

Use esta estrutura (adapte o tamanho ao pedido, mas mantenha a ordem):

1. **Resposta direta**: a resposta em 1 a 3 frases, no topo.
2. **Explicação simples**: em linguagem do dia a dia, passo a passo se for procedimento; termos técnicos explicados na primeira vez. Inclua o que o usuário precisa saber para aplicar (condições, exceções, valores relacionados).
3. **Fonte** (sempre): `Documento: <nome do arquivo> · Página: <n> · Item: <seção/tabela/figura/nota/cota>`. Se usou mais de um trecho, uma linha de fonte por trecho.
4. **Pontos de atenção** (só se houver): notas, restrições, divergências, incertezas.
5. **Imagem** (só quando pedida, veja abaixo).

Estilo: frases curtas, sem jargão desnecessário, tabelas pequenas quando comparar valores. Completo não é longo: inclua tudo que muda a decisão do usuário e corte o resto.

## 5. Imagens

Quando o usuário pedir imagem, ele quer uma **imagem redesenhada e explicada por você**, não só o recorte do PDF:

- Redesenhe de forma limpa (matplotlib ou SVG) com **rótulos em português**, setas, cotas e legendas que expliquem o que importa, usando **somente valores lidos do documento**.
- Escreva na própria imagem a fonte: `Fonte: <arquivo>, p. <n>` e a observação **"Redesenho esquemático, fora de escala. Conferir no original."** quando não for proporcional.
- Não adicione dimensões, elementos ou detalhes que não estejam no PDF. Se faltar uma informação para completar o desenho, deixe o espaço marcado como "não informado no documento".
- Salve em `/mnt/user-data/outputs/` e apresente com `present_files`. Depois descreva em 1 ou 2 frases o que a imagem mostra.
- Se o usuário pedir também o original, gere o recorte com `render --crop` e entregue junto, para ele comparar.

Para desenhos e plantas, leia antes `references/desenhos-tecnicos.md`.

## 6. Perguntas ao usuário

Pergunte (uma de cada vez, curta) quando: o documento ou a revisão é ambígua; a pergunta pode ter respostas diferentes conforme o caso (norma, modelo, classe, ambiente); falta informação do usuário para escolher o valor certo. Se der para responder com uma suposição segura, responda e declare a suposição.

## 7. Conferência final (antes de enviar)

- Cada número da resposta aparece na fonte citada?
- A unidade e a página estão corretas?
- Li notas e legendas relacionadas?
- Nada foi inventado ou completado de memória?
- O texto está entendível por quem não leu o PDF?
