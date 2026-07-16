import { useState } from 'react';
import apiClient from '@/lib/api';

export function useCart() {
    const [adding, setAdding] = useState<string | null>(null);

    const addToCart = async (productId: string, quantity: number = 1) => {
        setAdding(productId);
        try {
            // 1. Get or create active Formato Único
            let formato;
            try {
                const res = await apiClient.get('/formatos/me');
                formato = res.data;
            } catch (err: any) {
                if (err.response?.status === 404) {
                    await apiClient.post('/formatos/session');
                    const res = await apiClient.get('/formatos/me');
                    formato = res.data;
                } else {
                    throw err;
                }
            }

            // 2. Call the post endpoint to add/upsert the item
            const formatoId = formato.id;
            const res = await apiClient.post(`/formatos/${formatoId}/items/${productId}`, {
                cantidad: quantity
            });
            return res.data;
        } finally {
            setAdding(null);
        }
    };

    return { addToCart, adding };
}
