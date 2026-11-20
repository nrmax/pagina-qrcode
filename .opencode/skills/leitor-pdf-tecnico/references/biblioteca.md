# Biblioteca fixa de PDFs

A pasta `biblioteca/` guarda PDFs que ficam disponíveis em toda conversa, sem precisar anexar de novo.

## Como o usuário adiciona ou atualiza PDFs

1. Colocar o PDF dentro de `biblioteca/`, de preferência em subpastas por assunto (`biblioteca/manuais/`, `biblioteca/normas/`, `biblioteca/desenhos/`, `biblioteca/catalogos/`).
2. Nome do arquivo descritivo, com versão ou revisão: `manual-bomba-xyz-rev03.pdf`.
3. Rodar `python scripts/pdf_tool.py index biblioteca` para atualizar `biblioteca/indice.md` e preencher a coluna "Tipo".
4. Reempacotar a skill e instalar de novo para a versão nova valer.

## Como o Claude usa a biblioteca

- Leia `biblioteca/indice.md` primeiro para escolher o documento certo.
- Se mais de um documento servir, pergunte qual (ou mostre os candidatos).
- Se a revisão do documento da biblioteca for mais antiga que a do PDF anexado, **priorize o anexado** e avise.
- Informe sempre o nome do arquivo e a revisão na fonte da resposta.

## Limites práticos

- Skills têm limite de tamanho; PDFs muito grandes (centenas de MB) ou muitos arquivos podem não caber. Nesses casos, mantenha na biblioteca só os essenciais e anexe os demais na conversa.
- Normas e catálogos pagos ou com direitos autorais: guarde apenas o que o usuário tem direito de usar.
