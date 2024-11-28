'use client'
import { redirect } from 'next/navigation'

export default function Home() {

  return (
    <div>
      <h1>Benvenuto nell'applicazione di riconoscimento vocale!</h1>
      <button onClick={() => redirect('/form')}> entra nell'app !</button>
    </div>
  );
}