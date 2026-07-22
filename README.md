# Evolua

Diário pessoal conversacional que transforma relatos livres em registros estruturados, com foco em privacidade, clareza e linguagem não julgadora.

## Estrutura

```text
app/         Interface React e rotas da aplicação
backend/     API Node, integração com OpenAI e acesso ao Supabase
database/    Migrações PostgreSQL e políticas de segurança
public/      Arquivos públicos estáticos
tests/       Testes automatizados
build/       Integração de build necessária para o OpenAI Sites
worker/      Entrada da aplicação no Cloudflare Worker
```

As pastas `dist`, `.vinext`, `.wrangler` e `node_modules` são geradas automaticamente e não fazem parte do código-fonte versionado.

## Configuração local

1. Crie um projeto no Supabase.
2. Execute, em ordem, os arquivos de `database/migrations` no SQL Editor.
3. Ative autenticação por e-mail e senha.
4. Copie `.env.example` para `.env` e preencha a URL, a chave pública do Supabase e a chave da OpenAI.
5. Execute `npm install`.
6. Inicie a interface com `npm run dev`.
7. Em outro terminal, inicie a API com `npm run backend:dev`.

## Comandos

- `npm run dev`: inicia a interface em desenvolvimento.
- `npm run backend:dev`: inicia a API em desenvolvimento.
- `npm run build`: gera o build da interface.
- `npm run backend:build`: valida e compila o backend.
- `npm run test`: gera o build e executa os testes.
- `npm run lint`: verifica a qualidade do código.

## Segurança

O navegador utiliza somente a chave pública `anon` do Supabase. A API valida o JWT do usuário e executa as operações sob esse contexto. As políticas de Row Level Security garantem que cada usuário acesse somente os próprios dados.
