import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inizializzazione dell'API di OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Usa la chiave API di OpenAI dal file .env
});

console.log(process.env.OPENAI_API_KEY)
async function fetchGPTResponse(prompt: string): Promise<string> {
  try {
    // Invia la richiesta al modello GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',  // Usa il modello GPT-4
      messages: [
        { role: 'user', content: prompt }, // Usa il prompt dinamico dell'utente
      ],
    });

    // Estrai la risposta dal modello e restituiscila
    const reply = completion.choices[0]?.message?.content?.trim() || 'Nessuna risposta ricevuta';
    return reply;
  } catch (error) {
    console.error('Errore nell\'accesso a OpenAI:', error);
    throw new Error('Errore durante la generazione della risposta da OpenAI');
  }
}

// Named export per POST
export async function POST(req: Request) {
  try {
    // Parsing del corpo della richiesta per ottenere il testo inviato dall'utente
    const { text } = await req.json();

    // Controlla se il testo è presente
    if (!text) {
      return NextResponse.json(
        { error: 'Testo mancante nel corpo della richiesta' },
        { status: 400 }
      );
    }

    // Richiama la funzione per ottenere la risposta da OpenAI
    const gptResponse = await fetchGPTResponse(text);

    // Restituisci la risposta ottenuta da OpenAI come JSON
    return NextResponse.json({ reply: gptResponse });
  } catch (error) {
    // Gestisci gli errori
    console.error('Errore nel POST:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Named export per GET (opzionale)
export async function GET() {
  return NextResponse.json({ message: 'API GPT funzionante' });
}
