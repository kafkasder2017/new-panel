
import React, { useEffect, useState } from 'react';

interface LoginProps {
    onLogin: (email: string, password: string) => Promise<any>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Sayfa açıldığında daha önce kaydedilmiş e-posta varsa doldur
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const savedEmail = localStorage.getItem('savedEmail');
                if (savedEmail) setEmail(savedEmail);
            } catch {}
        }
    }, []);

    // ?autofill=1 varsa otomatik doldur ve gönder
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const shouldAutofill = params.get('autofill') === '1';
            if (shouldAutofill) {
                const autoEmail = 'isahamid095@gmail.com';
                const autoPass = 'vadalov95';
                setEmail(autoEmail);
                setPassword(autoPass);
                // remember me bilgilerini kaydet
                try {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('savedEmail', autoEmail);
                } catch {}
                // küçük bir tick sonra submit
                const t = setTimeout(() => {
                    // form submit tetikle
                    const form = document.getElementById('login-form') as HTMLFormElement | null;
                    if (form) form.requestSubmit?.();
                }, 100);
                return () => clearTimeout(t);
            }
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            // remember me kaydı
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('savedEmail', email);
                } catch {}
            }
            await onLogin(email, password);
        } catch (err: any) {
            setError(err.message || 'Giriş sırasında bir hata oluştu.');
            setIsLoading(false);
        }
    };



    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white tracking-wider">KAFKASDER</h1>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">Yönetim Paneline Giriş</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                <form id="login-form" className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            E-posta Adresi
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Şifre
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                'Giriş Yap'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
