import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, User, Mail, Link } from "lucide-react";
import {
  FaLinkedin,
  FaGithub,
  FaReddit,
  FaDiscord,
  FaQuora,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import { useLayoutStore } from "../store/layoutStore";
import avatar1 from '../assets/avatar/avatar_r1_c1_processed_by_imagy.jpg';
import avatar2 from '../assets/avatar/avatar_r1_c2_processed_by_imagy.jpg';
import avatar3 from '../assets/avatar/avatar_r1_c3_processed_by_imagy.jpg';
import avatar4 from '../assets/avatar/avatar_r2_c1_processed_by_imagy.jpg';
import avatar5 from '../assets/avatar/avatar_r2_c2_processed_by_imagy.jpg';
import avatar6 from '../assets/avatar/avatar_r2_c3_processed_by_imagy.jpg';
import avatar7 from '../assets/avatar/avatar_r3_c1_processed_by_imagy.jpg';
import avatar8 from '../assets/avatar/avatar_r3_c2_processed_by_imagy.jpg';
import avatar9 from '../assets/avatar/avatar_r3_c3_processed_by_imagy.jpg';

const socialFields = [
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: <FaLinkedin size={18} />,
    color: "#0077B5",
    placeholder: "https://linkedin.com/in/username",
  },
  {
    key: "github",
    label: "GitHub",
    icon: <FaGithub size={18} />,
    color: "#6e5494",
    placeholder: "https://github.com/username",
  },
  {
    key: "reddit",
    label: "Reddit",
    icon: <FaReddit size={18} />,
    color: "#FF4500",
    placeholder: "https://reddit.com/u/username",
  },
  {
    key: "discord",
    label: "Discord",
    icon: <FaDiscord size={18} />,
    color: "#5865F2",
    placeholder: "Discord username",
  },
  {
    key: "quora",
    label: "Quora",
    icon: <FaQuora size={18} />,
    color: "#B92B27",
    placeholder: "https://quora.com/profile/username",
  },
];

const avatars = [
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

const EditProfile = () => {
  const { user, updateSocialLinks, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { showRightPanel } = useLayoutStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [links, setLinks] = useState({
    linkedin: "",
    github: "",
    reddit: "",
    discord: "",
    quora: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
      setSelectedAvatar(user.avatar || "");
      setLinks({
        linkedin: user.socialLinks?.linkedin || "",
        github: user.socialLinks?.github || "",
        reddit: user.socialLinks?.reddit || "",
        discord: user.socialLinks?.discord || "",
        quora: user.socialLinks?.quora || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await updateSocialLinks(links);
      const profileUpdates = {};
      if (selectedAvatar !== user.avatar) profileUpdates.avatar = selectedAvatar;
      if (username.trim() !== user.username) profileUpdates.username = username.trim();
      if (email.trim().toLowerCase() !== user.email) profileUpdates.email = email.trim().toLowerCase();
      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(profileUpdates);
      }
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-text-main overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-hover rounded-xl transition-colors text-text-muted hover:text-text-main"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-main">Edit Profile</h1>
            <p className="text-sm text-text-secondary">
              Manage your personal info, avatar, and social links
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* ── Avatar Section ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-2xl border border-border p-6"
          >
            <h3 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
              <User size={16} className="text-primary" /> Avatar
            </h3>
            <div className="flex items-center gap-6">
              {/* Selected avatar preview */}
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-primary/20 bg-surface-hover shadow-lg">
                  <img
                    src={selectedAvatar}
                    alt="Selected avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Avatar grid */}
              <div className="flex flex-wrap gap-3">
                {avatars.map((avatar, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedAvatar(avatar);
                      setError("");
                      setSuccess(false);
                    }}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                      selectedAvatar === avatar
                        ? "border-primary scale-110 shadow-lg"
                        : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${i + 1}`}
                      className="w-full h-full object-cover bg-surface-hover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Personal Info ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-surface rounded-2xl border border-border p-6"
          >
            <h3 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
              <Mail size={16} className="text-primary" /> Personal Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                    setSuccess(false);
                  }}
                  className="w-full px-4 py-3 bg-background shadow-inner rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder-text-muted text-text-main"
                  placeholder="e.g., Alex Carter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setSuccess(false);
                  }}
                  className="w-full px-4 py-3 bg-background shadow-inner rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder-text-muted text-text-main"
                  placeholder="name@example.com"
                />
              </div>
            </div>
          </motion.div>

          {/* ── Social Links ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface rounded-2xl border border-border p-6"
          >
            <h3 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
              <Link size={16} className="text-primary" /> Social Links
              <span className="text-xs text-text-muted font-normal">(Optional)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {socialFields.map(({ key, label, icon, color, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {label}
                  </label>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color + "18", color }}
                    >
                      {icon}
                    </div>
                    <input
                      type="text"
                      value={links[key]}
                      onChange={(e) => {
                        setLinks((prev) => ({ ...prev, [key]: e.target.value }));
                        setError("");
                        setSuccess(false);
                      }}
                      className="flex-1 px-4 py-3 bg-background shadow-inner rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder-text-muted text-text-main"
                      placeholder={placeholder}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Messages & Save ── */}
          {error && (
            <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 text-green-400 px-4 py-3 rounded-xl text-sm">
              Profile saved successfully!
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex justify-end gap-3 pb-6"
          >
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-hover rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-6"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </motion.div>
        </div>
      </main>

      {showRightPanel && <RightPanel />}
    </div>
  );
};

export default EditProfile;
