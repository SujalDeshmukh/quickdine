/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

// The base URL of our Express backend.
// In development, Vite runs on :5173 and Express runs on :5000.
// Change this to your deployed backend URL in production.
const API_BASE_URL = "http://localhost:5000/api";

interface UserType {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: "user" | "admin" | "owner";
}

interface AppContextType {
    user: UserType | null;
    token: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAuthModalOpen: boolean;
    setAuthModalOpen: (open: boolean) => void;
    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string, phone?: string, role?: string) => Promise<boolean>;
    logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface Props {
    children: React.ReactNode;
}

export const AppContextProvider = ({ children }: Props) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [loading, setLoading] = useState<boolean>(true);
    const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);

    // ─── login: POST /api/auth/login ─────────────────────────────────────────
    // Sends credentials to the backend, receives a JWT on success,
    // stores it in localStorage and state, and attaches it as the default
    // Authorization header for all future Axios requests.
    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
                email,
                password,
            });

            setToken(data.token);
            setUser(data.user);
            localStorage.setItem("token", data.token);
            // Set default header for all future Axios calls
            axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
            toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
            return true;
        } catch (error: any) {
            const message = error?.response?.data?.message || "Login failed. Please try again.";
            toast.error(message);
            return false;
        }
    };

    // ─── register: POST /api/auth/register ───────────────────────────────────
    // Sends registration details to the backend, which hashes the password
    // and creates a new User document, then returns a JWT.
    const register = async (
        name: string,
        email: string,
        password: string,
        phone?: string,
        role?: string
    ): Promise<boolean> => {
        try {
            const { data } = await axios.post(`${API_BASE_URL}/auth/register`, {
                name,
                email,
                password,
                phone,
                role,
            });

            setToken(data.token);
            setUser(data.user);
            localStorage.setItem("token", data.token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
            toast.success("Account created successfully! Welcome to QuickDine.");
            return true;
        } catch (error: any) {
            const message = error?.response?.data?.message || "Registration failed. Please try again.";
            toast.error(message);
            return false;
        }
    };

    // ─── logout ───────────────────────────────────────────────────────────────
    // Clears token from state and localStorage, removes the default
    // Authorization header from Axios, and redirects to home.
    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common["Authorization"];
        window.location.href = "/";
    };

    // ─── Session Restore: GET /api/auth/me ───────────────────────────────────
    // On every app load, if a token exists in localStorage, we call /api/auth/me
    // to validate it and restore the user session. This keeps the user logged in
    // across page refreshes without storing sensitive data in localStorage.
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    // Set the Authorization header from the stored token
                    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                    const { data } = await axios.get(`${API_BASE_URL}/auth/me`);
                    setUser(data.user);
                } catch {
                    // Token is invalid or expired — clear it
                    localStorage.removeItem("token");
                    setToken(null);
                    delete axios.defaults.headers.common["Authorization"];
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [token]);

    const value: AppContextType = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAuthModalOpen,
        setAuthModalOpen,
        login,
        register,
        logout,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within AppContextProvider");
    }
    return context;
};
