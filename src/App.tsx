import { useState } from 'react';

export default function ImageSwapTool() {
    const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
    const [swapImageFile, setSwapImageFile] = useState<File | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSwap = async () => {
        if (!baseImageFile || !swapImageFile) {
            setError('Proszę wgrać oba zdjęcia.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImageUrl(null);

        try {
            const formData = new FormData();
            formData.append('base_image_file', baseImageFile);
            formData.append('swap_image_file', swapImageFile);

            const response = await fetch('/api/swap', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Wystąpił nieznany błąd.');
            }

            setResultImageUrl(result.image_url);

        } catch (e: any) {
            setError(e.message);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: '500px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
            <h1>Podmiana Twarzy na Zdjęciu (Wersja Ostateczna)</h1>
            <p>Wgraj zdjęcie bazowe i zdjęcie z twarzą do podmiany.</p>
            
            <div style={{ marginBottom: '1rem' }}>
                <label>1. Zdjęcie bazowe (na którym ma być nowa twarz)</label><br/>
                <input type="file" accept="image/*" onChange={(e) => setBaseImageFile(e.target.files?.[0] || null)} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label>2. Zdjęcie z twarzą do podmiany</label><br/>
                <input type="file" accept="image/*" onChange={(e) => setSwapImageFile(e.target.files?.[0] || null)} />
            </div>

            <button onClick={handleSwap} disabled={isLoading || !baseImageFile || !swapImageFile} style={{ padding: '10px 20px', fontSize: '16px' }}>
                {isLoading ? 'Przetwarzanie...' : 'Podmień Twarz'}
            </button>

            {error && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>Błąd: {error}</p>}

            {resultImageUrl && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Wynik:</h2>
                    <img src={resultImageUrl} alt="Wynik podmiany twarzy" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                    <p><a href={resultImageUrl} download="result.jpg">Pobierz Zdjęcie</a></p>
                </div>
            )}
        </div>
    );
}