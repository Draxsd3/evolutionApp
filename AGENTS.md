## Imported Claude Cowork project instructions

# Instruções obrigatórias de produto, design e experiência

Estas instruções devem orientar todas as decisões do projeto. Sempre priorize simplicidade, clareza, privacidade, acessibilidade e facilidade de uso.

## 1. Não criar uma interface com “cara de IA”

Evite o visual genérico frequentemente produzido por ferramentas de geração automática.

Não utilizar:

* Gradientes exagerados
* Fundos futuristas
* Efeitos neon
* Glassmorphism em excesso
* Bordas brilhantes
* Animações chamativas
* Ícones decorativos sem função
* Ilustrações genéricas de robôs
* Estrelas, brilhos ou símbolos de “magia”
* Textos promocionais como “potencialize sua vida com IA”
* Cards demais na mesma tela
* Dashboards cheios de números
* Cores diferentes para cada categoria
* Elementos que façam o sistema parecer um aplicativo experimental

A presença da inteligência artificial deve ser percebida pelo funcionamento do produto, não por elementos visuais extravagantes.

A IA deve parecer uma parte natural da experiência.

## 2. Referência visual

Utilizar como referência a simplicidade e a clareza dos produtos da OpenAI, sem copiar diretamente sua identidade visual, seus componentes proprietários ou sua marca.

O design deve transmitir:

* Calma
* Confiança
* Privacidade
* Organização
* Inteligência
* Neutralidade
* Maturidade

Utilizar:

* Espaços em branco generosos
* Tipografia legível
* Poucas cores
* Contraste adequado
* Bordas discretas
* Sombras muito suaves
* Ícones simples
* Hierarquia visual clara
* Componentes consistentes
* Animações curtas e funcionais

O resultado deve parecer um produto profissional e cuidadosamente projetado, e não um template genérico.

## 3. Estilo visual

A interface deve ser clean, minimalista e funcional.

Utilizar uma paleta predominantemente neutra:

* Branco, cinza-claro ou off-white no modo claro
* Tons escuros neutros no modo escuro
* Uma única cor de destaque
* Cores de alerta apenas quando realmente necessárias

Não utilizar muitas cores para representar humor, alimentação, treino, sono e produtividade.

Essas informações podem ser diferenciadas por texto, ícones discretos e pequenas variações visuais.

Manter consistência em:

* Espaçamentos
* Tamanhos de fonte
* Altura dos campos
* Bordas
* Botões
* Modais
* Estados de carregamento
* Mensagens de erro
* Menus

## 4. Usabilidade acima da estética

Sempre analisar cada funcionalidade pela perspectiva do usuário.

Antes de adicionar qualquer elemento, considerar:

1. O usuário entende imediatamente para que isso serve?
2. Esse elemento reduz ou aumenta o esforço?
3. Existe uma maneira mais simples de realizar a mesma ação?
4. Essa informação precisa aparecer agora?
5. Essa ação pode ser realizada em poucos passos?
6. O sistema funciona bem no celular?
7. O usuário recebe uma resposta visual clara após agir?

Não criar funcionalidades apenas porque parecem interessantes tecnicamente.

Uma funcionalidade só deve ser adicionada quando resolver um problema real do usuário.

## 5. Interface principal conversacional

A conversa com a IA deve ser o centro do produto.

A tela principal deve priorizar:

* O histórico recente da conversa
* O campo de mensagem
* O botão de voz
* O botão de enviar
* Um acesso discreto ao histórico
* Um acesso discreto aos resumos
* A indicação da data atual

Evitar menus laterais muito grandes ou cheios de itens.

No desktop, pode existir uma barra lateral recolhível.

No celular, utilizar navegação simples e adaptada à tela pequena.

O usuário deve conseguir começar a falar ou escrever poucos segundos depois de abrir a aplicação.

## 6. Conversa por texto e por voz

Criar uma experiência de conversa por voz semelhante, em simplicidade, à experiência de voz do ChatGPT.

A interface de voz deve permitir:

* Iniciar uma conversa por voz
* Pausar a captura
* Encerrar a conversa
* Cancelar uma gravação
* Visualizar claramente quando o sistema está ouvindo
* Visualizar quando a IA está processando
* Visualizar quando a IA está respondendo
* Exibir a transcrição da fala
* Editar a transcrição antes de enviá-la, quando apropriado
* Reproduzir a resposta da IA em áudio
* Interromper a reprodução da resposta
* Continuar a conversa sem precisar tocar novamente no botão a cada mensagem, quando o modo contínuo estiver ativo

A experiência deve possuir estados visuais claros:

* Pronto para conversar
* Ouvindo
* Processando
* Respondendo
* Pausado
* Sem permissão para utilizar o microfone
* Falha de conexão
* Erro ao transcrever
* Erro ao gerar áudio

Nunca deixar o usuário sem saber o que está acontecendo.

