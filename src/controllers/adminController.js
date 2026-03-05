import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/*
LISTAR USUÁRIOS
*/
export const listUsers = async (req,res)=>{

    try{

        const users = await prisma.user.findMany({
            select:{
                id:true,
                username:true,
                role:true,
                canWrite:true,
                createdAt:true
            }
        });

        res.json(users);

    }
    catch(error){

        res.status(500).json({error:"Erro ao listar usuários"});

    }

};


/*
CRIAR USUÁRIO
*/
export const createUser = async (req,res)=>{

    try{

        const {username,password,role,canWrite} = req.body;

        const hash = await bcrypt.hash(password,10);

        const user = await prisma.user.create({
            data:{
                username,
                password:hash,
                role: role || "USER",
                canWrite: canWrite ?? true
            }
        });

        res.status(201).json(user);

    }
    catch(error){

        res.status(500).json({error:"Erro ao criar usuário"});

    }

};


/*
ALTERAR PERMISSÕES
*/
export const updatePermissions = async (req,res)=>{

    const id = Number(req.params.id);

    try{

        const {canWrite,role} = req.body;

        const user = await prisma.user.update({
            where:{id},
            data:{
                canWrite,
                role
            }
        });

        res.json(user);

    }
    catch(error){

        res.status(500).json({error:"Erro ao atualizar usuário"});

    }

};


/*
DELETAR USUÁRIO
*/
export const deleteUser = async (req,res)=>{

    const id = Number(req.params.id);

    try{

        await prisma.user.delete({
            where:{id}
        });

        res.json({message:"Usuário removido"});

    }
    catch(error){

        res.status(500).json({error:"Erro ao deletar usuário"});

    }

};