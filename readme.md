# API de Consulta de Empresas e Geração de PDF

API para consultar informações detalhadas de empresas pelo **CNPJ**, incluindo dados cadastrais, sócios, CNAEs, opções pelo Simples Nacional e MEI, e gerar um **PDF** com essas informações. A API é construída em Node.js e utiliza um banco de dados PostgreSQL (compatível com Neon Serverless) para armazenar dados obtidos de fontes oficiais da Receita Federal.

O projeto está hospedado no Render e pode ser acessado em: https://api-consulta-cnpj-c6ve.onrender.com/consulta/.

---

## Tecnologias Utilizadas

- **Node.js**: Plataforma de execução JavaScript.
- **Express**: Framework para criação de APIs HTTP.
- **PostgreSQL / Neon Serverless**: Banco de dados relacional com suporte a particionamento para alta escalabilidade.
- **PDFKit**: Biblioteca para geração de relatórios em PDF.
- **CORS**: Middleware para habilitar requisições de diferentes origens.
- **dotenv**: Gerenciamento de variáveis de ambiente.
- **@neondatabase/serverless**: Cliente para conexão serverless com PostgreSQL no Neon.

Dependências adicionais (de `package.json`):
- Dependências principais: `@neondatabase/serverless`, `cors`, `dotenv`, `express`, `pdfkit`, `pg`.
- Dependências de desenvolvimento: `nodemon`.

---

## Descrição da Base de Dados

A base de dados é construída para consultar dados cadastrais de pessoas jurídicas, com base nos arquivos disponibilizados pela Receita Federal em https://dadosabertos.rfb.gov.br/CNPJ/. Os dados atuais contemplam o conjunto disponibilizado em junho de 2025.

- **Tamanho dos Dados**: Os arquivos compactados (.zip) têm aproximadamente 6,49 GB, expandindo para 23,9 GB após descompactação, e ocupam cerca de 37 GB quando importados para o PostgreSQL.
- **Limitações**: Devido a restrições de armazenamento no Neon, apenas um subconjunto de empresas está cadastrado. A rota raiz (`/consulta/`) retorna uma lista de empresas disponíveis para consulta. Atualmente 142 estabelecimentos cadastrados, por exemplo :
```bash
23877478000108 mauricio
35845715000120 wonow
53113791000122 totvs
10139870000108 neogrid
06990590000123 google
15436940000103 amazon
00449824000143 softexpert
54517628000198 linx
```
- **Atualização de Dados**: Os dados da Receita Federal são atualizados mensalmente. `base.sql` possui um script para criação das tabelas, sem normalização, já no padrão dos dados fornecidos. Na o atual endpoint os dados são tratados com outro script antes de serem adicinados as tabelas

A rota raiz retorna um JSON com as empresas cadastradas (cnpj_basico e outros campos básicos):

```bash
GET http://localhost:3000/consulta/
```

Exemplo de Resposta:
```json
[
  {
    "cnpj_basico": "00449824",
    "razao_social": "SOFTEXPERT SOFTWARE S.A.",
    "natureza_juridica": "2054",
    "qualificacao_responsavel": "10",
    "capital_social": "1500000.00",
    "porte_empresa": "05",
    "ente_federativo_responsavel": ""
  },
  {
    "cnpj_basico": "06990590",
    "razao_social": "GOOGLE BRASIL INTERNET LTDA.",
    // ... mais empresas
  }
]
```

---

## Endpoints

