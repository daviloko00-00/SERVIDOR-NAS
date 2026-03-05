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

  console.log("Tentativa de login para:", username);

  try {

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.log("Usuário não encontrado no banco!");
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Senha confere?", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // TOKEN COMPLETO
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        canWrite: user.canWrite
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Erro interno no servidor" });

  }

};
export const me = async (req, res) => {
  try {

    res.json({
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      canWrite: req.user.canWrite
    });

  } catch (error) {

    res.status(500).json({ error: "Erro ao obter usuário" });

  }
};