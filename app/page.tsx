'use client';

import { useState } from 'react';
import SearchForm from '@/components/SearchForm';
import ReportDisplay from '@/components/ReportDisplay';

export default function Home() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (companyName: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
      });

      if (!response.ok) throw new Error('検索に失敗しました');

      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">企業調査レポートツール</h1>
          <p className="text-lg text-gray-600">企業名を入力するだけで、自動調査してレポートを作成します</p>
        </div>

        <SearchForm onSearch={handleSearch} loading={loading} />

        {loading && (
          <div className="text-center mt-8">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
            <p className="mt-4 text-gray-600">調査中...</p>
          </div>
        )}

        {report && !loading && <ReportDisplay report={report} />}
      </div>
    </div>
  );
}
