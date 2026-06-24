// Vercel Function — recebe a anamnese/dados do paciente e pede ao Claude
// uma SUGESTÃO de conduta ventilatória estruturada para o plantonista.
//
// Variáveis de ambiente necessárias (configurar na Vercel, NUNCA no código):
//   ANTHROPIC_API_KEY  — chave da API da Anthropic (console.anthropic.com)
//   VMGUIDE_SENHA      — senha de acesso enviada pelo front

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Você é um assistente de apoio à decisão clínica em ventilação mecânica, dirigido a um(a) médico(a) plantonista de UTI/emergência. Você NÃO substitui o julgamento clínico — você organiza o raciocínio e oferece sugestões para o profissional considerar.

Base de conhecimento: UpToDate 2026, FCCS, ARDSnet/Berlin, PROSEVA, diretrizes de VM protetora. Use PBW (peso predito pela altura) para volume corrente, nunca peso real.

REGRAS ABSOLUTAS:
- Sempre trate suas saídas como SUGESTÕES a serem validadas pelo plantonista, nunca como prescrição.
- Se faltarem dados essenciais (altura/sexo para PBW, gasometria, mecânica), diga explicitamente o que falta e como isso muda a conduta.
- Nunca invente valores. Se um número não foi fornecido, não o estime como se fosse real.
- Doses e parâmetros devem vir com a faixa e a fonte/lógica.
- Seja conciso e acionável — é um plantão.

FORMATO DA RESPOSTA (markdown, exatamente estas seções):

## Resumo do caso
(1-2 frases sintetizando o paciente e o problema ventilatório central)

## Raciocínio
(passo a passo: o que os dados indicam, qual o problema fisiopatológico, o que priorizar)

## Sugestão de conduta
(parâmetros concretos sugeridos, em bullets — modo, VC em mL/kg PBW e mL absolutos se a altura/sexo permitirem o cálculo, PEEP, FiO₂, FR, metas. Cada item com a lógica/fonte entre parênteses)

## Reavaliar / cuidados
(o que medir/checar em seguida, sinais de alarme, e o que NÃO fazer)

## Dados faltantes
(lista do que seria necessário para refinar a conduta; "nenhum" se completo)`;

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

  const anamnese = req.body && typeof req.body.anamnese === 'string' ? req.body.anamnese.trim() : '';
  if (!anamnese) {
    res.status(400).json({ error: 'Cole os dados do paciente antes de enviar.' });
    return;
  }
  if (anamnese.length > 12000) {
    res.status(400).json({ error: 'Texto muito longo (máx. ~12000 caracteres).' });
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
      messages: [
        {
          role: 'user',
          content:
            'Dados do paciente (cole feito pelo plantonista; pode conter abreviações e ruído):\n\n' +
            anamnese,
        },
      ],
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
