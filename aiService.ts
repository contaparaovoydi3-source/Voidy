
import { GoogleGenAI, Content } from '@google/genai';
import { Message } from './types';
import { SYSTEM_INSTRUCTION, MODEL_TEXT, AI_CONFIG, CONTEXT_LIMIT } from './constants';

/**
 * Gerenciador de Inteligência Artificial para o sistema VOIDY.
 * Otimizado para o modelo Gemini 3 Flash com alta capacidade de tokens.
 */
export class AIService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API_KEY não configurada para o serviço de IA.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Processa o histórico de mensagens para otimizar o consumo de tokens.
   * Suporta entrada multimodal (texto e imagem).
   */
  private prepareHistory(messages: Message[]): Content[] {
    // Mantém apenas as últimas N mensagens para otimização de performance e custo
    // Filtramos mensagens do sistema que não contribuem para o contexto direto da conversa
    const contextMessages = messages
      .filter(m => m.personaName !== 'SISTEMA')
      .slice(-CONTEXT_LIMIT);

    return contextMessages.map(m => {
      const parts: any[] = [];
      
      if (m.text && m.text.trim() !== '') {
        parts.push({ text: m.text });
      }

      // Se houver imagem (base64), adiciona como parte inlineData
      if (m.image && m.image.startsWith('data:image')) {
        const [header, data] = m.image.split(',');
        const mimeType = header.split(';')[0].split(':')[1];
        parts.push({
          inlineData: {
            data: data,
            mimeType: mimeType
          }
        });
      }

      return {
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: parts.length > 0 ? parts : [{ text: "..." }]
      };
    });
  }

  /**
   * Verifica se o conteúdo (texto ou imagem) viola as diretrizes de segurança (NSFW/Gore).
   */
  async checkSafety(content: string, type: 'text' | 'image'): Promise<{ isSafe: boolean; reason?: string }> {
    try {
      const prompt = type === 'image' 
        ? "Analise esta imagem. Ela contém conteúdo sexualmente explícito, pornografia, gore extremo, violência real pesada ou automutilação? Responda apenas 'TRUE' se for seguro e 'FALSE' se violar as regras."
        : `Analise o texto a seguir. Ele contém apologia à violência extrema, gore ou conteúdo sexual explícito? Texto: "${content}". Responda apenas 'TRUE' se for seguro e 'FALSE' se violar as regras.`;

      const parts: any[] = [{ text: prompt }];
      
      if (type === 'image' && content.startsWith('data:image')) {
        const [header, data] = content.split(',');
        const mimeType = header.split(';')[0].split(':')[1];
        parts.push({
          inlineData: {
            data: data,
            mimeType: mimeType
          }
        });
      }

      const result = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash', // Usando um modelo rápido e capaz para triagem
        contents: [{ role: 'user', parts: parts }],
        config: {
          temperature: 0.1,
          topP: 0.1,
        }
      });

      const response = result.text.trim().toUpperCase();
      return { isSafe: response.includes('TRUE') };
    } catch (error) {
      console.error("Safety Check Error:", error);
      return { isSafe: true }; // Falha no check não deve banir por engano
    }
  }

  /**
   * Gera uma resposta da IA baseada no histórico de chat.
   */
  async generateResponse(messages: Message[]): Promise<string> {
    try {
      const history = this.prepareHistory(messages);
      
      const result = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash', // Atualizado para o modelo multimodal mais recente e performático
        contents: history,
        config: {
          ...AI_CONFIG,
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      return result.text || "...";
    } catch (error: any) {
      console.error("AIService Error:", error);
      
      // Tratamento amigável para limites de API
      if (error.message?.includes("quota") || error.message?.includes("429")) {
        return "Sinal enfraquecendo... A rede está sobrecarregada. Tente sincronizar novamente em breve.";
      }
      
      throw error;
    }
  }

  /**
   * Exemplo de inicialização para ambientes Mobile ou Backend (Node.js):
   * 
   * // No servidor ou app:
   * const aiService = new AIService(process.env.GEMINI_API_KEY);
   * const response = await aiService.generateResponse(historicoDeMensagens);
   */
}
