import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import {
    signin,
    signup,
    type AuthUser,
} from "../api/auth";
import { authMe } from "../api/profile";

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean; // true while checking an existing token on page load
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    console.log("user in here", user)
    // restore the session if a token exists
    useEffect(() => {
        console.log("called")
        if (!localStorage.getItem("token")) {
            setLoading(false);
            return;
        }
        authMe()
            .then(setUser)
            .catch(() => localStorage.removeItem("token")) // expired or invalid token
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { token, user } = await signin({ email, password });
        console.log("the toekn", token);
        console.log("the user", user)
        localStorage.setItem("token", token);
        setUser(user);
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        const { user } = await signup({ name, email, password });
        // localStorage.setItem("token", token);
        setUser(user);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout }),
        [user, loading, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
};