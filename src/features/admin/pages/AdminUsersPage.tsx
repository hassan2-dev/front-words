import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "../../../presentation/components";

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    phone: "",
    password: "",
    trainerId: "",
    level: "L1",
    goal: "",
    birthDate: "",
    email: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersRes = await apiClient.get<any>(API_ENDPOINTS.ADMIN.USERS.LIST);

      if (usersRes.success && usersRes.data?.users) {
        const transformedUsers = usersRes.data.users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.phone,
          joinDate: new Date(user.createdAt).toLocaleDateString("en-US"),
          status:
            user.role === "ADMIN"
              ? "مدير"
              : user.role === "TRAINER"
              ? "مدرب"
              : "مستخدم",
          role: user.role,
        }));
        setUsers(transformedUsers);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setError("مشكلة في المصادقة. يرجى إعادة تسجيل الدخول.");
      } else {
        setError("حدث خطأ في تحميل بيانات المستخدمين");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      try {
        const deleteRes = await apiClient.delete(
          API_ENDPOINTS.ADMIN.USERS.DELETE(userId)
        );
        if (deleteRes.success) {
          setUsers(users.filter((user) => user.id !== userId));
          alert("تم حذف المستخدم بنجاح");
        } else {
          alert("حدث خطأ في حذف المستخدم");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("حدث خطأ في حذف المستخدم");
      }
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      const roleRes = await apiClient.put(
        API_ENDPOINTS.ADMIN.USERS.CHANGE_ROLE(userId),
        {
          role: newRole,
        }
      );
      if (roleRes.success) {
        // تحديث قائمة المستخدمين
        setUsers(
          users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  role: newRole,
                  status:
                    newRole === "ADMIN"
                      ? "مدير"
                      : newRole === "TRAINER"
                      ? "مدرب"
                      : "مستخدم",
                }
              : user
          )
        );
        alert("تم تغيير دور المستخدم بنجاح");
      } else {
        alert("حدث خطأ في تغيير دور المستخدم");
      }
    } catch (error) {
      console.error("Error changing user role:", error);
      alert("حدث خطأ في تغيير دور المستخدم");
    }
  };

  const handleAddUser = async () => {
    try {
      const addUserRes = await apiClient.post(
        API_ENDPOINTS.ADMIN.USERS.CREATE,
        newUser
      );

      if (addUserRes.success) {
        alert("تم إضافة المستخدم بنجاح");
        // إعادة تحميل قائمة المستخدمين
        fetchUsers();
        // إغلاق النموذج وإعادة تعيين البيانات
        setShowAddModal(false);
        setNewUser({
          name: "",
          phone: "",
          password: "",
          trainerId: "",
          level: "L1",
          goal: "",
          birthDate: "",
          email: "",
        });
      } else {
        alert("حدث خطأ في إضافة المستخدم");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("حدث خطأ في إضافة المستخدم");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading
          variant="video"
          size="xl"
          text="جاري تحميل بيانات المستخدمين..."
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
          إدارة المستخدمين
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          عرض وإدارة جميع مستخدمي المنصة
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="البحث عن مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                🔍
              </div>
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
            >
              <option value="all">جميع الأدوار</option>
              <option value="USER">مستخدم</option>
              <option value="TRAINER">مدرب</option>
              <option value="ADMIN">مدير</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            إضافة مستخدم جديد
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                  الاسم
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm hidden sm:table-cell">
                  البريد الإلكتروني
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm hidden md:table-cell">
                  تاريخ التسجيل
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-2 sm:px-4 text-gray-900 dark:text-white text-xs sm:text-sm">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-gray-600 dark:text-gray-400 sm:hidden text-xs">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden md:table-cell">
                      {user.joinDate}
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === "مدير"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                            : user.status === "مدرب"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex gap-1 sm:gap-2">
                        <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm">
                          تعديل
                        </button>
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleChangeUserRole(user.id, e.target.value)
                          }
                          className="text-xs border border-gray-300 rounded px-1 py-1 bg-white dark:bg-gray-700 dark:text-white"
                        >
                          <option value="USER">مستخدم</option>
                          <option value="TRAINER">مدرب</option>
                          <option value="ADMIN">مدير</option>
                        </select>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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
                    colSpan={5}
                    className="py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchTerm || filterRole !== "all"
                      ? "لا توجد نتائج للبحث المحدد"
                      : "لا يوجد مستخدمون حالياً"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            إجمالي المستخدمين: {users.length} | المستخدمون المطابقون للفلتر:{" "}
            {filteredUsers.length}
          </p>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  إضافة مستخدم جديد
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddUser();
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      الاسم
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser({ ...newUser, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      المستوى
                    </label>
                    <select
                      value={newUser.level}
                      onChange={(e) =>
                        setNewUser({ ...newUser, level: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
                    >
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      الهدف
                    </label>
                    <textarea
                      value={newUser.goal}
                      onChange={(e) =>
                        setNewUser({ ...newUser, goal: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      تاريخ الميلاد
                    </label>
                    <input
                      type="date"
                      value={newUser.birthDate}
                      onChange={(e) =>
                        setNewUser({ ...newUser, birthDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    إضافة المستخدم
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
