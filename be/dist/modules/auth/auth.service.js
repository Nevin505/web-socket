"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupUser = signupUser;
exports.signinUser = signinUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../../config/prisma"));
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }
    return secret;
}
async function signupUser(input) {
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email: input.email },
    });
    if (existingUser) {
        throw new Error("EMAIL_EXISTS");
    }
    const passwordHash = await bcryptjs_1.default.hash(input.password, 12);
    return prisma_1.default.user.create({
        data: {
            name: input.name,
            email: input.email,
            passwordHash,
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        },
    });
}
async function signinUser(input) {
    const user = await prisma_1.default.user.findUnique({
        where: { email: input.email },
    });
    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }
    const passwordMatches = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
        throw new Error("INVALID_CREDENTIALS");
    }
    const token = jsonwebtoken_1.default.sign({ sub: user.id }, getJwtSecret(), { expiresIn: "1h", algorithm: "HS256" });
    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    };
}
