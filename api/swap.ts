// Ten kod będzie działał na serwerze, a nie w przeglądarce
import * as fal from '@fal-ai/serverless-client';
import { type NextApiRequest, type NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

// Ustawiamy klucz API ze zmiennych środowiskowych serwera
fal.config({
    credentials: process.env.FAL_KEY,
});

// Musimy wyłączyć domyślne parsowanie body przez Next.js, bo oczekujemy plików
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        // Parsowanie plików z requestu za pomocą formidable
        const form = formidable({});
        // POPRAWKA: Ignorujemy nieużywaną zmienną 'fields'
        const [, files] = await form.parse(req);
        
        const gifFile = files.gif_file?.[0];
        const faceImageFile = files.face_image_file?.[0];

        if (!gifFile || !faceImageFile) {
            return res.status(400).json({ error: 'Brak plików' });
        }
        
        // Krok 1: Wgranie plików na serwer Fal.ai (teraz z serwera, nie z przeglądarki)
        // POPRAWKA: Konwertujemy odczytany plik (Buffer) na Blob, którego oczekuje funkcja
        const gifUrl = await fal.storage.upload(new Blob([fs.readFileSync(gifFile.filepath)]));
        const faceUrl = await fal.storage.upload(new Blob([fs.readFileSync(faceImageFile.filepath)]));

        // Krok 2: Wywołanie modelu easel-gifswap
        const result: { gif: { url: string } } = await fal.subscribe('easel-ai/easel-gifswap', {
            input: {
                face_image_url: faceUrl,
                gif_image_url: gifUrl,
            },
        });

        // Krok 3: Odesłanie wyniku do przeglądarki
        res.status(200).json({ gif_url: result.gif.url });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Wystąpił błąd na serwerze' });
    }
}