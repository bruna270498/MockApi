// api/users.ts
import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface User {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { email } = req.query;

      // Buscar todos os usuários
      const userKeys = await kv.keys('user:*');
      const users: User[] = [];

      for (const key of userKeys) {
        const user = await kv.get<User>(key);
        if (user) {
          // Filtrar por email se fornecido
          if (!email || user.email === email) {
            users.push(user);
          }
        }
      }

      return res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}