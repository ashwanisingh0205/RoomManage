import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import pic from '../assets/logo/pic.jpg'

export default function Login() {
  const [userId, setuserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 
  const handleLogin = async (e) => {
    console.log('ywas')
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('auth/login', {
        userId,
        password,
      });
      console.log('response',response)
      
      if (response && response.data) {
        if (response.data.access_token) {
          sessionStorage.setItem('token', response.data.access_token);
          
          // Store role information
          if (response.data.role) {
            sessionStorage.setItem('userRole', response.data.role);
            console.log('User role:', response.data.role);
          }
          
          // No need to manually set Authorization header - axios interceptor handles this
          
          setuserId('');
          setPassword('');
          
          navigate('/home');
        } else {
          setError('Invalid response from server. Please try again.');
        }
      } else {
        setError('No response from server. Please try again.');
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.message || 'Login failed. Please check your credentials.');
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError('An error occurred. Please try again.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

 


  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 backdrop-blur-xs">
          <img 
            src={pic} 
            alt="Background" 
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        {/* Logo and content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-950 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-white text-xl font-semibold">STEAG</span>
          </div>
          
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">This system will improve operational efficiency and enhance guest experience.</h1>
            <p className="text-gray-400 text-lg"> Room management system</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-gray-900 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Sign in</h2>
            <p className="text-gray-400">Welcome to STEAG Admin Panel</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 flex items-start">
              <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                UserId
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setuserId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-white placeholder-gray-400"
                placeholder="UserId"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-white placeholder-gray-400"
                  placeholder="Password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* OR Divider */}
           
            {/* Links */}
          
          </form>
        </div>
      </div>

  
    </div>
  );
}
