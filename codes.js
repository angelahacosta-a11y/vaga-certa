// netlify/functions/codes.js
// Gerencia os códigos de acesso (admin, candidato, escola) com segurança:
// usa a chave SUPABASE_SERVICE_ROLE_KEY (secreta, nunca aparece no navegador)
// pra falar com a tabela access_codes, que é bloqueada para o navegador comum.
//
// Configure estas variáveis em: Netlify -> Site settings -> Environment variables:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY  (em Supabase: Project Settings -> API -> service_role)

const { createClient } = require('@supabase/supabase-js');

function getClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function isValidAdminCode(sb, codigo) {
  if (!codigo) return false;
  const { data } = await sb.from('access_codes').select('id').eq('tipo', 'admin').ilike('codigo', codigo.trim()).maybeSingle();
  return !!data;
}

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas no servidor.' }) };
  }
  const sb = getClient();

  try {
    // ---- VALIDAR UM CÓDIGO (usado nas telas de cadastro) ----
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const tipo = params.tipo;
      const codigo = (params.codigo || '').trim();
      if (!tipo || !codigo) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Informe tipo e codigo.' }) };
      }
      // admin sempre serve como chave-mestra para qualquer gate
      const admin = await isValidAdminCode(sb, codigo);
      if (admin) return { statusCode: 200, headers, body: JSON.stringify({ valid: true, via: 'admin' }) };

      if (tipo === 'admin') {
        return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
      }
      const { data } = await sb.from('access_codes').select('id').eq('tipo', tipo).ilike('codigo', codigo).maybeSingle();
      if (data) return { statusCode: 200, headers, body: JSON.stringify({ valid: true }) };

      // código existe só em outra lista? avisa qual
      const { data: other } = await sb.from('access_codes').select('tipo').ilike('codigo', codigo).maybeSingle();
      return { statusCode: 200, headers, body: JSON.stringify({ valid: false, foundIn: other ? other.tipo : null }) };
    }

    // ---- LISTAR / ADICIONAR / REMOVER (painel administrativo) ----
    const body = event.body ? JSON.parse(event.body) : {};
    const adminOk = await isValidAdminCode(sb, body.adminCode || (event.queryStringParameters || {}).adminCode);
    if (!adminOk) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Código de administrador inválido.' }) };
    }

    if (event.httpMethod === 'POST' && body.action === 'list') {
      const { data, error } = await sb.from('access_codes').select('tipo,codigo,created_at').order('created_at', { ascending: true });
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ codes: data }) };
    }

    if (event.httpMethod === 'POST' && body.action === 'add') {
      if (!body.tipo || !body.codigo) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Informe tipo e codigo.' }) };
      const { error } = await sb.from('access_codes').insert({ tipo: body.tipo, codigo: body.codigo.trim() });
      if (error) return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === 'DELETE' || (event.httpMethod === 'POST' && body.action === 'remove')) {
      if (!body.codigo) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Informe o codigo a remover.' }) };
      const { error } = await sb.from('access_codes').delete().eq('codigo', body.codigo);
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ação não reconhecida.' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
