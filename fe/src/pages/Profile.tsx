import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Input from "../components/input";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import { authMe, authUpdate, type ProfileUpdate } from "../api/profile";


const BIO_MAX = 200;

const ProfilePage = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    console.log("user", user);
    const [form, setForm] = useState<ProfileUpdate>({ name: user?.name ?? '', phone: "", bio: "" });
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        authMe()
            .then((p) => {
                setForm({ name: p.name, phone: p.phone ?? "", bio: p.bio ?? "" });
                setEmail(p.email);
            })
            .catch((e: Error) => setMessage({ type: "error", text: e.message }));
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: [] }));
        setMessage(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const updated = await authUpdate(form);
            setForm({ name: updated.name, phone: updated.phone ?? "", bio: updated.bio ?? "" });
            setMessage({ type: "success", text: "Profile updated successfully" });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const fieldErrors = err.response?.data?.errors;
                if (fieldErrors) {
                    setErrors(fieldErrors);
                }
                setMessage({ type: "error", text: err.response?.data?.message ?? "Failed to update profile" });
            } else {
                setMessage({ type: "error", text: "Something went wrong" });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    const fieldProps = (name: keyof ProfileUpdate) => ({
        id: name,
        name,
        value: form[name] ?? "",
        onChange: handleChange,
    });


    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 sm:py-10">
            <div className="mx-auto w-full max-w-lg">
                <Link to="/chat" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
                    ← Back to chats
                </Link>


                <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-6 flex items-center gap-4">
                        <Avatar name={form.name || "User"} />
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-semibold text-gray-900">
                                {form.name || "Your profile"}
                            </h1>
                            <p className="truncate text-sm text-gray-500">{email}</p>
                        </div>
                    </div>

                    {message && (
                        <div
                            role="alert"
                            className={`mb-4 rounded-md px-3 py-2 text-sm ${message.type === "success"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <Input label="Full name" placeholder="John Doe" {...fieldProps("name")} />
                        <Input
                            label="Email"
                            id="email"
                            value={email}
                            variant="filled"
                            disabled
                            className="cursor-not-allowed text-gray-500"
                        />
                        <Input label="Phone" type="tel" placeholder="+91 98765 43210" {...fieldProps("phone")} />

                        <div className="flex flex-col gap-1">
                            <label htmlFor="bio" className="text-sm font-medium text-gray-700">
                                Bio
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                rows={4}
                                maxLength={BIO_MAX}
                                value={form.bio}
                                onChange={handleChange}
                                placeholder="Tell people a bit about yourself"
                                className={`w-full resize-none rounded-md border px-3 py-2 outline-none transition focus:ring-2 ${errors.bio?.length
                                    ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                            />
                            <div className="flex justify-between text-sm">
                                <span className="text-red-500">{errors.bio?.[0]}</span>
                                <span className="text-gray-400">
                                    {form.bio.length}/{BIO_MAX}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" loading={saving} className="mt-6 w-full">
                        Save changes
                    </Button>
                </form>

                <Button variant="outline" onClick={handleLogout} className="mt-4 w-full">
                    Log out
                </Button>
            </div>
        </div>
    );
};

export default ProfilePage;