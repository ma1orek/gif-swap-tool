// src/App.tsx
import { useState } from "react";
import fal from "./falClient";

function App() {
  const [gifFile, setGifFile] = useState<File|null>(null);
  const [faceFile, setFaceFile] = useState<File|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [resultUrl, setResultUrl] = useState<string|null>(null);

  const handleSubmit = async () => {
    if (!gifFile || !faceFile) {
      setError("Wybierz oba pliki!");
      return;
    }
    setError(null);
    setResultUrl(null);

    try {
      // fal.subscribe automatycznie wrzuci pliki i czeka na wynik
      const { data } = await fal.subscribe("easel-ai/easel-gifswap", {
        input: {
          gif_image: gifFile,
          face_image: faceFile,
        },
        logs: true,
      });
      setResultUrl(data.image.url);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Nieznany błąd");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h1>Podmień Twarz w GIF-ie</h1>
      <label>1. Plik GIF</label><br/>
      <input type="file" accept=".gif" onChange={e => setGifFile(e.target.files?.[0]||null)} /><br/><br/>

      <label>2. Zdjęcie z twarzą</label><br/>
      <input type="file" accept="image/*" onChange={e => setFaceFile(e.target.files?.[0]||null)} /><br/><br/>

      <button onClick={handleSubmit}>Podmień Twarz</button>

      {error && <p style={{ color: "red" }}>Błąd: {error}</p>}

      {resultUrl && (
        <div>
          <h2>Wynik:</h2>
          <img src={resultUrl} alt="wynik" style={{ maxWidth: "100%" }} />
        </div>
      )}
    </div>
  );
}

export default App;
