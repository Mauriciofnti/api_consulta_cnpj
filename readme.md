# API de Consulta de Empresas e Geração de PDF

API para consultar informações detalhadas de empresas pelo **CNPJ**, incluindo dados cadastrais, sócios, CNAEs, opções pelo Simples e MEI, e gerar um **PDF** com essas informações.

---

## Tecnologias Utilizadas

- **Node.js** – plataforma de execução JavaScript
- **Express** – framework HTTP
- **PostgreSQL / Neon Serverless** – banco de dados
- **PDFKit** – geração de PDFs
- **CORS** – habilita requisições de diferentes origens
- **dotenv** – gerenciamento de variáveis de ambiente

---

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/Mauriciofnti/api_consulta_cnpj.git
cd api_consulta_cnpj
```
Instale as dependências:

```bash
npm install
```

Configure o arquivo .env na raiz do projeto:

```bash
DB_USER=<usuario_postgres>
DB_HOST=<host_postgres>
DB_NAME=<nome_banco>
DB_PASSWORD=<senha>
DB_PORT=<porta_postgres>
PORT=3000
```
O PORT define a porta da API (padrão: 3000).

Estrutura das Rotas
1. Consulta de Empresa por CNPJ
GET /consulta/:cnpj

Parâmetros:

cnpj – CNPJ completo com 14 dígitos (somente números)

Exemplo de Requisição:

```bash
Copiar
Editar
GET http://localhost:3000/consulta/12345678000195
```
Exemplo de Resposta:
```bash
json
Copiar
Editar
{
  "cnpj": "12345678000195",
  "nome_fantasia": "Empresa Exemplo",
  "razao_social": "Empresa Exemplo LTDA",
  "situacao": "ATIVA",
  "porte_empresa": "MICRO EMPRESA",
  "capital_social": 100000,
  "natureza_juridica": "Sociedade Limitada",
  "logradouro": "Rua Exemplo, 100",
  "bairro": "Centro",
  "municipio": "São Paulo",
  "uf": "SP",
  "cep": "01001-000",
  "telefone_1": "11999999999",
  "telefone_2": null,
  "fax": null,
  "email": "contato@exemplo.com",
  "opcao_pelo_simples": "Simples",
  "data_opcao_simples": "01/01/2015",
  "data_exclusao_simples": null,
  "mei": "Não",
  "data_opcao_mei": null,
  "data_exclusao_mei": null,
  "socios": [
    {
      "nome_socio_razao_social": "João Silva",
      "cnpj_cpf_socio": "12345678901",
      "qualificacao_socio": "Sócio Administrador",
      "data_entrada_sociedade": "01/01/2010",
      "faixa_etaria": "31 a 40 anos"
    }
  ]
}
```
2. Gerar PDF da Empresa
GET /gerar-pdf/:cnpj

Parâmetros:

cnpj – CNPJ completo com 14 dígitos

Descrição:

Gera um PDF com informações da empresa, endereço, contatos e sócios.

Exemplo de Requisição:

```bash
GET http://localhost:3000/gerar-pdf/12345678000195
```
Resposta:

Arquivo PDF para download.

Funções Auxiliares
parseCNPJ(cnpj) – valida o CNPJ e separa em cnpj_basico, cnpj_ordem e cnpj_dv.

Datas retornadas no formato DD/MM/YYYY.

Sócios e CNAEs secundários são retornados em JSON.

Estrutura do Banco de Dados
empresas – dados cadastrais da empresa

estabelecimentos – informações de cada unidade

dados_simples – informações de Simples Nacional e MEI

socios – informações sobre sócios e representantes legais

naturezas_juridicas, qualificacoes_socios, municipios, motivos, cnaes – tabelas auxiliares

Todas as foreign keys são deferrable, permitindo inserção flexível de dados.

Executando a API
```bash
node index.js
Acesse em: http://localhost:3000
```

Observações
Compatível com Neon Serverless e PostgreSQL local.

Endpoints retornam dados completos da empresa, com tratamento de campos nulos.

PDFKit gera relatórios completos, formatando datas, CNPJs e valores monetários.
