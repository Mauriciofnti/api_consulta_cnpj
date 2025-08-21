-- TABELAS PRONTAS

CREATE TABLE paises (
    codigo_paises CHAR(3) NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    PRIMARY KEY (codigo_paises)
);

CREATE TABLE municipios (
    codigo_municipios CHAR(7) NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    PRIMARY KEY (codigo_municipios)
);

CREATE TABLE qualificacoes_socios (
    codigo_qualificacoes_socios CHAR(2) NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    PRIMARY KEY (codigo_qualificacoes_socios)
);

CREATE TABLE naturezas_juridicas (
    codigo_naturezas_juridicas CHAR(4) NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    PRIMARY KEY (codigo_naturezas_juridicas)
);

CREATE TABLE cnaes (
    codigo_cnaes CHAR(7) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    PRIMARY KEY (codigo_cnaes)
);

CREATE TABLE motivos (
    codigo_motivos CHAR(7) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    PRIMARY KEY (codigo_motivos)
);

CREATE TABLE empresas (
    cnpj_basico CHAR(8) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    natureza_juridica CHAR(4),
    qualificacao_responsavel CHAR(2),
    capital_social NUMERIC(15,2),
    porte_empresa CHAR(2),
    ente_federativo_responsavel VARCHAR(100),
    PRIMARY KEY (cnpj_basico)
) PARTITION BY RANGE (cnpj_basico);

CREATE TABLE empresas_p0 PARTITION OF empresas FOR VALUES FROM ('00000000') TO ('20000000');
CREATE TABLE empresas_p1 PARTITION OF empresas FOR VALUES FROM ('20000000') TO ('40000000');
CREATE TABLE empresas_p2 PARTITION OF empresas FOR VALUES FROM ('40000000') TO ('60000000');
CREATE TABLE empresas_p3 PARTITION OF empresas FOR VALUES FROM ('60000000') TO ('80000000');
CREATE TABLE empresas_p4 PARTITION OF empresas FOR VALUES FROM ('80000000') TO ('99999999');

CREATE TABLE IF NOT EXISTS estabelecimentos (
    cnpj_basico CHAR(8) NOT NULL,
    cnpj_ordem CHAR(4) NOT NULL,
    cnpj_dv CHAR(2) NOT NULL,
    identificador_matriz_filial CHAR(1) NOT NULL,
    nome_fantasia VARCHAR(255),
    situacao_cadastral CHAR(2) NOT NULL,
    data_situacao_cadastral DATE,
    motivo_situacao_cadastral CHAR(2),
    nome_cidade_exterior VARCHAR(100),
    pais CHAR(3),
    data_inicio_atividade DATE,
    cnae_fiscal_principal CHAR(7),
    cnae_fiscal_secundaria TEXT,
    tipo_logradouro VARCHAR(50),
    logradouro VARCHAR(255),
    numero VARCHAR(10),
    complemento VARCHAR(200),
    bairro VARCHAR(100),
    cep CHAR(8),
    uf CHAR(2),
    municipio CHAR(7),
    ddd_1 CHAR(3),
    telefone_1 VARCHAR(9),
    ddd_2 CHAR(3),
    telefone_2 VARCHAR(9),
    ddd_fax CHAR(3),
    fax VARCHAR(9),
    correio_eletronico VARCHAR(255),
    situacao_especial VARCHAR(50),
    data_situacao_especial DATE,
    PRIMARY KEY (cnpj_basico, cnpj_ordem, cnpj_dv)
) PARTITION BY RANGE (cnpj_basico);

CREATE TABLE estabelecimentos_p0 PARTITION OF estabelecimentos FOR VALUES FROM ('00000000') TO ('10000000');
CREATE TABLE estabelecimentos_p1 PARTITION OF estabelecimentos FOR VALUES FROM ('10000000') TO ('20000000');
CREATE TABLE estabelecimentos_p2 PARTITION OF estabelecimentos FOR VALUES FROM ('20000000') TO ('30000000');
CREATE TABLE estabelecimentos_p3 PARTITION OF estabelecimentos FOR VALUES FROM ('30000000') TO ('40000000');
CREATE TABLE estabelecimentos_p4 PARTITION OF estabelecimentos FOR VALUES FROM ('40000000') TO ('50000000');
CREATE TABLE estabelecimentos_p5 PARTITION OF estabelecimentos FOR VALUES FROM ('50000000') TO ('60000000');
CREATE TABLE estabelecimentos_p6 PARTITION OF estabelecimentos FOR VALUES FROM ('60000000') TO ('70000000');
CREATE TABLE estabelecimentos_p7 PARTITION OF estabelecimentos FOR VALUES FROM ('70000000') TO ('80000000');
CREATE TABLE estabelecimentos_p8 PARTITION OF estabelecimentos FOR VALUES FROM ('80000000') TO ('90000000');
CREATE TABLE estabelecimentos_p9 PARTITION OF estabelecimentos FOR VALUES FROM ('90000000') TO ('99999999');