1. **Consulta de Empresa por CNPJ**  
   - **Método**: GET  
   - **Rota**: `/consulta/:cnpj`  
   - **Parâmetros**: `cnpj` – CNPJ completo com 14 dígitos (somente números).  
   - **Descrição**: Retorna dados detalhados da empresa em JSON, incluindo situação cadastral, endereço, contatos, sócios (array de objetos), CNAEs secundários (array), e opções pelo Simples/MEI. Campos nulos são tratados como "N/A" ou equivalentes.  

   Exemplo de Requisição:
   ```bash
   GET http://localhost:3000/consulta/53113791003300
   ```

   Exemplo de Resposta:
   ```json
   {
     "cnpj": "53113791003300",
     "nome_fantasia": "",
     "razao_social": "TOTVS S.A.",
     "situacao": "BAIXADA",
     "motivo": "EXTINCAO POR ENCERRAMENTO LIQUIDACAO VOLUNTARIA",
     "porte_empresa": "DEMAIS",
     "ente_federativo_responsavel": "",
     "logradouro": "AVENIDA BRAZ LEME",
     "numero": "1000",
     "complemento": "BLOCO B TERREO",
     "bairro": "CASA VERDE",
     "uf": "SP",
     "municipio": "SAO PAULO",
     "cep": "02511000",
     "telefone_1": "11 40040015",
     "telefone_2": "",
     "fax": "",
     "email": "FISCAL@TOTVS.COM.BR",
     "opcao_pelo_simples": "N",
     "data_opcao_simples": "N/A",
     "data_exclusao_simples": "N/A",
     "opcao_pelo_mei": "N",
     "data_opcao_mei": "N/A",
     "data_exclusao_mei": "N/A",
     "capital_social": "2962584687.27",
     "natureza_juridica": "Sociedade Anônima Aberta",
     "qualificacao_responsavel": "Diretor",
     "cnae_principal": "6201501 - Desenvolvimento de programas de computador sob encomenda",
     "cnaes_secundarios": [
       {
         "cnae_secundario": "6202300 - Desenvolvimento e licenciamento de programas de computador customizáveis"
       },
       // ... mais CNAEs
     ],
     "socios": [
       {
         "identificador_socio": "PESSOA FÍSICA",
         "nome_socio_razao_social": "GUSTAVO DUTRA BASTOS",
         "cnpj_cpf_socio": "***942416**",
         "qualificacao_socio": "Diretor",
         "data_entrada_sociedade": "28/05/2009",
         "pais": null,
         "cpf_representante_legal": "***000000**",
         "nome_representante": "",
         "qualificacao_representante_legal": "00",
         "faixa_etaria": "41 a 50 anos"
       },
       // ... mais sócios
     ]
   }
   ```

2. **Geração de PDF**  
   - **Método**: GET  
   - **Rota**: `/gerar-pdf/:cnpj`  
   - **Parâmetros**: `cnpj` – CNPJ completo com 14 dígitos.  
   - **Descrição**: Gera e retorna um PDF com seções para informações gerais, contatos e sócios. O PDF é formatado com PDFKit, incluindo formatação de datas, valores monetários (ex.: capital social) e máscaras em CNPJ/CEP.  

   Exemplo de Requisição:
   ```bash
   GET http://localhost:3000/gerar-pdf/53113791000122
   ```

   Resposta: Arquivo PDF para download (ex.: `empresa_53113791000122.pdf`).

---

## Estrutura do Banco de Dados

O banco de dados é projetado para eficiência com grandes volumes de dados, utilizando particionamento por range no `cnpj_basico` para otimizar consultas e inserções. Isso divide as tabelas em partições menores, melhorando a performance em datasets com milhões de registros. Todas as chaves estrangeiras são definidas como `DEFERRABLE INITIALLY DEFERRED`, permitindo inserções flexíveis (validação adiada até o commit da transação), o que facilita a importação de dados em massa.

### Tabelas Auxiliares (Não Particionadas)
Essas tabelas armazenam dados de referência e são usadas em joins para enriquecer os resultados:
- **paises**: Códigos e descrições de países (PK: `codigo_paises`).
- **municipios**: Códigos e nomes de municípios brasileiros (PK: `codigo_municipios`).
- **qualificacoes_socios**: Qualificações de sócios e responsáveis (PK: `codigo_qualificacoes_socios`).
- **naturezas_juridicas**: Naturezas jurídicas das empresas (PK: `codigo_naturezas_juridicas`).
- **cnaes**: Classificações Nacionais de Atividades Econômicas (PK: `codigo_cnaes`).
- **motivos**: Motivos de situações cadastrais (PK: `codigo_motivos`).

### Tabelas Principais
- **empresas** (Particionada por `cnpj_basico` em 5 partições: p0 a p4):
  - Armazena dados básicos da empresa: razão social, natureza jurídica, qualificacao_responsavel, capital_social, porte_empresa, ente_federativo_responsavel.
  - PK: `cnpj_basico`.
  - Chaves estrangeiras: Para `naturezas_juridicas` e `qualificacoes_socios`.

- **estabelecimentos** (Particionada por `cnpj_basico` em 10 partições: p0 a p9):
  - Detalhes de filiais/matrizes: nome_fantasia, situação cadastral, endereço (logradouro, número, bairro, uf, cep, municipio), contatos (telefones, email), CNAE principal e secundários.
  - PK: `cnpj_basico, cnpj_ordem, cnpj_dv`.
  - Chaves estrangeiras: Para `empresas`, `motivos`, `paises`, `municipios`, `cnaes`.

- **dados_simples** (Não particionada):
  - Informações sobre opções pelo Simples Nacional e MEI: opcao_pelo_simples, datas de opção/exclusão.
  - PK: `cnpj_basico`.
  - Chave estrangeira: Para `empresas`.

