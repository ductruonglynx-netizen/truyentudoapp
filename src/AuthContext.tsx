import React, { createContext, useContext, useEffect, useState } from 'react';

interface LocalUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const GUEST_USER: LocalUser = {
  uid: 'local-user',
  displayName: 'Tác giả (Local)',
  email: 'local@example.com',
  photoURL: 'https://picsum.photos/seed/author/100/100',
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has "logged in" locally before
    const savedUser = localStorage.getItem('story_app_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Default to guest for this app as requested
      setUser(GUEST_USER);
      localStorage.setItem('story_app_user', JSON.stringify(GUEST_USER));
    }
    setLoading(false);
  }, []);

  const login = () => {
    setUser(GUEST_USER);
    localStorage.setItem('story_app_user', JSON.stringify(GUEST_USER));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('story_app_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
