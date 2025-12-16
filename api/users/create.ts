// api/users/create.ts
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

  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;

      // ✅ Validação 1: Campos obrigatórios
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email e senha são obrigatórios' 
        });
      }

      // ✅ Validação 2: Formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Email inválido' 
        });
      }

      // ✅ Validação 3: Senha mínima
      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Senha deve ter no mínimo 6 caracteres' 
        });
      }

      // ✅ Validação 4: Email duplicado
      const userKeys = await kv.keys('user:*');
      for (const key of userKeys) {
        const existingUser = await kv.get<User>(key);
        if (existingUser && existingUser.email === email) {
          return res.status(400).json({ 
            error: 'Usuário já cadastrado.' 
          });
        }
      }

      // Criar usuário
      const id = crypto.randomUUID();
      const user: User = {
        id,
        email,
        password,
        createdAt: new Date().toISOString()
      };

      // Salvar no Vercel KV (Redis)
      await kv.set(`user:${id}`, user);

      return res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}