- **socios** (Particionada por `cnpj_basico` em 5 partições: p0 a p4):
  - Detalhes de sócios: identificador_socio, nome_socio_razao_social, cnpj_cpf_socio, qualificacao_socio, data_entrada_sociedade, pais, representante legal, faixa etária.
  - PK: `cnpj_basico, cnpj_cpf_socio, nome_socio_razao_social`.
  - Chaves estrangeiras: Para `empresas`, `qualificacoes_socios` (duas vezes), `paises`.

### Importação de Dados
- Os dados são importados via comandos `\copy` de CSVs da Receita Federal (ex.: `F.K03200$Z.D50614.PAISCSV`).
- Tabelas temporárias (`temp_*`) são usadas para limpeza e validação antes da inserção nas tabelas finais.
- Inserções em partições são feitas em blocos `DO $$ ... $$` para distribuir os dados corretamente.
- Chaves estrangeiras inválidas (ex.: países ou municípios inexistentes) são tratadas como NULL durante a importação.

### Relações e Considerações
- **Relações Principais**: Todas as tabelas principais referenciam `empresas` via `cnpj_basico`. A query de consulta usa joins para combinar dados, com subqueries para CNAEs secundários e sócios (agregados como JSON).
- **Particionamento**: Otimiza consultas em grandes volumes, dividindo por faixas de `cnpj_basico` (ex.: 00000000-10000000 para p0).
- **Índices Recomendados**: Adicione índices em colunas usadas em WHERE/JOIN para performance (ex.: `CREATE INDEX idx_estabelecimentos_cnpj ON estabelecimentos (cnpj_basico);`).
- **Tratamento de Nulos**: A query usa `COALESCE` e `LEFT JOIN` para lidar com dados ausentes (ex.: em `dados_simples`).
- **Atualização**: Para atualizar, baixe novos CSVs, ajuste caminhos em `db.sql` e execute no cliente PostgreSQL (ex.: psql ou Neon console).

---

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/Mauriciofnti/api_consulta_cnpj.git
   cd api_consulta_cnpj
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o arquivo `.env` na raiz do projeto:
   ```bash
   DB_USER=<usuario_postgres>
   DB_HOST=<host_postgres>
   DB_NAME=<nome_banco>
   DB_PASSWORD=<senha>
   DB_PORT=<porta_postgres>
   DATABASE_URL=<url_neon>  # Ex.: postgres://user:pass@host:port/db?sslmode=require
   PORT=3000
   ```
   - `PORT`: Porta da API (padrão: 3000).
   - Use `DATABASE_URL` para Neon ou PostgreSQL local.

4. Configure o Banco de Dados:
   - Execute o script `db.sql` no seu cliente PostgreSQL para criar tabelas e importar dados.
   - Ajuste caminhos dos CSVs em `db.sql` conforme sua máquina.
   - Exemplo de execução: `psql -h host -U user -d db -f db.sql`.

---

## Executando a API

- Em modo desenvolvimento (com hot-reload via nodemon):
  ```bash
  npm run dev
  ```

- Em produção:
  ```bash
  npm start
  ```

Acesse em: http://localhost:3000.

---

## Funções Auxiliares

- **parseCNPJ(cnpj)**: Valida o CNPJ (exige 14 dígitos numéricos) e divide em `cnpj_basico`, `cnpj_ordem` e `cnpj_dv`.
- **Datas**: Retornadas no formato `DD/MM/YYYY`.
- **Arrays**: Sócios e CNAEs secundários são retornados como arrays de objetos JSON.
- **Tratamento de Erros**: CNPJ inválido retorna erro 400; não encontrado retorna 404; erros internos retornam 500.

---

## Observações

- **Compatibilidade**: Funciona com Neon Serverless (serverless PostgreSQL) ou PostgreSQL local/remoto. Para alternar, ajuste a conexão no `index.js` (use `pg` para PostgreSQL padrão).
- **Segurança**: Não há autenticação nos endpoints; adicione em produção (ex.: API keys ou JWT). Dados sensíveis como emails e telefones são expostos.
- **Limitações**: Devido ao tamanho dos dados, apenas um subconjunto está disponível. Para produção, use um banco com mais armazenamento.
- **Atualização de Dados**: Baixe CSVs mensais da Receita Federal e reexecute `db.sql` para atualizar.
- **Deploy**: Hospedado no Render (gratuito para testes). Configure variáveis de ambiente no dashboard do Render.
- **Licença**: ISC (conforme `package.json`).
- **Contribuições**: Fork o repositório, crie branches para features e envie pull requests com descrições claras.

Para dúvidas ou issues, abra uma issue no GitHub.