## 7. Modo de voz

Ao entrar no modo de voz, utilizar uma tela focada, sem distrações.

Essa tela pode conter:

* Um indicador visual central discreto
* O estado atual da conversa
* A transcrição parcial
* Um botão principal para pausar ou retomar
* Um botão para encerrar
* Um botão para silenciar o áudio
* Um acesso para retornar ao modo de texto

O indicador visual não deve ser excessivamente futurista.

Evitar grandes ondas coloridas, efeitos neon ou animações agressivas.

Utilizar movimento suave apenas para comunicar que o sistema está ouvindo ou respondendo.

## 8. Privacidade da voz

Antes de acessar o microfone, explicar de maneira objetiva por que a permissão é necessária.

Mostrar claramente:

* Quando o microfone está ativo
* Quando o áudio está sendo enviado
* Se o áudio original será armazenado
* Se apenas a transcrição será salva
* Como o usuário pode excluir esses dados

Por padrão, evitar armazenar o arquivo de áudio original, salvo quando isso for necessário e autorizado pelo usuário.

Nunca ativar o microfone sem uma ação explícita.

## 9. Escrita livre, sem formulários cansativos

O usuário deve poder escrever naturalmente, sem precisar organizar o relato.

Exemplo:

“Hoje acordei tarde, comi mal, fiquei muito tempo no celular, mas consegui limpar a casa e estudar durante uma hora.”

A IA deve estruturar essas informações internamente.

Não mostrar um formulário extenso após cada mensagem.

Quando uma informação importante estiver faltando, a IA pode fazer uma pergunta curta e natural.

Exemplo:

“Você lembra aproximadamente quantas horas dormiu?”

Não realizar interrogatórios nem fazer várias perguntas de uma vez.

## 10. Confirmação sem atrito

Depois que a IA interpretar o relato, não abrir automaticamente uma tela cheia de campos.

Mostrar uma confirmação simples, como:

“Registrei seu dia. Você dormiu pouco, teve dificuldade para começar, organizou a casa e estudou por uma hora.”

Disponibilizar ações discretas:

* Corrigir
* Ver detalhes
* Desfazer

O usuário não deve ser obrigado a revisar todos os dados estruturados diariamente.

## 11. Histórico simples

O histórico deve parecer uma linha do tempo pessoal, não uma planilha administrativa.

Cada dia pode mostrar:

* Data
* Pequeno resumo
* Um ou dois indicadores relevantes
* Principais acontecimentos
* Uma ação para abrir o registro completo

Evitar mostrar todas as métricas simultaneamente.

Os detalhes devem aparecer somente quando o usuário abrir o registro.

## 12. Relatórios compreensíveis

Os relatórios não devem parecer relatórios clínicos ou empresariais.

Utilizar linguagem natural.

Exemplo adequado:

“Você teve mais energia nos dias em que dormiu melhor. O uso prolongado do celular apareceu com frequência antes das tarefas que você demorou para começar.”

Evitar:

“Seu índice médio de performance comportamental apresentou variação negativa de 18%.”

Mostrar apenas gráficos que ajudem o usuário a compreender alguma coisa.

Todo gráfico deve ter:

* Um título claro
* Uma explicação curta
* Unidades compreensíveis
* Poucos dados por vez
* Boa visualização no celular

## 13. IA cuidadosa e não julgadora

A IA nunca deve utilizar linguagem moralista.

Evitar palavras e frases como:

* Fracasso
* Falta de disciplina
* Você não se esforçou
* Você desperdiçou o dia
* Você deveria ter feito mais
* Sua rotina foi ruim

Preferir:

* “Você teve dificuldade para começar.”
* “Hoje sua energia pareceu mais baixa.”
* “Mesmo começando mais tarde, você conseguiu realizar algumas tarefas.”
* “Podemos reduzir o próximo passo.”
* “Esse padrão apareceu em outros dias.”

A IA deve reconhecer dificuldades sem infantilizar o usuário.

## 14. A IA não deve concordar com tudo

A IA deve ser acolhedora, mas também honesta.

Ela pode:

* Apontar contradições
* Corrigir informações incorretas
* Questionar interpretações precipitadas
* Mostrar quando não existem dados suficientes
* Diferenciar hipótese de evidência
* Alertar sobre riscos
* Recomendar ajuda especializada quando houver sinais relevantes

Não deve validar automaticamente qualquer conclusão do usuário.

## 15. Segurança em assuntos de saúde

A aplicação pode ajudar o usuário a:

* Registrar sintomas
* Organizar hábitos
* Compreender padrões
* Preparar informações para uma consulta
* Criar pequenas ações práticas
* Entender conceitos gerais de saúde

A IA não deve:

* Fazer diagnósticos
* Prescrever medicamentos
* Alterar doses
* Recomendar interrupção de tratamentos
* Prometer cura
* Apresentar suplementos como soluções garantidas
* Substituir atendimento de emergência

