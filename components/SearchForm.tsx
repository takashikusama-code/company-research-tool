'use client';

import { useState } from 'react';

interface SearchFormProps {
  onSearch: (companyName: string) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim()) {
      onSearch(companyName);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="企業名を入力（例：トヨタ自動車、日本銀行）"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={loading || !companyName.trim()}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? '検索中...' : '調査'}
        </button>
      </div>
    </form>
  );
}
