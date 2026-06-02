'use client';

import React, { useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { User, Shield, Save, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    authApi.getMe().then(res => {
      setProfile(res);
      setFullName(res.fullName || '');
      setPhone(res.phoneNumber || '');
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authApi.updateProfile({ full_name: fullName, phone_number: phone });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return <div className="p-12 text-center text-zinc-500">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Profile Settings</h1>
          <p className="text-zinc-500">{profile.email}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Full Name</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full max-w-md px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Phone Number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full max-w-md px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        
        <div className="pt-4 flex items-center gap-4">
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
          {success && <span className="text-emerald-600 flex items-center gap-1.5 text-sm"><CheckCircle className="w-4 h-4" /> Saved successfully</span>}
        </div>
      </div>

      <div className="mt-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-indigo-500" />
          Active Permissions
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.permissions?.map((p: string) => (
            <span key={p} className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg text-xs font-mono">{p}</span>
          ))}
          {!profile.permissions?.length && <span className="text-zinc-500 text-sm">No specific permissions assigned.</span>}
        </div>
      </div>
    </div>
  );
}
