require('dotenv').config();
const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const { neon } = require('@neondatabase/serverless');

const app = express();
const port = 3000;

const selectQuery = `SELECT 
        estab.cnpj_basico || estab.cnpj_ordem || estab.cnpj_dv AS cnpj,
        estab.nome_fantasia,
        empr.razao_social,
        CASE estab.situacao_cadastral
            WHEN '01' THEN 'NULA'
            WHEN '02' THEN 'ATIVA'
            WHEN '03' THEN 'SUSPENSA'
            WHEN '04' THEN 'INAPTA'
            WHEN '08' THEN 'BAIXADA'
            ELSE 'Não informado'
        END AS situacao,
        mt.descricao AS motivo,
        CASE empr.porte_empresa
            WHEN '00' THEN 'NÃO INFORMADO'
            WHEN '01' THEN 'MICRO EMPRESA'
            WHEN '03' THEN 'EMPRESA DE PEQUENO PORTE'
            ELSE 'DEMAIS'
        END AS porte_empresa,
        empr.ente_federativo_responsavel,
        CONCAT(estab.tipo_logradouro, ' ', estab.logradouro) AS logradouro,
        estab.numero,
        estab.complemento,
        estab.bairro,
        estab.uf,
        muni.descricao AS municipio,
        estab.cep,
        TRIM(CONCAT(estab.ddd_1, estab.telefone_1)) AS telefone_1,
        TRIM(CONCAT(estab.ddd_2, estab.telefone_2)) AS telefone_2,
        TRIM(CONCAT(estab.ddd_fax, estab.fax)) AS fax,
        estab.correio_eletronico AS email,
        CASE ds.opcao_pelo_simples
            WHEN 'S' THEN 'Simples'
            ELSE 'Não'
        END AS opcao_pelo_simples,
        TO_CHAR(ds.data_opcao_simples, 'DD/MM/YYYY') AS data_opcao_simples,
        TO_CHAR(ds.data_exclusao_simples, 'DD/MM/YYYY') AS data_exclusao_simples,
        CASE ds.opcao_pelo_mei
            WHEN 'S' THEN 'Sim'
            ELSE 'Não'
        END AS mei,
        TO_CHAR(ds.data_opcao_mei, 'DD/MM/YYYY') AS data_opcao_mei,
        TO_CHAR(ds.data_exclusao_mei, 'DD/MM/YYYY') AS data_exclusao_mei,
        empr.capital_social,
        nj.descricao AS natureza_juridica,
        qs.descricao AS qualificacao_responsavel,
        CONCAT(cp.codigo_cnaes, ' - ', cp.descricao) AS cnae_principal,
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'cnae_secundario', CONCAT(cs.codigo_cnaes, ' - ', cs.descricao)
                    )
                ) 
                FROM unnest(string_to_array(estab.cnae_fiscal_secundaria, ',')) AS sec(codigo_cnaes)
                JOIN cnaes cs ON cs.codigo_cnaes = sec.codigo_cnaes
            ), '[]'::json
        ) AS cnaes_secundarios,
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'identificador_socio',
                        CASE s.identificador_socio
                            WHEN '1' THEN 'PESSOA JURÍDICA'
                            WHEN '2' THEN 'PESSOA FÍSICA'
                            WHEN '3' THEN 'ESTRANGEIRO'
                            ELSE 'NÃO INFORMADO'
                        END,
                        'nome_socio_razao_social', s.nome_socio_razao_social,
                        'cnpj_cpf_socio', s.cnpj_cpf_socio,
                        'qualificacao_socio', qs_socio.descricao,
                        'data_entrada_sociedade', TO_CHAR(s.data_entrada_sociedade, 'DD/MM/YYYY'),
                        'pais', s.pais,
                        'cpf_representante_legal', s.cpf_representante_legal,
                        'nome_representante', s.nome_representante,
                        'qualificacao_representante_legal', s.qualificacao_representante_legal,
                        'faixa_etaria',
                        CASE s.faixa_etaria
                            WHEN '1' THEN '0 a 12 anos'
                            WHEN '2' THEN '13 a 20 anos'
                            WHEN '3' THEN '21 a 30 anos'
                            WHEN '4' THEN '31 a 40 anos'
                            WHEN '5' THEN '41 a 50 anos'
                            WHEN '6' THEN '51 a 60 anos'
                            WHEN '7' THEN '61 a 70 anos'
                            WHEN '8' THEN '71 a 80 anos'
                            WHEN '9' THEN 'maior de 80 anos'
                            WHEN '0' THEN 'não se aplica'
                        END
                    )
                )
                FROM socios s
                LEFT JOIN qualificacoes_socios qs_socio
                    ON qs_socio.codigo_qualificacoes_socios = s.qualificacao_socio
                WHERE s.cnpj_basico = estab.cnpj_basico
            ), '[]'::json
        ) AS socios
      FROM estabelecimentos estab
      JOIN empresas empr ON empr.cnpj_basico = estab.cnpj_basico
      JOIN dados_simples ds ON ds.cnpj_basico = estab.cnpj_basico
      JOIN municipios muni ON muni.codigo_municipios = estab.municipio
      JOIN naturezas_juridicas nj ON nj.codigo_naturezas_juridicas = empr.natureza_juridica 
      JOIN qualificacoes_socios qs ON qs.codigo_qualificacoes_socios = empr.qualificacao_responsavel
      JOIN motivos mt ON mt.codigo_motivos = estab.motivo_situacao_cadastral
      JOIN cnaes cp ON cp.codigo_cnaes = estab.cnae_fiscal_principal
      WHERE estab.cnpj_basico = $1
        AND estab.cnpj_ordem = $2
        AND estab.cnpj_dv = $3;
        `