CREATE TABLE dados_simples (
    cnpj_basico CHAR(8) NOT NULL,
    opcao_pelo_simples CHAR(1),
    data_opcao_simples DATE,
    data_exclusao_simples DATE,
    opcao_pelo_mei CHAR(1),
    data_opcao_mei DATE,
    data_exclusao_mei DATE,
    PRIMARY KEY (cnpj_basico),
    CONSTRAINT fk_empresas FOREIGN KEY (cnpj_basico) REFERENCES empresas(cnpj_basico) DEFERRABLE INITIALLY DEFERRED
);

ALTER TABLE dados_simples
    ADD FOREIGN KEY (cnpj_basico) REFERENCES empresas(cnpj_basico) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE socios (
    cnpj_basico CHAR(8) NOT NULL,
    identificador_socio CHAR(1) NOT NULL,
    nome_socio_razao_social VARCHAR(255) NOT NULL,
    cnpj_cpf_socio VARCHAR(14) NOT NULL,
    qualificacao_socio CHAR(2),
    data_entrada_sociedade DATE,
    pais CHAR(3),
    cpf_representante_legal VARCHAR(11),
    nome_representante VARCHAR(255),
    qualificacao_representante_legal CHAR(2),
    faixa_etaria CHAR(1),
    PRIMARY KEY (cnpj_basico, cnpj_cpf_socio, nome_socio_razao_social)
) PARTITION BY RANGE (cnpj_basico);

CREATE TABLE socios_p0 PARTITION OF socios FOR VALUES FROM ('00000000') TO ('20000000');
CREATE TABLE socios_p1 PARTITION OF socios FOR VALUES FROM ('20000000') TO ('40000000');
CREATE TABLE socios_p2 PARTITION OF socios FOR VALUES FROM ('40000000') TO ('60000000');
CREATE TABLE socios_p3 PARTITION OF socios FOR VALUES FROM ('60000000') TO ('80000000');
CREATE TABLE socios_p4 PARTITION OF socios FOR VALUES FROM ('80000000') TO ('99999999');

-- Adiciona chaves estrangeiras
ALTER TABLE empresas
    ADD FOREIGN KEY (natureza_juridica) REFERENCES naturezas_juridicas(codigo_naturezas_juridicas) DEFERRABLE INITIALLY DEFERRED,
    ADD FOREIGN KEY (qualificacao_responsavel) REFERENCES qualificacoes_socios(codigo_qualificacoes_socios) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE estabelecimentos
    ADD FOREIGN KEY (cnpj_basico) REFERENCES empresas(cnpj_basico) DEFERRABLE INITIALLY DEFERRED,
    ADD FOREIGN KEY (motivo_situacao_cadastral) REFERENCES motivos(codigo_motivos) DEFERRABLE INITIALLY DEFERRED,
    ADD FOREIGN KEY (pais) REFERENCES paises(codigo_paises) DEFERRABLE INITIALLY DEFERRED,
    ADD FOREIGN KEY (municipio) REFERENCES municipios(codigo_municipios) DEFERRABLE INITIALLY DEFERRED,
    ADD FOREIGN KEY (cnae_fiscal_principal) REFERENCES cnaes(codigo_cnaes) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE socios
    ADD FOREIGN KEY (cnpj_basico) REFERENCES empresas(cnpj_basico) DEFERRABLE INITIALLY DEFERRED,
    ADD FOREIGN KEY (qualificacao_socio) REFERENCES qualificacoes_socios(codigo_qualificacoes_socios) DEFERRABLE INITIALLY DEFERRED,
    ADD FOREIGN KEY (qualificacao_representante_legal) REFERENCES qualificacoes_socios(codigo_qualificacoes_socios) DEFERRABLE INITIALLY DEFERRED,
    ADD FOREIGN KEY (pais) REFERENCES paises(codigo_paises) DEFERRABLE INITIALLY DEFERRED;

