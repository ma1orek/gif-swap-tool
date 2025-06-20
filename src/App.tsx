import { useState } from 'react';

export default function GifSwapTool() {
    const [gifFile, setGifFile] = useState<File | null>(null);
    const [faceImageFile, setFaceImageFile] = useState<File | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSwap = async () => {
        if (!gifFile || !faceImageFile) {
            setError('Proszę wgrać plik GIF oraz zdjęcie twarzy.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImageUrl(null);

        try {
            const formData = new FormData();
            formData.append('gif_file', gifFile);
            formData.append('face_image_file', faceImageFile);

            // Wysyłamy pliki do naszego własnego pośrednika /api/swap
            const response = await fetch('/api/swap', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Wystąpił nieznany błąd.');
            }

            setResultImageUrl(result.gif_url);

        } catch (e: any) {
            setError(e.message);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: '500px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
            <h1>Podmiana Twarzy w GIF-ie</h1>
            <p>Wgraj plik GIF i zdjęcie z twarzą do podmiany.</p>
            
            <div style={{ marginBottom: '1rem' }}>
                <label>1. Plik GIF</label><br/>
                <input type="file" accept="image/gif" onChange={(e) => setGifFile(e.target.files?.[0] || null)} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label>2. Zdjęcie z twarzą do podmiany</label><br/>
                <input type="file" accept="image/*" onChange={(e) => setFaceImageFile(e.target.files?.[0] || null)} />
            </div>

            <button onClick={handleSwap} disabled={isLoading || !gifFile || !faceImageFile} style={{ padding: '10px 20px', fontSize: '16px' }}>
                {isLoading ? 'Przetwarzanie...' : 'Podmień Twarz'}
            </button>

            {error && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>Błąd: {error}</p>}

            {resultImageUrl && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Wynik:</h2>
                    <img src={resultImageUrl} alt="Wynik podmiany twarzy" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                    <p><a href={resultImageUrl} download="result.gif">Pobierz GIF</a></p>
                </div>
            )}
        </div>
    );
}