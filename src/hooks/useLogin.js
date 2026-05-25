import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/**
 * useLogin - Custom hook for login form logic
 * Uses real backend API with JWT authentication
 */
export function useLogin() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    setApiError('');

    if (!validateForm()) return false;

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        login(response.user, response.token);
        return true;
      } else {
        setApiError(response.message || 'Login failed');
        return false;
      }
    } catch (error) {
      setApiError(error.message || 'Invalid email or password. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, login]);

  return {
    formData,
    errors,
    isSubmitting,
    showPassword,
    apiError,
    handleChange,
    toggleShowPassword,
    handleSubmit,
  };
}

export default useLogin;
