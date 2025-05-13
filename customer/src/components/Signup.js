import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaUserPlus,
  FaGoogle,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle
} from "react-icons/fa";
import { FaKey } from 'react-icons/fa';

const Signup = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  confirmPassword: ""
});
const [error, setError] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [focusedInput, setFocusedInput] = useState(null);
const [passwordStrength, setPasswordStrength] = useState(0);
const [showVerification, setShowVerification] = useState(false);
const [verificationCode, setVerificationCode] = useState("");
const [serverCode, setServerCode] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return score;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    return Math.min(score, 5);
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return "Very Weak";
      case 1: return "Weak";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Strong";
      case 5: return "Very Strong";
      default: return "";
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return "bg-red-500";
      case 1: return "bg-red-400";
      case 2: return "bg-yellow-500";
      case 3: return "bg-yellow-400";
      case 4: return "bg-green-500";
      case 5: return "bg-green-600";
      default: return "bg-gray-300";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    setError(null);
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  try {
    const signupData = {
      name: formData.name,
      email: formData.email,
      password: formData.password
    };

    const response = await axios.post("https://final-balaguruva-chettiar-ecommerce.onrender.com/signup", signupData);
    
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      navigate("/");
      window.location.reload();
    }
  } catch (err) {
    setError(
      err.response?.data?.message || 
      "Registration failed. Please try again."
    );
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="px-8 py-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="text-center mb-10"
            >
              <motion.h2
                variants={itemVariants}
                className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Create an Account
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-gray-500 mt-2"
              >
                Join us to explore our premium yarn collections
              </motion.p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg flex items-center"
              >
                <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {showVerification ? (
  <motion.form
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    onSubmit={(e) => {
      e.preventDefault();
      if (verificationCode === serverCode) {
        handleSubmit(e);
      } else {
        setError("Invalid verification code");
      }
    }}
    className="space-y-5"
  >
    <motion.div variants={itemVariants}>
      <label className="block text-gray-700 text-sm font-medium mb-1">
        Verification Code
      </label>
      <div
        className={`relative rounded-lg transition-all duration-200 
        ${focusedInput === "verificationCode" ? "ring-2 ring-blue-300" : ""}`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaKey className="text-gray-400" />
        </div>
        <input
          type="text"
          name="verificationCode"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          onFocus={() => setFocusedInput("verificationCode")}
          onBlur={() => setFocusedInput(null)}
          required
          className="block w-full bg-gray-50 pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Enter 6-digit code"
        />
      </div>
    </motion.div>

    <motion.div variants={itemVariants}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg"
      >
        {isLoading ? (
          <FaSpinner className="animate-spin mr-2" />
        ) : (
          <FaCheckCircle className="mr-2" />
        )}
        {isLoading ? "Verifying..." : "Verify Code"}
      </motion.button>
    </motion.div>
  </motion.form>
) : (
  <motion.form
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    onSubmit={async (e) => {
      e.preventDefault();
      if (!validateForm()) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.post("https://final-balaguruva-chettiar-ecommerce.onrender.com/send-verification", {
          email: formData.email,
        });
        setServerCode(response.data.code);
        setShowVerification(true);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to send verification code.");
      } finally {
        setIsLoading(false);
      }
    }}
    className="space-y-5"
  >
    <motion.div variants={itemVariants}>
      <label className="block text-gray-700 text-sm font-medium mb-1">
        Full Name
      </label>
      <div
        className={`relative rounded-lg transition-all duration-200 
        ${focusedInput === "name" ? "ring-2 ring-blue-300" : ""}`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaUser className="text-gray-400" />
        </div>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onFocus={() => setFocusedInput("name")}
          onBlur={() => setFocusedInput(null)}
          required
          className="block w-full bg-gray-50 pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="John Doe"
        />
      </div>
    </motion.div>

    <motion.div variants={itemVariants}>
      <label className="block text-gray-700 text-sm font-medium mb-1">
        Email Address
      </label>
      <div
        className={`relative rounded-lg transition-all duration-200 
        ${focusedInput === "email" ? "ring-2 ring-blue-300" : ""}`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaEnvelope className="text-gray-400" />
        </div>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onFocus={() => setFocusedInput("email")}
          onBlur={() => setFocusedInput(null)}
          required
          className="block w-full bg-gray-50 pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="you@example.com"
        />
      </div>
    </motion.div>

    <motion.div variants={itemVariants}>
      <label className="block text-gray-700 text-sm font-medium mb-1">
        Password
      </label>
      <div
        className={`relative rounded-lg transition-all duration-200 
        ${focusedInput === "password" ? "ring-2 ring-blue-300" : ""}`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaLock className="text-gray-400" />
        </div>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onFocus={() => setFocusedInput("password")}
          onBlur={() => setFocusedInput(null)}
          required
          className="block w-full bg-gray-50 pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="••••••••"
        />
      </div>
      {formData.password && (
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <div className="h-2 flex-grow rounded-full bg-gray-200 overflow-hidden">
              <div 
                className={`h-full ${getPasswordStrengthColor()}`} 
                style={{ width: `${(passwordStrength / 5) * 100}%` }}
              ></div>
            </div>
            <span className="ml-2 text-xs text-gray-500">{getPasswordStrengthText()}</span>
          </div>
        </div>
      )}
    </motion.div>

    <motion.div variants={itemVariants}>
      <label className="block text-gray-700 text-sm font-medium mb-1">
        Confirm Password
      </label>
      <div
        className={`relative rounded-lg transition-all duration-200 
        ${focusedInput === "confirmPassword" ? "ring-2 ring-blue-300" : ""}
        ${formData.confirmPassword && formData.password === formData.confirmPassword ? "border-green-500" : ""}`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaLock className="text-gray-400" />
        </div>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onFocus={() => setFocusedInput("confirmPassword")}
          onBlur={() => setFocusedInput(null)}
          required
          className="block w-full bg-gray-50 pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="••••••••"
        />
        {formData.confirmPassword && formData.password === formData.confirmPassword && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <FaCheckCircle className="text-green-500" />
          </div>
        )}
      </div>
    </motion.div>

    <motion.div variants={itemVariants}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg"
      >
        {isLoading ? (
          <FaSpinner className="animate-spin mr-2" />
        ) : (
          <FaUserPlus className="mr-2" />
        )}
        {isLoading ? "Sending code..." : "Send Verification Code"}
      </motion.button>
    </motion.div>
  </motion.form>
)}

<motion.div
  variants={itemVariants}
  className="text-center mt-8 text-gray-600"
>
  <p>
    Already have an account?{" "}
    <Link
      to="/login"
      className="text-blue-600 font-medium hover:text-blue-800"
    >
      Log In
    </Link>
  </p>
</motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
