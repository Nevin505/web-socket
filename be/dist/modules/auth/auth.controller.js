"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signin = exports.signup = void 0;
const auth_schema_1 = require("./auth.schema");
const auth_service_1 = require("./auth.service");
const signup = async (req, res) => {
    const parsed = auth_schema_1.signupSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
        return;
    }
    try {
        const user = await (0, auth_service_1.signupUser)(parsed.data);
        res.status(201).json({
            message: "Signup successful",
            user,
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === "EMAIL_EXISTS") {
            res.status(409).json({ message: "Email already registered" });
            return;
        }
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.signup = signup;
const signin = async (req, res) => {
    const parsed = auth_schema_1.signinSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
        return;
    }
    try {
        const result = await (0, auth_service_1.signinUser)(parsed.data);
        res.status(200).json({
            message: "Signin successful",
            ...result,
        });
    }
    catch (error) {
        if (error instanceof Error &&
            error.message === "INVALID_CREDENTIALS") {
            res.status(401).json({
                message: "Invalid email or password",
            });
            return;
        }
        console.error("Signin error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.signin = signin;
