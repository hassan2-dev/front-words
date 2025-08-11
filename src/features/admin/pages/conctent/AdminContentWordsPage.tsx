import React, { useState, useEffect } from "react";
import { apiClient } from "../../../../core/utils/api";
import { API_ENDPOINTS } from "../../../../core/config/api";
import { Loading } from "../../../../presentation/components";

export const AdminContentWordsPage: React.FC = () => {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  useEffect(() => {
    const fetchWords = async () => {
      setLoading(true);
      setError(null); 
      try {
        const wordsRes = await apiClient.get<any>(
          API_ENDPOINTS.ADMIN.CONTENT.WORDS.LIST
        );

        if (wordsRes.success && wordsRes.data?.words) {
          const transformedWords = wordsRes.data.words.map((word: any) => ({
            id: word.id,
            english: word.english,
            arabic: word.arabic,
            level: word.level || "medium",
            category: word.category || "عام",
            createdAt: new Date(word.createdAt).toLocaleDateString("ar-SA"),
            status: word.isActive ? "نشط" : "غير نشط",
          }));
          setWords(transformedWords);
        }
      } catch (error: any) {
        console.error("Error fetching words:", error);
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          setError("مشكلة في المصادقة. يرجى إعادة تسجيل الدخول.");
        } else {
          setError("حدث خطأ في تحميل بيانات الكلمات");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchWords();
  }, []);

  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.arabic.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = filterLevel === "all" || word.level === filterLevel;

    return matchesSearch && matchesLevel;
  });

  const handleDeleteWord = async (wordId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الكلمة؟")) {
      try {
        const deleteRes = await apiClient.delete(
          API_ENDPOINTS.ADMIN.CONTENT.WORDS.DELETE(wordId)
        );
        if (deleteRes.success) {
          setWords(words.filter((word) => word.id !== wordId));
          alert("تم حذف الكلمة بنجاح");
        } else {
          alert("حدث خطأ في حذف الكلمة");
        }
      } catch (error) {
        console.error("Error deleting word:", error);
        alert("حدث خطأ في حذف الكلمة");
      }
    }
  };

  const handleToggleWordStatus = async (wordId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "نشط" ? false : true;
      const updateRes = await apiClient.put(API_ENDPOINTS.ADMIN.CONTENT.WORDS.UPDATE(wordId), {
        isActive: newStatus
      });
      if (updateRes.success) {
        setWords(words.map(word => 
          word.id === wordId 
            ? { ...word, status: newStatus ? "نشط" : "غير نشط" }
            : word
        ));
        alert("تم تحديث حالة الكلمة بنجاح");
      } else {
        alert("حدث خطأ في تحديث حالة الكلمة");
      }
    } catch (error) {
      console.error("Error updating word status:", error);
      alert("حدث خطأ في تحديث حالة الكلمة");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading
          variant="video"
          size="xl"
          text="جاري تحميل بيانات الكلمات..."
          isOverlay
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            خطأ في التحميل
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          إدارة الكلمات
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          عرض وإدارة جميع كلمات المنصة
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="البحث عن كلمة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                🔍
              </div>
            </div>

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
            >
              <option value="all">جميع المستويات</option>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap">
            إضافة كلمة جديدة
          </button>
        </div>

        {/* Words Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                  الكلمة بالإنجليزية
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                  الترجمة العربية
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm hidden md:table-cell">
                  المستوى
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm hidden lg:table-cell">
                  الفئة
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                  الحالة
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.length > 0 ? (
                filteredWords.map((word: any) => (
                  <tr
                    key={word.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-2 sm:px-4 text-gray-900 dark:text-white text-xs sm:text-sm">
                      <div>
                        <p className="font-medium">{word.english}</p>
                        <p className="text-gray-600 dark:text-gray-400 sm:hidden text-xs">
                          {word.arabic}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      {word.arabic}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden md:table-cell">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          word.level === "easy"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : word.level === "medium"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {word.level === "easy"
                          ? "سهل"
                          : word.level === "medium"
                          ? "متوسط"
                          : "صعب"}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden lg:table-cell">
                      {word.category}
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          word.status === "نشط"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {word.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex gap-1 sm:gap-2">
                        <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm">
                          تعديل
                        </button>
                        <button
                          onClick={() => handleToggleWordStatus(word.id, word.status)}
                          className={`text-xs sm:text-sm ${
                            word.status === "نشط" 
                              ? "text-orange-600 hover:text-orange-700" 
                              : "text-green-600 hover:text-green-700"
                          }`}
                        >
                          {word.status === "نشط" ? "إيقاف" : "تفعيل"}
                        </button>
                        <button
                          onClick={() => handleDeleteWord(word.id)}
                          className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchTerm || filterLevel !== "all"
                      ? "لا توجد نتائج للبحث المحدد"
                      : "لا توجد كلمات حالياً"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            إجمالي الكلمات: {words.length} | الكلمات المطابقة للفلتر:{" "}
            {filteredWords.length}
          </p>
        </div>
      </div>
    </div>
  );
};
