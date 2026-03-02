import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword }
    });
    res.status(201).json({ message: "Usuário criado!", id: user.id });
  } catch (err) {
    res.status(400).json({ error: "Usuário já existe ou erro no banco." });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  console.log("Tentativa de login para:", username); // DEDO-DURO 1
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log("Usuário não encontrado no banco!"); // DEDO-DURO 2
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Senha confere?", isMatch); // DEDO-DURO 3

    if (!isMatch) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};