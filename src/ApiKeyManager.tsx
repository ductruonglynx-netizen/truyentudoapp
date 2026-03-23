
import React, { useState, useEffect } from 'react';
import { storage } from './storage';
import { Plus, Trash2, Check, X, Shield, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

interface ApiKey {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  usage: {
    requests: number;
    tokens: number;
    limit: number;
  };
  lastTested?: string;
  status?: 'valid' | 'invalid' | 'testing';
}

export const ApiKeyManager = ({ onBack }: { onBack: () => void }) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [isTesting, setIsTesting] = useState<string | null>(null);

  useEffect(() => {
    const savedKeys = storage.getApiKeys();
    setKeys(savedKeys);
  }, []);

  const saveKeys = (updatedKeys: ApiKey[]) => {
    setKeys(updatedKeys);
    storage.saveApiKeys(updatedKeys);
  };

  const addKey = () => {
    if (!newKey.trim()) return;
    const key: ApiKey = {
      id: Math.random().toString(36).substr(2, 9),
      key: newKey.trim(),
      name: newName.trim() || `Key ${keys.length + 1}`,
      isActive: keys.length === 0,
      usage: {
        requests: 0,
        tokens: 0,
        limit: 1500 // Giả định giới hạn cho Gemini Free Tier
      }
    };
    saveKeys([...keys, key]);
    setNewKey('');
    setNewName('');
  };

  const deleteKey = (id: string) => {
    saveKeys(keys.filter(k => k.id !== id));
  };

  const toggleKey = (id: string) => {
    saveKeys(keys.map(k => ({
      ...k,
      isActive: k.id === id ? !k.isActive : k.isActive
    })));
  };

  const testKey = async (id: string) => {
    const keyObj = keys.find(k => k.id === id);
    if (!keyObj) return;

    setIsTesting(id);
    try {
      const genAI = new GoogleGenAI({ apiKey: keyObj.key });
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Say 'API Key is working!' in Vietnamese."
      });
      const text = response.text || '';
      
      saveKeys(keys.map(k => k.id === id ? { 
        ...k, 
        status: 'valid', 
        lastTested: new Date().toISOString(),
        usage: { ...k.usage, requests: k.usage.requests + 1 }
      } : k));
      alert(`Kết quả test: ${text}`);
    } catch (error) {
      console.error("API Key test failed", error);
      saveKeys(keys.map(k => k.id === id ? { ...k, status: 'invalid', lastTested: new Date().toISOString() } : k));
      alert("API Key không hợp lệ hoặc đã hết hạn.");
    } finally {
      setIsTesting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pt-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold text-slate-900">Quản lý API Key</h2>
          <p className="text-slate-500 mt-2">Thêm và quản lý các khóa Gemini API của bạn.</p>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
        >
          Quay lại
        </button>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl mb-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" /> Thêm Key mới
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Tên gợi nhớ (ví dụ: Key chính, Key phụ 1...)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <input 
            type="password" 
            placeholder="Nhập Gemini API Key..."
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <button 
          onClick={addKey}
          disabled={!newKey.trim()}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
        >
          Thêm vào danh sách
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {keys.map((key) => (
            <motion.div 
              key={key.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 rounded-[32px] border transition-all ${key.isActive ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200'}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${key.isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{key.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {key.key.substring(0, 8)}****************{key.key.substring(key.key.length - 4)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => testKey(key.id)}
                    disabled={isTesting === key.id}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center gap-2"
                  >
                    {isTesting === key.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                    Chạy thử
                  </button>
                  <button 
                    onClick={() => toggleKey(key.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${key.isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {key.isActive ? 'Đang dùng' : 'Sử dụng'}
                  </button>
                  <button 
                    onClick={() => deleteKey(key.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</p>
                    <p className={`text-sm font-bold ${key.status === 'valid' ? 'text-emerald-600' : key.status === 'invalid' ? 'text-red-600' : 'text-slate-600'}`}>
                      {key.status === 'valid' ? 'Hoạt động tốt' : key.status === 'invalid' ? 'Lỗi/Hết hạn' : 'Chưa kiểm tra'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sử dụng (Token/Request)</p>
                    <p className="text-sm font-bold text-slate-700">
                      {key.usage.requests} / {key.usage.limit} lượt ngày
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Giới hạn</p>
                    <p className="text-sm font-bold text-slate-700">~1500 req/ngày (Free Tier)</p>
                  </div>
                </div>
              </div>
              
              {key.lastTested && (
                <p className="mt-4 text-[10px] text-slate-400 italic">
                  Kiểm tra lần cuối: {new Date(key.lastTested).toLocaleString('vi-VN')}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {keys.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Shield className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Chưa có API Key nào được thêm.</p>
          </div>
        )}
      </div>
    </div>
  );
};
