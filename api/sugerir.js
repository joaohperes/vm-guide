// Vercel Function — recebe a anamnese/dados do paciente e pede ao Claude
// uma SUGESTÃO de conduta ventilatória estruturada para o plantonista.
//
// Variáveis de ambiente necessárias (configurar na Vercel, NUNCA no código):
//   ANTHROPIC_API_KEY  — chave da API da Anthropic (console.anthropic.com)
//   VMGUIDE_SENHA      — senha de acesso enviada pelo front

import Anthropic from '@anthropic-ai/sdk';
import { KNOWLEDGE_BASE } from './knowledge.js';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Você é um assistente de apoio à decisão clínica em ventilação mecânica, dirigido a um(a) médico(a) plantonista de UTI/emergência. Você NÃO substitui o julgamento clínico — você organiza o raciocínio e oferece sugestões para o profissional considerar.

Esta é uma DISCUSSÃO CONTÍNUA sobre um mesmo paciente. As mensagens anteriores são o histórico do caso: leve em conta tudo que já foi informado (parâmetros, quadro clínico, condutas discutidas) ao responder cada nova mensagem. Não repita o que já foi dito; construa sobre o histórico.

BASE DE CONHECIMENTO (conteúdo curado do vm.guide — use como referência primária):
${KNOWLEDGE_BASE}

REGRAS ABSOLUTAS:
- Suas respostas devem se basear prioritariamente no conteúdo da base de conhecimento acima.
- Sempre trate suas saídas como SUGESTÕES a serem validadas pelo plantonista, nunca como prescrição.
- Se faltarem dados essenciais (altura/sexo para PBW, gasometria, mecânica), diga explicitamente o que falta e como isso muda a conduta.
- Nunca invente valores. Se um número não foi fornecido, não o estime como se fosse real.
- Doses e parâmetros devem vir com a faixa e a fonte/lógica da base de conhecimento.
- Seja conciso e acionável — é um plantão.

FORMATO:
- Na PRIMEIRA avaliação do caso (quando o plantonista apresenta o paciente), responda com as seções em markdown:
  ## Resumo do caso
  (1-2 frases sintetizando o paciente e o problema ventilatório central)
  ## Raciocínio
  (passo a passo: o que os dados indicam, qual o problema fisiopatológico, o que priorizar)
  ## Sugestão de conduta
  (parâmetros concretos em bullets — modo, VC em mL/kg PBW e mL absolutos se altura/sexo permitirem, PEEP, FiO₂, FR, metas. Cada item com a lógica/fonte entre parênteses)
  ## Reavaliar / cuidados
  (o que medir/checar em seguida, sinais de alarme, e o que NÃO fazer)
  ## Dados faltantes
  (o que falta para refinar; "nenhum" se completo)
- Em PERGUNTAS DE ACOMPANHAMENTO (turnos seguintes), responda de forma direta e focada na pergunta, sem repetir todas as seções. Use markdown com bullets/negrito quando ajudar. Se a nova informação muda a conduta, diga claramente o que muda.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  // Gate de senha
  const senha = req.headers['x-vmguide-senha'] || (req.body && req.body.senha);
  if (!process.env.VMGUIDE_SENHA || senha !== process.env.VMGUIDE_SENHA) {
    res.status(401).json({ error: 'Senha incorreta ou ausente.' });
    return;
  }

  // Aceita a conversa completa do caso (turnos user/assistant alternados).
  // Compatível com o formato antigo (apenas {anamnese}) como 1º turno.
  let messages = req.body && Array.isArray(req.body.messages) ? req.body.messages : null;
  if (!messages && req.body && typeof req.body.anamnese === 'string') {
    messages = [{ role: 'user', content: req.body.anamnese }];
  }

  // Validação e sanitização das mensagens
  if (!messages || messages.length === 0) {
    res.status(400).json({ error: 'Cole os dados do paciente antes de enviar.' });
    return;
  }
  if (messages.length > 60) {
    res.status(400).json({ error: 'Conversa muito longa. Inicie um novo caso.' });
    return;
  }
  let total = 0;
  const clean = [];
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      res.status(400).json({ error: 'Formato de conversa inválido.' });
      return;
    }
    const content = m.content.trim();
    if (!content) continue;
    total += content.length;
    clean.push({ role: m.role, content });
  }
  if (clean.length === 0 || clean[clean.length - 1].role !== 'user') {
    res.status(400).json({ error: 'Envie uma mensagem do plantonista.' });
    return;
  }
  if (total > 40000) {
    res.status(400).json({ error: 'Conversa muito longa (limite de tamanho). Inicie um novo caso.' });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'API key não configurada no servidor.' });
    return;
  }

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 4, // tolera 429/5xx/529 (sobrecarga) com backoff exponencial
    });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: clean,
    });

    const texto = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    res.status(200).json({ sugestao: texto });
  } catch (err) {
    console.error('Erro na API Anthropic:', err && err.message);
    // 529 = overloaded, 429 = rate limit → sobrecarga temporária, vale insistir
    if (err && (err.status === 529 || err.status === 429)) {
      res.status(503).json({ error: 'Serviço de IA sobrecarregado no momento. Aguarde alguns segundos e tente novamente.' });
      return;
    }
    const status = err && err.status >= 400 && err.status < 500 ? 502 : 500;
    res.status(status).json({ error: 'Falha ao consultar o assistente. Tente novamente.' });
  }
}
