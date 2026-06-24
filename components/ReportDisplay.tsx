'use client';

interface ReportDisplayProps {
  report: {
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
  };
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
  const handleDownload = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2pdf = (await import('html2pdf.js')).default as any;
      html2pdf()
        .set({ margin: 10, filename: `${report.company_name}_report.pdf` })
        .save(element);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF保存に失敗しました');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{report.company_name}</h2>
          {report.company_name_kana && (
            <p className="text-lg text-gray-600 mt-1">（{report.company_name_kana}）</p>
          )}
        </div>
        <button
          onClick={handleDownload}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          PDF保存
        </button>
      </div>

      <div id="report-content" className="space-y-8">
        {/* 基本情報セクション */}
        <section className="border-t pt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">基本情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.industry && (
              <div>
                <p className="text-sm text-gray-500">業種</p>
                <p className="text-lg font-semibold text-gray-900">{report.industry}</p>
              </div>
            )}
            {report.establishment_date && (
              <div>
                <p className="text-sm text-gray-500">設立日</p>
                <p className="text-lg font-semibold text-gray-900">{report.establishment_date}</p>
              </div>
            )}
            {report.representative_name && (
              <div>
                <p className="text-sm text-gray-500">代表者</p>
                <p className="text-lg font-semibold text-gray-900">{report.representative_name}</p>
              </div>
            )}
          </div>
        </section>

        {/* 決算情報セクション */}
        {(report.latest_revenue_billion || report.latest_profit_billion) && (
          <section className="border-t pt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">決算情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.latest_revenue_billion && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">売上高</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {report.latest_revenue_billion}億円
                  </p>
                  <p className="text-xs text-gray-500 mt-1">（{report.latest_revenue_year}年）</p>
                </div>
              )}
              {report.latest_profit_billion && (
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">営業利益</p>
                  <p className="text-2xl font-bold text-green-600">
                    {report.latest_profit_billion}億円
                  </p>
                  <p className="text-xs text-gray-500 mt-1">（{report.latest_profit_year}年）</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 調査概要セクション */}
        {report.search_summary && (
          <section className="border-t pt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">調査概要</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {report.search_summary}
              </p>
            </div>
          </section>
        )}

        {/* レポート作成日 */}
        <section className="border-t pt-8 text-right">
          <p className="text-sm text-gray-500">
            レポート作成日：{new Date(report.created_at).toLocaleDateString('ja-JP')}
          </p>
        </section>
      </div>
    </div>
  );
}
