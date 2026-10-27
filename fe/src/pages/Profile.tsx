import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { authMe, authUpdate, type ProfileUpdate } from "../api/profile";
import { Avatar, Button, Input } from "../components/ui";

const BIO_MAX = 200;

const ProfilePage = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileUpdate>({ name: user?.name ?? "", phone: "", bio: "" });
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
    <div className="pulse-bg min-h-screen px-4 py-8 sm:py-12 flex flex-col justify-center items-center text-slate-100">
      <div className="w-full max-w-lg">
        <Link
          to="/chat"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
        >
          ← Back to chats
        </Link>

        <form onSubmit={handleSubmit} className="pulse-glass-card rounded-3xl p-6 sm:p-8 border border-dark-card-border shadow-2xl">
          <div className="mb-6 flex items-center gap-4 border-b border-dark-card-border pb-6">
            <Avatar name={form.name || "User"} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-white tracking-tight">
                {form.name || "Your Profile"}
              </h1>
              <p className="truncate text-xs text-slate-400 mt-0.5">{email}</p>
            </div>
          </div>

          {message && (
            <div
              role="alert"
              className={`mb-5 rounded-xl border p-3 text-xs font-medium ${
                message.type === "success"
                  ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                  : "border-red-500/30 bg-red-950/40 text-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Input label="Full Name" placeholder="John Doe" {...fieldProps("name")} />
            <Input
              label="Email Address"
              id="email"
              value={email}
              disabled
              className="cursor-not-allowed opacity-70"
            />
            <Input label="Phone Number" type="tel" placeholder="+91 98765 43210" {...fieldProps("phone")} />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bio" className="text-xs font-semibold text-slate-300">
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
                className={`w-full resize-none rounded-xl border bg-dark-input p-3 text-xs text-white placeholder:text-slate-500 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30 ${
                  errors.bio?.length
                    ? "border-red-500/60 focus:border-red-500"
                    : "border-dark-input-border"
                }`}
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span className="text-red-400">{errors.bio?.[0]}</span>
                <span>
                  {(form.bio ?? "").length}/{BIO_MAX}
                </span>
              </div>
            </div>
          </div>

          <Button type="submit" loading={saving} className="mt-6 w-full">
            Save Changes
          </Button>
        </form>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="mt-4 w-full border-dark-card-border bg-dark-card/60 text-slate-300 hover:bg-dark-card-border hover:text-white"
        >
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;