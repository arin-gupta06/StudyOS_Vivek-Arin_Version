import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Character from "../components/Character";
import { motion } from "framer-motion";
import {
  FaLinkedin,
  FaGithub,
  FaReddit,
  FaDiscord,
  FaQuora,
} from "react-icons/fa";
import { Link } from "lucide-react";
import avatar1 from '../assets/avatar/avatar_r1_c1_processed_by_imagy.jpg';
import avatar2 from '../assets/avatar/avatar_r1_c2_processed_by_imagy.jpg';
import avatar3 from '../assets/avatar/avatar_r1_c3_processed_by_imagy.jpg';
import avatar4 from '../assets/avatar/avatar_r2_c1_processed_by_imagy.jpg';
import avatar5 from '../assets/avatar/avatar_r2_c2_processed_by_imagy.jpg';
import avatar6 from '../assets/avatar/avatar_r2_c3_processed_by_imagy.jpg';
import avatar7 from '../assets/avatar/avatar_r3_c1_processed_by_imagy.jpg';
import avatar8 from '../assets/avatar/avatar_r3_c2_processed_by_imagy.jpg';
import avatar9 from '../assets/avatar/avatar_r3_c3_processed_by_imagy.jpg';

const Login = () => {
  const avatarList = [
    avatar1,
    avatar2,
    avatar3,
    avatar4,
    avatar5,
    avatar6,
    avatar7,
    avatar8,
    avatar9,
  ];

  const [isLogin, setIsLogin] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarList[0]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    linkedin: "",
    github: "",
    reddit: "",
    discord: "",
    quora: "",
  });
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.username, formData.email, formData.password, {
          linkedin: formData.linkedin,
          github: formData.github,
          reddit: formData.reddit,
          discord: formData.discord,
          quora: formData.quora,
        }, selectedAvatar);
      }
      navigate("/dashboard");
    } catch (error) {
      console.error("Auth failed", error);
      const errorMessage =
        error.response?.data?.message ||
        "Authentication failed. Please check your credentials.";
      setError(errorMessage);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background text-text-main relative overflow-hidden p-3 sm:p-4">
      {/* Minimal Background Decor */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-light rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface p-4 sm:p-6 rounded-3xl shadow-float w-full max-w-5xl z-10 flex flex-col md:flex-row gap-4 sm:gap-6 max-h-[95vh] overflow-y-auto"
      >
        {/* Left Side: Character & Welcome */}
        <div className="w-full md:w-5/12 flex flex-col items-center justify-center bg-background shadow-inner rounded-2xl p-3 sm:p-5">
          <Character
            state={formData.email || formData.password ? "typing" : "idle"}
          />
          <h3 className="mt-3 text-xl font-bold text-text-main text-center">
            {isLogin ? "Welcome Back!" : "Join Mantessa"}
          </h3>
          <p className="mt-1 text-text-secondary text-center text-xs leading-relaxed">
            {isLogin
              ? "Your personalized study workspace is ready. Let's get productive."
              : "Create your account to unlock a new way of learning."}
          </p>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-7/12 flex flex-col justify-center py-1">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-text-main mb-1">
              {isLogin ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-sm text-text-secondary">
              {isLogin
                ? "Please enter your details."
                : "Start your journey with us."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {!isLogin && (
              <div className="flex items-center gap-3 py-2 bg-background/40 rounded-2xl px-3 border border-border/10">
                <div className="relative group cursor-pointer shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-3 ring-primary/20 p-0.5 bg-surface shadow-xl group-hover:ring-primary/40 transition-all">
                    <img
                      src={selectedAvatar}
                      alt="Selected avatar"
                      className="w-full h-full rounded-full object-cover shrink-0"
                    />
                  </div>
                  <div className="absolute -bottom-0.5 right-0 bg-primary text-white p-0.5 rounded-full shadow-lg border-2 border-surface">
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    {avatarList.map((av, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`relative shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden transition-all duration-200 ${
                          selectedAvatar === av
                            ? "ring-2 ring-primary ring-offset-1 ring-offset-surface scale-110 z-10"
                            : "opacity-40 hover:opacity-100 hover:scale-105"
                        }`}
                      >
                        <img src={av} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-0.5">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background shadow-inner rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder-text-muted text-text-main text-sm"
                  placeholder="e.g., Alex Carter"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-0.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background shadow-inner rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder-text-muted text-text-main text-sm"
                placeholder="name@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-0.5">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background shadow-inner rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder-text-muted text-text-main text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs shadow-inner">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
                  <Link size={11} /> Profile Links
                  <span className="text-text-muted font-normal">(Optional)</span>
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                  {[
                    { key: "linkedin", icon: <FaLinkedin size={12} />, color: "#0077B5", placeholder: "LinkedIn URL" },
                    { key: "github", icon: <FaGithub size={12} />, color: "#6e5494", placeholder: "GitHub URL" },
                    { key: "reddit", icon: <FaReddit size={12} />, color: "#FF4500", placeholder: "Reddit URL" },
                    { key: "discord", icon: <FaDiscord size={12} />, color: "#5865F2", placeholder: "Discord" },
                    { key: "quora", icon: <FaQuora size={12} />, color: "#B92B27", placeholder: "Quora URL" },
                  ].map(({ key, icon, color, placeholder }) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: color + "18", color }}
                      >
                        {icon}
                      </div>
                      <input
                        type="text"
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        className="flex-1 min-w-0 px-2 py-1.5 bg-background shadow-inner rounded-lg text-xs focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder-text-muted text-text-main"
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="w-full btn-primary mt-1">
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-text-secondary">
            {isLogin ? "New to Mantessa? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
