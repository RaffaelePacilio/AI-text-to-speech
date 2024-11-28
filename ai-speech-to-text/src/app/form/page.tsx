'use client'

import { useState, useEffect, useRef } from 'react';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

const VoiceInputForm = () => {
  const [transcript, setTranscript] = useState(''); 
  const [isListening, setIsListening] = useState(false); 
  const [error, setError] = useState(null);
  const [response, setResponse] = useState<string | null>(null); // Stato per la risposta del server
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionTimeout = 5000;

  const speechSubject = useRef(new Subject<string>());
  const [recognition, setRecognition] = useState<any>(null); // Stato per riconoscimento vocale

  // Gestisci la risposta dal server
  const sendToServer = async () => {
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({text: transcript}),
      });

      const data = await response.json();
      console.log('Risposta del server:', data); // Stampa la risposta del server
      setResponse(data.reply); // Imposta la risposta ricevuta nel state
    } catch (error) {
      console.error('Errore nell\'invio del testo:', error);
    }
  };

  // Funzione che gestisce i risultati del riconoscimento vocale
  const handleRecognitionResult = (event: any) => {
    const currentTranscript = event.results[event.resultIndex][0].transcript;
    speechSubject.current.next(currentTranscript);
    resetTimeout();
  };

  // Funzione che avvia il riconoscimento vocale
  const startListening = () => {
    recognition?.start();
    setIsListening(true); 
    setError(null); 
    setTranscript(''); 
    resetTimeout(); 
  };

  // Funzione che ferma il riconoscimento vocale
  const stopListening = () => {
    recognition?.stop(); 
    setIsListening(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current); 
    }
  };

  // Funzione che avvia il timeout di 5 secondi
  const startTimeout = () => {
    timeoutRef.current = setTimeout(() => {
      console.log("Nessun parlato per 5 secondi, fermo il microfono");
      stopListening(); 
    }, recognitionTimeout);
  };

  // Funzione che resetta il timeout
  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current); 
    }
    startTimeout(); 
  };

  // Gestire la trascrizione con RxJS
  useEffect(() => {
    const subscription = speechSubject.current.pipe(
      debounceTime(2000), 
      distinctUntilChanged(),
      map((newTranscript: string) => newTranscript.trim()) 
    ).subscribe((newTranscript) => {
      setTranscript((prevTranscript) => {
        if (prevTranscript.endsWith(newTranscript)) {
          return prevTranscript;
        }
        return prevTranscript + ' ' + newTranscript;
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Crea il riconoscimento vocale solo nel client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.lang = 'it-IT'; 
        recognitionInstance.interimResults = true;
        recognitionInstance.continuous = true;
        recognitionInstance.maxAlternatives = 1;
        recognitionInstance.onresult = handleRecognitionResult;
        setRecognition(recognitionInstance);
      }
    }
  }, []);

  // Cleanup al momento dello smontaggio
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current); 
      }
      recognition?.abort(); 
    };
  }, [recognition]);

  return (
    <div>
      <h1>Input tramite voce</h1>
      <form>
        <label htmlFor="voiceInput">Inserisci testo tramite voce</label>
        <textarea
          className='text-area'
          id="voiceInput"
          value={transcript} 
          onChange={(e) => setTranscript(e.target.value)} 
          placeholder="Parla per scrivere..."
        />
      </form>
      <div>
        {isListening ? (
          <div>...registra...</div>
        ) : (
          <button onClick={startListening}>Inizia a parlare</button>
        )}
      </div>
      <div>
        <button onClick={sendToServer}>Invia al server</button>
      </div>
      {error && <p style={{ color: 'red' }}>Errore: {error}</p>}
      {response && <p>Risposta dal server: {response}</p>}
    </div>
  );
};

export default VoiceInputForm;
