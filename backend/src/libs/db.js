import { PrismaClient } from "../generated/prisma/index.js";

const globalForPrisma = globalThis;

const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
}

// Attempt a simple query to trigger connection and log result
async function connectToPrisma() {
    try {
        await db.$connect();
        console.log("Connected to Prisma DB");
    } catch (error) {
        console.error("Failed to connect to Prisma DB", error);
    }
}

connectToPrisma();

export {db};
