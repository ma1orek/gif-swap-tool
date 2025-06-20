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
    } as any);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Błąd wysyłania pliku: ${response.status}. ${errorText}`);
    }
    return response.json();
}

async function pollUntilDone(requestId: string): Promise<any> {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const response = await fetch(`https://queue.fal.run/fal-ai/face-swap/requests/${requestId}`, {
            headers: { 'Authorization': `Key ${FAL_API_KEY}` }
        });
        if (!response.ok) throw new Error(`Błąd sprawdzania statusu: ${response.status}`);
        const result = await response.json();
        if (result.status === 'COMPLETED') return result.result;
        if (result.status === 'FAILED' || result.status === 'ERROR') throw new Error('Przetwarzanie na serwerze nie powiodło się.');
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const form = formidable({});
        const [fields, files] = await form.parse(req);
        
        // POPRAWKA LOGIKI: Sprawdzamy, jakie klucze faktycznie przychodzą
        const baseImageFile = files.base_image_file?.[0];
        const swapImageFile = files.swap_image_file?.[0];
        
        if (!baseImageFile || !swapImageFile) {
            console.error("Nie znaleziono plików. Otrzymane klucze:", Object.keys(files));