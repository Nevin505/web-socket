import { signupSchema, signinSchema, } from "./auth.schema";
import { signupUser, signinUser, } from "./auth.service";
export const signup = async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
        return;
    }
    try {
        const user = await signupUser(parsed.data);
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
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const signin = async (req, res) => {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
        return;
    }
    try {
        const result = await signinUser(parsed.data);
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
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
