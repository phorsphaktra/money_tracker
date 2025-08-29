import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const SignUpScreen = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        phoneNumber: '',
        country: '',
    });
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const { register, loginWithGoogle, loading: authLoading } = useAuth();
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };
    const navigate = useNavigate();

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setError('');
        const user = await register(formData.email, formData.password, formData.displayName);
        if (user) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 px-2">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-white rounded-2xl shadow-2xl p-4 sm:p-8 space-y-6">
                <div>
                    <h2 className="mt-2 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
                        {step === 1 ? 'Create Account' : 'Complete Profile'}
                    </h2>
                    <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
                        Step {step} of 2
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 rounded">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-xs sm:text-sm text-red-600">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form className="mt-4 sm:mt-8 space-y-6" onSubmit={handleSubmit}>
                    {step === 1 ? (
                        <div className="rounded-md shadow-sm space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Next
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-md shadow-sm space-y-4">
                            {/* Additional fields for step 2 */}
                            <div>
                                <label htmlFor="displayName" className="block text-xs sm:text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <input
                                    id="displayName"
                                    name="displayName"
                                    type="text"
                                    required
                                    className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    autoComplete="name"
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-2 sm:py-3 px-4 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="flex-1 py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Create Account
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="mt-4 sm:mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-xs sm:text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    setIsRedirecting(true);
                                    const user = await loginWithGoogle();
                                    if (user) navigate('/');
                                }}
                                disabled={isRedirecting}
                                className="mt-3 sm:mt-4 w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                <img
                                    className="h-5 w-5 mr-2"
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt="Google"
                                />
                                {isRedirecting ? 'Redirecting to Google...' : 'Sign up with Google'}
                            </button>
                        </div>
                    )}
                </form>

                <div className="text-xs sm:text-sm text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        Already have an account? Sign in
                    </button>
                </div>
            </div>
        </div>
    );
};
