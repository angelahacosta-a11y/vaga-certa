-- ============================================================
-- VAGA CERTA — schema do banco de dados (Supabase / Postgres)
-- ============================================================
-- Como usar: copie todo este arquivo e cole no SQL Editor do
-- seu projeto Supabase (menu lateral "SQL Editor" -> "New query"),
-- depois clique em "Run". Pode rodar tudo de uma vez.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- PROFISSIONAIS ----------
create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  area text not null check (area in ('beleza','idiomas','outras')),
  especialidade text not null,
  cidade text not null,
  experiencia text,
  disponibilidade text,
  whatsapp text not null,
  bio text,
  foto_url text,
  curriculo_url text,
  curriculo_nome text,
  created_at timestamptz not null default now()
);

-- ---------- ESCOLAS ----------
create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  area text not null check (area in ('beleza','idiomas','outras')),
  cidade text not null,
  responsavel text,
  sobre text,
  whatsapp text,
  email text,
  foto_url text,
  created_at timestamptz not null default now()
);

-- ---------- VAGAS ----------
create table if not exists vacancies (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  titulo text not null,
  area text not null check (area in ('beleza','idiomas','outras')),
  cidade text not null,
  tipo_contrato text,
  faixa_salarial text,
  descricao text,
  requisitos text,
  status text not null default 'aberta' check (status in ('aberta','fechada')),
  created_at timestamptz not null default now()
);

-- ---------- CANDIDATURAS ----------
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references vacancies(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  status text not null default 'em_analise' check (status in ('em_analise','aprovado','reprovado')),
  created_at timestamptz not null default now(),
  unique (vacancy_id, professional_id)
);

-- ---------- CÓDIGOS DE ACESSO ----------
-- (ficam protegidos: só as Netlify Functions conseguem ler/escrever aqui,
-- o navegador do visitante nunca acessa essa tabela diretamente)
create table if not exists access_codes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('admin','candidato','escola')),
  codigo text not null unique,
  created_at timestamptz not null default now()
);

insert into access_codes (tipo, codigo) values
  ('admin','vagas2026'),
  ('admin','admin-2026-02'),
  ('admin','admin-2026-03'),
  ('admin','admin-2026-04'),
  ('admin','admin-2026-05'),
  ('candidato','candidato-2026-01'),
  ('candidato','candidato-2026-02'),
  ('candidato','candidato-2026-03'),
  ('candidato','candidato-2026-04'),
  ('candidato','candidato-2026-05'),
  ('escola','escola-2026-01'),
  ('escola','escola-2026-02'),
  ('escola','escola-2026-03'),
  ('escola','escola-2026-04'),
  ('escola','escola-2026-05')
on conflict (codigo) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- professionals, schools, vacancies, applications: leitura pública
-- (são os dados que aparecem no site pra qualquer visitante) e
-- escrita pública também, pois a trava de acesso é feita pelo
-- código de convite checado na Netlify Function antes do cadastro.
-- access_codes: TOTALMENTE bloqueada para o navegador — só as
-- Netlify Functions (que usam a chave "service role", secreta)
-- conseguem consultar essa tabela.

alter table professionals enable row level security;
alter table schools enable row level security;
alter table vacancies enable row level security;
alter table applications enable row level security;
alter table access_codes enable row level security;

drop policy if exists "professionals_select" on professionals;
drop policy if exists "professionals_insert" on professionals;
drop policy if exists "professionals_update" on professionals;
drop policy if exists "professionals_delete" on professionals;
create policy "professionals_select" on professionals for select using (true);
create policy "professionals_insert" on professionals for insert with check (true);
create policy "professionals_update" on professionals for update using (true);
create policy "professionals_delete" on professionals for delete using (true);

drop policy if exists "schools_select" on schools;
drop policy if exists "schools_insert" on schools;
drop policy if exists "schools_update" on schools;
drop policy if exists "schools_delete" on schools;
create policy "schools_select" on schools for select using (true);
create policy "schools_insert" on schools for insert with check (true);
create policy "schools_update" on schools for update using (true);
create policy "schools_delete" on schools for delete using (true);

drop policy if exists "vacancies_select" on vacancies;
drop policy if exists "vacancies_insert" on vacancies;
drop policy if exists "vacancies_update" on vacancies;
drop policy if exists "vacancies_delete" on vacancies;
create policy "vacancies_select" on vacancies for select using (true);
create policy "vacancies_insert" on vacancies for insert with check (true);
create policy "vacancies_update" on vacancies for update using (true);
create policy "vacancies_delete" on vacancies for delete using (true);

drop policy if exists "applications_select" on applications;
drop policy if exists "applications_insert" on applications;
drop policy if exists "applications_update" on applications;
drop policy if exists "applications_delete" on applications;
create policy "applications_select" on applications for select using (true);
create policy "applications_insert" on applications for insert with check (true);
create policy "applications_update" on applications for update using (true);
create policy "applications_delete" on applications for delete using (true);

-- access_codes: nenhuma policy criada de propósito = bloqueado por padrão
-- para a chave pública (anon). Só a chave "service role" (usada dentro
-- das Netlify Functions, nunca no navegador) ignora RLS e consegue ler.

-- ============================================================
-- STORAGE (fotos e currículos)
-- ============================================================
-- Depois de rodar este SQL, vá em Storage no menu lateral e crie
-- dois buckets:
--   1) "avatars"     -> marque como Public bucket
--   2) "curriculos"  -> marque como Public bucket
-- (instruções completas no README.md)
