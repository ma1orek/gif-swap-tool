import { useState } from 'react';
import { createFalClient } from '@fal-ai/client';

// Tworzymy klienta, który wie, że ma używać naszego pośrednika
const fal = createFalClient({
    proxyUrl: '/api/fal/proxy',
});

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
            // Wywołujemy model, którego chciałeś, bezpośrednio z frontendu
            // Biblioteka sama wyśle pliki przez naszego pośrednika
            const result: any = await fal.subscribe('easel-ai/easel-gifswap', {
                input: {
                    face_image: faceImageFile,
                    gif_image: gifFile,
                },
            });

            // Wynik jest w polu "image"
            setResultImageUrl(result.image.url);

        } catch (e: any) {
            setError(e.message || 'Wystąpił nieznany błąd.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: '500px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
            <h1>Podmiana Twarzy w GIF-ie (Wersja Oficjalna)</h1>
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