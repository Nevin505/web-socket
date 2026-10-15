import type { SignupInput, SigninInput } from "./auth.schema.ts";
export declare function signupUser(input: SignupInput): Promise<any>;
export declare function signinUser(input: SigninInput): Promise<{
    token: string;
    user: {
        id: any;
        name: any;
        email: any;
    };
}>;
//# sourceMappingURL=auth.service.d.ts.map