import { fal } from '@fal-ai/client';
import { type NextApiRequest, type NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

// UWAGA: Nowa dokumentacja nie pokazuje globalnego fal.config() dla klienta
// Klucz jest pobierany automatycznie ze zmiennej środowiskowej process.env.FAL_KEY

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
        const form = formidable({});
        const [, files] = await form.parse(req);
        
        const gifFile = files.gif_file?.[0];
        const faceImageFile = files.face_image_file?.[0];

        if (!gifFile || !faceImageFile) {
            return res.status(400).json({ error: 'Brak plików' });
        }
        
        // Odczytujemy pliki do bufora
        const gifFileBuffer = fs.readFileSync(gifFile.filepath);
        const faceImageBuffer = fs.readFileSync(faceImageFile.filepath);
        
        // Wywołanie modelu easel-ai/easel-gifswap z auto-upload
        // Przekazujemy bufory plików bezpośrednio w `input`
        const result: any = await fal.subscribe('easel-ai/easel-gifswap', {
            input: {
                face_image: faceImageBuffer,
                gif_image: gifFileBuffer,
            },
        });

        // Wg dokumentacji, wynik jest w polu "image"
        res.status(200).json({ gif_url: result.image.url });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Wystąpił błąd na serwerze' });
    }
}