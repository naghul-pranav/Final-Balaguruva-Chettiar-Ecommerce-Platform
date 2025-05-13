import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FaEnvelope,
  FaLock,
  FaSignInAlt,
  FaUserPlus,
  FaGoogle,
  FaSpinner,
  FaExclamationTriangle
} from "react-icons/fa";

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post("https://final-balaguruva-chettiar-ecommerce.onrender.com/login", formData);
      
      if (response.data && response.data.token) {
        // Save token and user data
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        // Update authentication state
        setIsAuthenticated(true);
        
        // Check if there was a pending cart product
        const hasPendingProduct = localStorage.getItem('pendingCartProduct');
        
        // Redirect to home or products page based on pending cart product
        if (hasPendingProduct) {
          navigate("/products");
        } else {
          navigate("/");
        }
        window.location.reload();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // In a real implementation, this would use Google OAuth
    alert("Google login would be implemented here with OAuth");
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
                Welcome Back
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-gray-500 mt-2"
              >
                Log in to your account to continue
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

            <motion.form
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  onSubmit={handleSubmit}
  className="space-y-6"
>
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
    <div className="flex justify-between items-center mb-1">
      <label className="block text-gray-700 text-sm font-medium">
        Password
      </label>
      <a
        href="#"
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        Forgot password?
      </a>
    </div>
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
        <FaSignInAlt className="mr-2" />
      )}
      {isLoading ? "Signing in..." : "Sign In"}
    </motion.button>
  </motion.div>
</motion.form>

<motion.div
  variants={itemVariants}
  className="text-center mt-8 text-gray-600"
>
  <p>
    Don't have an account?{" "}
    <Link
      to="/signup"
      className="text-blue-600 font-medium hover:text-blue-800"
    >
      Sign Up
    </Link>
  </p>
</motion.div>

           
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
