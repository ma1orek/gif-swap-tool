import { type NextApiRequest, type NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';

const FAL_API_KEY = process.env.FAL_KEY;

export const config = {
    api: {
        bodyParser: false,
    },
};

// Funkcja pomocnicza do wysyłania plików i otrzymywania URL
async function uploadFile(file: formidable.File): Promise<{ url: string }> {
    const fileStream = fs.createReadStream(file.filepath);
    const response = await fetch('https://fal.dev/api/storage/upload', {
        method: 'POST',
        headers: { 
            'Authorization': `Key ${FAL_API_KEY}`,
            'Content-Type': file.mimetype || 'application/octet-stream',
        },
        body: Readable.toWeb(fileStream) as any,
        duplex: 'half',
    } as any); // OSTATECZNA POPRAWKA: Mówimy TypeScriptowi, żeby zignorował ten "błąd"
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Błąd wysyłania pliku: ${response.status}. ${errorText}`);
    }
    return response.json();
}

// Funkcja pomocnicza do śledzenia postępu
async function pollUntilDone(requestId: string): Promise<any> {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Czekamy 2 sekundy

        const statusUrl = `https://queue.fal.run/fal-ai/face-swap/requests/${requestId}`;
        const response = await fetch(statusUrl, {
            headers: { 'Authorization': `Key ${FAL_API_KEY}` }
        });

        if (!response.ok) throw new Error(`Błąd sprawdzania statusu: ${response.status}`);
        
        const result = await response.json();
        
        if (result.status === 'COMPLETED') {
             // Wg dokumentacji, po statusie COMPLETED, trzeba pobrać wynik z głównego URL
            const resultResponse = await fetch(`https://queue.fal.run/fal-ai/face-swap/requests/${requestId}`, {
                headers: { 'Authorization': `Key ${FAL_API_KEY}` }
            });
            return resultResponse.json();
        } 
        if (result.status === 'FAILED' || result.status === 'ERROR') {
            throw new Error('Przetwarzanie na serwerze nie powiodło się.');
        }
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const form = formidable({});
        const [, files] = await form.parse(req);

        const baseImageFile = files.base_image_file?.[0];
        const swapImageFile = files.swap_image_file?.[0];

        if (!baseImageFile || !swapImageFile) {
            return res.status(400).json({ error: 'Brak obu plików' });
        }

        const [baseImage, swapImage] = await Promise.all([
            uploadFile(baseImageFile),
            uploadFile(swapImageFile)
        ]);

        const submitResponse = await fetch('https://queue.fal.run/fal-ai/face-swap', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                base_image_url: baseImage.url,
                swap_image_url: swapImage.url
            })
        });

        if (!submitResponse.ok) throw new Error('Błąd wywołania modelu');
        
        const submitResult = await submitResponse.json();
        const finalResult = await pollUntilDone(submitResult.request_id);

        res.status(200).json({ image_url: finalResult.image.url });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Wystąpił błąd na serwerze' });
    }
}