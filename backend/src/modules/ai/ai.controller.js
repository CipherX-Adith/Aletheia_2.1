import Groq from 'groq-sdk';
import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { success, created } from '../../common/responses/index.js';
import { env } from '../../config/env.js';

const SYSTEM_PROMPT = `You are Aletheia AI Copilot — an expert trade finance advisor embedded in the Aletheia platform.
Your role is to help exporters, investors, and finance managers with:
- Analyzing trade receivables and their risk profiles
- Explaining trade finance concepts (factoring, forfaiting, supply chain finance)
- Evaluating buyer creditworthiness signals
- Calculating yields, returns, and discount rates
- Understanding Stellar blockchain settlements and USDC payments
- Navigating the Aletheia platform
Always be concise, professional, and data-driven. Never give legal or tax advice.`;

function getGroqClient() {
  if (!env.GROQ_API_KEY) return null;
  return new Groq({ apiKey: env.GROQ_API_KEY });
}

export async function listConversations(req, res, next) {
  try {
    const convs = await prisma.aIConversation.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
    return success(res, convs);
  } catch (e) { next(e); }
}

export async function createConversation(req, res, next) {
  try {
    const conv = await prisma.aIConversation.create({
      data: { userId: req.user.id, title: req.body.title || 'New Conversation' },
    });
    return created(res, conv, 'Conversation created');
  } catch (e) { next(e); }
}

export async function getConversation(req, res, next) {
  try {
    const conv = await prisma.aIConversation.findUnique({
      where: { id: req.params.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw AppError.notFound('Conversation not found');
    return success(res, conv);
  } catch (e) { next(e); }
}

export async function sendMessage(req, res, next) {
  try {
    const { message } = req.body;
    const convId = req.params.id;

    // Save user message
    await prisma.aIMessage.create({
      data: { conversationId: convId, role: 'user', content: message },
    });

    // Get conversation history
    const history = await prisma.aIMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const groq = getGroqClient();
    let assistantContent = '';

    if (groq) {
      const completion = await groq.chat.completions.create({
        model: env.GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });
      assistantContent = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } else {
      assistantContent = 'AI Copilot is not configured. Please add your GROQ_API_KEY to enable AI features.';
    }

    // Save assistant response
    const response = await prisma.aIMessage.create({
      data: { conversationId: convId, role: 'assistant', content: assistantContent },
    });

    // Update conversation title if first message
    if (history.length <= 2) {
      await prisma.aIConversation.update({
        where: { id: convId },
        data: { title: message.slice(0, 50), updatedAt: new Date() },
      });
    }

    return success(res, { message: assistantContent, id: response.id });
  } catch (e) { next(e); }
}

export async function analyzeReceivable(req, res, next) {
  try {
    const receivable = await prisma.receivable.findUnique({
      where: { id: req.params.receivableId },
      include: { exporter: true, riskScore: true, documents: true },
    });

    if (!receivable) throw AppError.notFound('Receivable not found');

    const prompt = `Analyze this trade receivable and provide a risk assessment:
Invoice: ${receivable.invoiceNumber}
Amount: ${receivable.totalAmount} ${receivable.currency}
Due Date: ${receivable.dueDate}
Commodity: ${receivable.commodity}
Origin: ${receivable.originCountry} → ${receivable.destinationCountry}
Buyer: ${receivable.buyerName} (${receivable.buyerCountry})
Exporter: ${receivable.exporter.name} (${receivable.exporter.country})
Documents: ${receivable.documents.length} documents uploaded
Existing Risk Score: ${receivable.riskScore?.score || 'Not scored'} (${receivable.riskScore?.rating || 'N/A'})

Provide: 1) Risk rating (AAA to C), 2) Key risk factors, 3) Investment recommendation, 4) Suggested discount rate.`;

    const groq = getGroqClient();
    let analysis = 'AI analysis not available. Please configure GROQ_API_KEY.';

    if (groq) {
      const completion = await groq.chat.completions.create({
        model: env.GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1500,
      });
      analysis = completion.choices[0]?.message?.content || analysis;
    }

    // Save/update risk score
    await prisma.riskScore.upsert({
      where: { receivableId: receivable.id },
      create: {
        receivableId: receivable.id,
        score: 70, // default, AI would parse the actual score
        rating: 'BBB',
        aiAnalysis: analysis,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: { aiAnalysis: analysis, updatedAt: new Date() },
    });

    return success(res, { analysis, receivableId: receivable.id });
  } catch (e) { next(e); }
}
