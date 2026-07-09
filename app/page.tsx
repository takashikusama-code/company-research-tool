'use client';

import { useState } from 'react';
import SearchForm from '@/components/SearchForm';
import ReportDisplay from '@/components/ReportDisplay';

interface Report {
  id: string;
  company_name: string;
  company_name_kana?: string;
  industry?: string;
  establishment_date?: string;
  representative_name?: string;
  latest_revenue_billion?: number;
  latest_revenue_year?: number;
  latest_profit_billion?: number;
  latest_profit_year?: number;
  search_summary?: string;
  created_at: string;
}

export default function Home() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSearch = async (companyName: string) => {
    setLoading(true);
    setError('');
    setReport(null);

    try {
      const requestBody = JSON.stringify({ companyName });
      const encoder = new TextEncoder();
      const encodedBody = encoder.encode(requestBody);

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: encodedBody,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = (await response.json()) as Partial<Report> & { error?: string };

      if ('error' in data && data.error) {
        throw new Error(data.error);
      }

      if (!data.company_name) {
        throw new Error('企業情報の取得に失敗しました');
      }

      setReport(data as Report);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">企業調査レポートツール</h1>
          <p className="text-lg text-gray-600">
            企業名を入力するだけで、自動調査してレポートを作成します
          </p>
        </div>

        <SearchForm onSearch={handleSearch} loading={loading} />

        {loading && (
          <div className="text-center mt-8">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
            </div>
            <p className="mt-4 text-gray-600">調査中...</p>
            <p className="mt-2 text-sm text-gray-500">
              企業情報を検索して、レポートを作成しています...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">エラーが発生しました</h3>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-3">
              • 企業の正式名称をご確認ください
            </p>
            <p className="text-sm text-red-600">
              • 一般的に知られている企業名で検索してください
            </p>
            <p className="text-sm text-red-600">
              • 別の企業名でお試しください
            </p>
          </div>
        )}

        {report && !loading && <ReportDisplay report={report} />}
      </div>
    </div>
  );
}