app.use(cors());
app.use(express.json());

// Conexão com Neon Serverless
const sql = neon(process.env.DATABASE_URL);

// Função para dividir o CNPJ
function parseCNPJ(cnpj) {
  const cleanedCNPJ = cnpj.replace(/[^\d]/g, '');
  if (cleanedCNPJ.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos');
  }
  return {
    cnpj_basico: cleanedCNPJ.slice(0, 8),
    cnpj_ordem: cleanedCNPJ.slice(8, 12),
    cnpj_dv: cleanedCNPJ.slice(12, 14),
  };
}

// Rota para consultar por CNPJ
app.get('/consulta/:cnpj', async (req, res) => {
  try {
    const { cnpj } = req.params;
    const { cnpj_basico, cnpj_ordem, cnpj_dv } = parseCNPJ(cnpj);

    const query = selectQuery;
    
    const result = await sql.query(query, [cnpj_basico, cnpj_ordem, cnpj_dv]);

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ message: 'CNPJ não encontrado' });
    }
  } catch (err) {
    console.error('Erro na consulta:', err.message);
    res.status(500).json({ error: 'Erro ao consultar o CNPJ: ' + err.message });
  }
});

// Rota para gerar PDF (mesma lógica que você já tem)
app.get('/gerar-pdf/:cnpj', async (req, res) => {
  try {
    const { cnpj } = req.params;
    const { cnpj_basico, cnpj_ordem, cnpj_dv } = parseCNPJ(cnpj);

    const query = selectQuery;

    const result = await sql.query(query, [cnpj_basico, cnpj_ordem, cnpj_dv]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'CNPJ não encontrado para gerar PDF' });
    }

    const companyData = result[0];
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=empresa_${cnpj}.pdf`);
    doc.pipe(res);

    // Adiciona conteúdo do PDF
    doc.fontSize(20).text('Informações da Empresa', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Nome Fantasia: ${companyData.nome_fantasia || 'N/A'}`);
    // ... restante do conteúdo do PDF
    doc.moveDown();
    doc.fontSize(14).text(`Nome Fantasia: ${companyData.nome_fantasia || 'N/A'}`);
    doc.text(`Razão Social: ${companyData.razao_social || 'N/A'}`);
    doc.text(`CNPJ: ${cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}`);
    doc.text(`Situação: ${companyData.situacao || 'N/A'}`);
    doc.text(`Porte: ${companyData.porte_empresa || 'N/A'}`);
    doc.text(`Capital Social: R$ ${parseFloat(companyData.capital_social || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    doc.text(`Natureza Jurídica: ${companyData.natureza_juridica || 'N/A'}`);
    doc.moveDown();
    doc.fontSize(16).text('Contato', { underline: true });
    doc.fontSize(14).text(`Endereço: ${companyData.logradouro}, ${companyData.numero}${companyData.complemento ? `, ${companyData.complemento}` : ''}`);
    doc.text(`Bairro: ${companyData.bairro || 'N/A'}`);
    doc.text(`Município/UF: ${companyData.municipio}/${companyData.uf}`);
    doc.text(`CEP: ${companyData.cep ? companyData.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : 'N/A'}`);
    doc.text(`Telefone 1: ${companyData.telefone_1 || 'N/A'}`);
    doc.text(`Telefone 2: ${companyData.telefone_2 || 'N/A'}`);
    doc.text(`Fax: ${companyData.fax || 'N/A'}`);
    doc.text(`Email: ${companyData.email || 'N/A'}`);
    doc.moveDown();
    doc.fontSize(16).text('Sócios', { underline: true });
    (companyData.socios || []).forEach(socio => {
      doc.fontSize(14).text(`Nome: ${socio.nome_socio_razao_social || 'N/A'}`);
      doc.text(`CPF/CNPJ: ${socio.cnpj_cpf_socio || 'N/A'}`);
      doc.text(`Qualificação: ${socio.qualificacao_socio || 'N/A'}`);
      doc.text(`Data de Entrada: ${socio.data_entrada_sociedade || 'N/A'}`);
      doc.text(`Faixa Etária: ${socio.faixa_etaria || 'N/A'}`);
      doc.moveDown(0.5);
    });
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar o PDF:', error.message);
    res.status(500).json({ error: 'Erro ao gerar o PDF: ' + error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
