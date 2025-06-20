import { type NextApiRequest, type NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';

const FAL_API_KEY = process.env.FAL_KEY;

// Funkcja pomocnicza do wysyłania plików i otrzymywania URL
async function uploadFile(file: formidable.File): Promise<string> {
    const fileStream = fs.createReadStream(file.filepath);
    const response = await fetch('https://fal.dev/api/storage/upload', {
        method: 'POST',
        headers: { 
            'Authorization': `Key ${FAL_API_KEY}`,
            'Content-Type': file.mimetype || 'application/octet-stream',
        },
        body: Readable.toWeb(fileStream) as any,
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Błąd wysyłania pliku: ${response.status}. ${errorText}`);
    }
    const result = await response.json();
    return result.url;
}


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
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const form = formidable({});
        const [, files] = await form.parse(req);
        
        const gifFile = files.gif_file?.[0];
        const faceImageFile = files.face_image_file?.[0];

        if (!gifFile || !faceImageFile) {
            return res.status(400).json({ error: 'Brak plików' });
        }
        
        // Krok 1: Wgranie obu plików na serwer, aby uzyskać publiczne adresy URL
        const [gif_image_url, face_image_url] = await Promise.all([
            uploadFile(gifFile),
            uploadFile(faceImageFile)
        ]);
        
        // Krok 2: Wywołanie modelu z URL-ami - używamy adresu z dokumentacji cURL
        const submitResponse = await fetch('https://queue.fal.run/easel-ai/easel-gifswap', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                face_image_url,
                gif_image_url
            })
        });

        if (!submitResponse.ok) {
            const errorText = await submitResponse.text();
            throw new Error(`Błąd wywołania modelu: ${submitResponse.status}. ${errorText}`);
        }

        const submitResult = await submitResponse.json();
        const requestId = submitResult.request_id;

        // Krok 3: Sprawdzanie statusu zadania w pętli
        let result = null;
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Czekamy 2 sekundy

            const statusResponse = await fetch(`https://queue.fal.run/easel-ai/easel-gifswap/requests/${requestId}`, {
                headers: { 'Authorization': `Key ${FAL_API_KEY}` }
            });

            if (!statusResponse.ok) throw new Error('Błąd sprawdzania statusu');

            const statusResult = await statusResponse.json();

            if (statusResult.status === 'COMPLETED') {
                result = statusResult.result;
                break;
            } else if (statusResult.status === 'FAILED' || statusResult.status === 'ERROR') {
                throw new Error('Przetwarzanie na serwerze nie powiodło się.');
            }
        }
        
        // Krok 4: Odesłanie wyniku do przeglądarki
        res.status(200).json({ gif_url: (result as any).image.url });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Wystąpił błąd na serwerze' });
    }
}