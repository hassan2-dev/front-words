/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "@/presentation/components";
import { useNavigate } from "react-router-dom";

interface Student {
  id: string;
  name: string;
  email: string;
  level: string;
  phone: string;
  lastActive: string;
  totalWordsLearned: number;
  totalWordsAdded: number;
  storiesCreated: number;
  studyStreak: number;
  isActive: boolean;
  dailyStoriesCount?: number;
}

export const TrainerStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const studentsRes = await apiClient.get<Student[]>(
          API_ENDPOINTS.TRAINER.STUDENTS.LIST
        );
        if (studentsRes.success && studentsRes.data) {
          setStudents(studentsRes.data);
          setFilteredStudents(studentsRes.data);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = students;

    // تصفية حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // تصفية حسب المستوى
    if (levelFilter !== "all") {
      filtered = filtered.filter((student) => student.level === levelFilter);
    }

    // تصفية حسب الحالة
    if (statusFilter !== "all") {
      filtered = filtered.filter((student) =>
        statusFilter === "active" ? student.isActive : !student.isActive
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1); // إعادة تعيين الصفحة عند تغيير الفلاتر
  }, [students, searchTerm, levelFilter, statusFilter]);

  const handleStudentClick = (student: Student) => {
    navigate(`/trainer/students/${student.id}`);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "L1":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700";
      case "L2":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700";
      case "L3":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700";
      case "L4":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
      case "L5":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700";
      case "L6":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700";
      case "L7":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-700";
      case "L8":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case "L1":
        return "المستوى 1";
      case "L2":
        return "المستوى 2";
      case "L3":
        return "المستوى 3";
      case "L4":
        return "المستوى 4";
      case "L5":
        return "المستوى 5";
      case "L6":
        return "المستوى 6";
      case "L7":
        return "المستوى 7";
      case "L8":
        return "المستوى 8";
      default:
        return level;
    }
  };

  // Pagination calculations
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  if (loading) {
    return (
      <Loading
        size="xl"
        variant="video"
        text="جاري تحميل قائمة الطلاب..."
        isOverlay
      />
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          إدارة الطلاب
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          عرض وإدارة جميع الطلاب وتقدمهم
        </p>
      </div>

      {/* أدوات البحث والتصفية */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6 mb-6">
        {/* البحث الرئيسي */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            البحث
          </label>
          <input
            type="text"
            placeholder="البحث بالاسم أو البريد الإلكتروني..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>

        {/* زر إظهار/إخفاء الفلاتر */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 space-x-reverse text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <span>{showFilters ? "إخفاء" : "إظهار"} الفلاتر</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              إجمالي الطلاب: {filteredStudents.length}
            </p>
          </div>
        </div>

        {/* الفلاتر */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                المستوى
              </label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">جميع المستويات</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="L4">L4</option>
                <option value="L5">L5</option>
                <option value="L6">L6</option>
                <option value="L7">L7</option>
                <option value="L8">L8</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الحالة
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* معلومات الصفحات */}
      {filteredStudents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              عرض {indexOfFirstStudent + 1} إلى{" "}
              {Math.min(indexOfLastStudent, filteredStudents.length)} من{" "}
              {filteredStudents.length} طالب
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                عرض:
              </label>
              <select
                value={studentsPerPage}
                onChange={(e) => {
                  // يمكن إضافة خيارات مختلفة هنا
                }}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                في الصفحة
              </span>
            </div>
          </div>
        </div>
      )}

      {/* قائمة الطلاب */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            قائمة الطلاب ({filteredStudents.length})
          </h2>
        </div>

        {/* عرض الجدول للشاشات الكبيرة */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الطالب
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  المستوى
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الهاتف
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الكلمات المُتعلمة
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  القصص المُنشأة
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  القصص اليومية
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  آخر نشاط
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => handleStudentClick(student)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {student.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getLevelColor(
                        student.level
                      )}`}
                    >
                      {getLevelText(student.level)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${student.phone.length}` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {student.totalWordsLearned}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {student.storiesCreated}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                      {student.dailyStoriesCount || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      القصص اليومية
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {student.lastActive}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          student.isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                        {student.isActive ? "نشط" : "غير نشط"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* عرض البطاقات للشاشات الصغيرة */}
        <div className="lg:hidden">
          <div className="p-4 space-y-4">
            {currentStudents.map((student) => (
              <div
                key={student.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleStudentClick(student)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {student.email}
                    </p>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getLevelColor(
                          student.level
                        )}`}
                      >
                        {getLevelText(student.level)}
                      </span>
                      <div className="flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            student.isActive ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                          {student.isActive ? "نشط" : "غير نشط"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {student.phone}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      الهاتف
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {student.totalWordsLearned}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      الكلمات المُتعلمة
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {student.storiesCreated}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      القصص المُنشأة
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {student.studyStreak}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      أيام الدراسة
                    </div>
                  </div>
                  <div className="text-center col-span-2">
                    <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                      {student.dailyStoriesCount || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      القصص اليومية
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-start text-xs text-gray-500 dark:text-gray-400">
                    <span>آخر نشاط:</span>
                    <span>{student.lastActive.split("T")[0]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                الصفحة {currentPage} من {totalPages}
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                {/* Previous Button */}
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  السابق
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1 space-x-reverse">
                  {getPageNumbers().map((number, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        typeof number === "number" && paginate(number)
                      }
                      disabled={number === "..."}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        number === currentPage
                          ? "bg-blue-600 text-white"
                          : number === "..."
                          ? "text-gray-400 cursor-default"
                          : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👨‍🎓</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد نتائج
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              جرب تغيير معايير البحث أو التصفية
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