Quando houver sinais de risco imediato, a aplicação deve interromper o fluxo comum e apresentar orientações de segurança adequadas.

## 16. Estados vazios úteis

Quando ainda não existirem dados, não mostrar dashboards vazios.

Utilizar mensagens simples, como:

“Seus registros aparecerão aqui conforme você conversar com a IA.”

Ou:

“Ainda não há dados suficientes para identificar padrões.”

Adicionar uma única ação principal:

“Fazer meu primeiro registro.”

## 17. Onboarding curto

O onboarding deve ter no máximo três etapas.

Sugestão:

1. Explicar que o usuário pode falar ou escrever livremente.
2. Perguntar quais áreas ele deseja acompanhar.
3. Solicitar apenas as permissões realmente necessárias.

Não exigir que o usuário configure toda a rotina antes de utilizar o produto.

Permitir pular etapas e configurar depois.

## 18. Acessibilidade

Implementar:

* Contraste adequado
* Navegação por teclado
* Foco visível
* Labels em todos os campos
* Compatibilidade com leitores de tela
* Botões com áreas de toque adequadas
* Legendas ou transcrição para respostas em áudio
* Respeito à preferência de redução de movimento
* Tamanho mínimo de texto confortável
* Mensagens de erro que não dependam apenas de cor

O modo de voz também deve possuir alternativa completa por texto.

## 19. Responsividade

Desenvolver com prioridade para dispositivos móveis.

A experiência deve funcionar corretamente em:

* Celulares pequenos
* Celulares grandes
* Tablets
* Notebooks
* Monitores maiores

No celular:

* Manter o campo de mensagem acessível
* Considerar o teclado aberto
* Evitar modais grandes
* Evitar tabelas horizontais
* Utilizar áreas de toque confortáveis
* Não esconder ações essenciais em menus difíceis de encontrar

## 20. Desempenho percebido

A aplicação deve parecer rápida mesmo quando uma operação demorar.

Implementar:

* Feedback imediato ao enviar mensagens
* Indicador de processamento
* Streaming da resposta da IA, quando possível
* Skeletons discretos
* Atualização otimista quando segura
* Mensagens claras em caso de erro
* Opção para tentar novamente
* Preservação do texto digitado quando ocorrer falha

Não utilizar animações longas para esconder carregamentos.

## 21. Prevenção de erros

Antes de ações destrutivas, solicitar confirmação.

Exemplos:

* Excluir registro
* Excluir histórico
* Excluir conta
* Remover todos os dados
* Substituir um relatório editado

Disponibilizar a opção de desfazer quando possível.

O sistema deve salvar rascunhos automaticamente para evitar perda de texto.

## 22. Consistência da navegação

Manter poucas áreas principais:

* Conversa
* Histórico
* Resumos
* Rotina
* Configurações

Não criar uma página diferente para cada tipo de informação registrada.

Alimentação, sono, treino, foco e humor devem ser vistos como partes do mesmo dia.

## 23. Não aumentar o escopo sem necessidade

Antes de implementar novas funcionalidades, concluir completamente:

1. Conversa por texto.
2. Conversa por voz.
3. Extração estruturada.
4. Salvamento no Supabase.
5. Histórico.
6. Correção e exclusão de registros.
7. Resumo diário.
8. Segurança e Row Level Security.
9. Boa experiência no celular.
10. Tratamento de erros.

Não adicionar gamificação, rede social, ranking, avatares, moedas, conquistas artificiais ou recursos semelhantes no MVP.

## 24. Critério final de qualidade

Cada tela deve ser revisada com estas perguntas:

* O usuário entende essa tela sem explicação?
* Existe uma ação principal evidente?
* Há informação demais?
* Algum elemento pode ser removido?
* O fluxo funciona com apenas uma mão no celular?
* O sistema informa claramente o que está fazendo?
* A interface parece calma e confiável?
* O usuário consegue corrigir um erro?
* A privacidade está clara?
* Essa experiência parece criada por um produto real e não por um gerador automático?

Quando houver conflito entre uma solução visualmente impressionante e uma solução simples de usar, escolher sempre a solução mais simples de usar.

## 25. Orientação para implementação

Não gerar todas as telas simultaneamente.

Implementar e validar nesta ordem:

1. Sistema de design básico.
2. Layout responsivo.
3. Autenticação.
4. Conversa por texto.
5. Persistência da conversa.
6. Extração e registro diário.
7. Histórico.
8. Conversa por voz.
9. Resumo diário.
10. Resumo semanal.
11. Rotina.
12. Configurações e privacidade.

Para cada etapa:

* Implementar o fluxo completo
* Tratar loading, sucesso, vazio e erro
* Testar em celular e desktop
* Verificar acessibilidade
* Verificar segurança
* Remover complexidade desnecessária

Não avançar para a próxima etapa deixando fluxos principais incompletos.
