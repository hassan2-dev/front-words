/* eslint-disable @typescript-eslint/no-unused-vars */
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
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [newUser, setNewUser] = useState({
    name: "",
    phone: "",
    password: "",
    trainerId: "",
    level: "L1",
    goal: "",
    birthDate: "",
    email: "",
    role: "USER",
  });

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean
  ) => {
    try {
      // البحث عن المستخدم لتحديد نوعه
      const user = users.find((u) => u.id === userId);
      let statusRes;

      if (user?.role === "TRAINER") {
        statusRes = await apiClient.put(
          API_ENDPOINTS.ADMIN.TRAINERS.TOGGLE_STATUS(userId)
        );
      } else {
        statusRes = await apiClient.put(
          API_ENDPOINTS.ADMIN.USERS.TOGGLE_STATUS(userId)
        );
      }

      if (statusRes.success) {
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, isActive: !currentStatus } : user
          )
        );
        // Toast notification would be better than alert
      } else {
        alert("حدث خطأ في تغيير حالة المستخدم");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert("حدث خطأ في تغيير حالة المستخدم");
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      // البحث عن المستخدم لتحديد نوعه
      const user = users.find((u) => u.id === userId);
      let statusRes;

      if (user?.role === "TRAINER") {
        statusRes = await apiClient.put(
          API_ENDPOINTS.ADMIN.TRAINERS.ACTIVATE(userId)
        );
      } else {
        statusRes = await apiClient.put(
          API_ENDPOINTS.ADMIN.USERS.ACTIVATE(userId)
        );
      }

      if (statusRes.success) {
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, isActive: true } : user
          )
        );
      }
    } catch (error) {
      console.error("Error activating user:", error);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      // البحث عن المستخدم لتحديد نوعه
      const user = users.find((u) => u.id === userId);
      let statusRes;

      if (user?.role === "TRAINER") {
        statusRes = await apiClient.put(
          API_ENDPOINTS.ADMIN.TRAINERS.DEACTIVATE(userId)
        );
      } else {
        statusRes = await apiClient.put(
          API_ENDPOINTS.ADMIN.USERS.DEACTIVATE(userId)
        );
      }

      if (statusRes.success) {
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, isActive: false } : user
          )
        );
      }
    } catch (error) {
      console.error("Error deactivating user:", error);
    }
  };

  const handleBulkToggleStatus = async (
    userIds: string[],
    isActive: boolean
  ) => {
    try {
      const statusRes = await apiClient.post(
        API_ENDPOINTS.ADMIN.USERS.BULK_TOGGLE_STATUS,
        {
          userIds,
          isActive,
        }
      );
      if (statusRes.success) {
        setUsers(
          users.map((user) =>
            userIds.includes(user.id) ? { ...user, isActive } : user
          )
        );
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error("Error bulk toggling user status:", error);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    }
  };

  const handleBulkActivate = () => {
    if (selectedUsers.length === 0) {
      alert("يرجى اختيار مستخدمين أولاً");
      return;
    }
    handleBulkToggleStatus(selectedUsers, true);
  };

  const handleBulkDeactivate = () => {
    if (selectedUsers.length === 0) {
      alert("يرجى اختيار مستخدمين أولاً");
      return;
    }
    handleBulkToggleStatus(selectedUsers, false);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      alert("يرجى اختيار مستخدمين أولاً");
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف ${selectedUsers.length} مستخدم؟`)) {
      try {
        const deletePromises = selectedUsers.map((userId) => {
          const user = users.find((u) => u.id === userId);
          if (user?.role === "TRAINER") {
            return apiClient.delete(
              API_ENDPOINTS.ADMIN.TRAINERS.DELETE(userId)
            );
          } else {
            return apiClient.delete(API_ENDPOINTS.ADMIN.USERS.DELETE(userId));
          }
        });

        const results = await Promise.all(deletePromises);
        const successCount = results.filter((res) => res.success).length;

        if (successCount > 0) {
          setUsers(users.filter((user) => !selectedUsers.includes(user.id)));
          setSelectedUsers([]);
        }
      } catch (error) {
        console.error("Error bulk deleting users:", error);
      }
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // جلب المستخدمين (الطلاب والأدمن)
      const usersRes = await apiClient.get<any>(API_ENDPOINTS.ADMIN.USERS.LIST);

      // جلب المدربين من جدول منفصل
      const trainersRes = await apiClient.get<any>(
        API_ENDPOINTS.ADMIN.TRAINERS.LIST
      );

      let allUsers: any[] = [];

      // إضافة المستخدمين
      if (usersRes.success && usersRes.data?.users) {
        const transformedUsers = usersRes.data.users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.phone,
          joinDate: user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("ar-SA")
            : "غير محدد",
          status: user.role === "ADMIN" ? "مدير" : "مستخدم",
          role: user.role,
          isActive: user.isActive !== false,
        }));
        allUsers = [...allUsers, ...transformedUsers];
      }

      // إضافة المدربين
      if (trainersRes.success && trainersRes.data?.trainers) {
        const transformedTrainers = trainersRes.data.trainers.map(
          (trainer: any) => ({
            id: trainer.id,
            name: trainer.name,
            email: trainer.phone,
            joinDate: trainer.createdAt
              ? new Date(trainer.createdAt).toLocaleDateString("ar-SA")
              : "غير محدد",
            status: "مدرب",
            role: "TRAINER",
            isActive: trainer.isActive !== false,
          })
        );
        allUsers = [...allUsers, ...transformedTrainers];
      }

      setUsers(allUsers);
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
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      try {
        // البحث عن المستخدم لتحديد نوعه
        const user = users.find((u) => u.id === userId);
        let deleteRes;

        if (user?.role === "TRAINER") {
          deleteRes = await apiClient.delete(
            API_ENDPOINTS.ADMIN.TRAINERS.DELETE(userId)
          );
        } else {
          deleteRes = await apiClient.delete(
            API_ENDPOINTS.ADMIN.USERS.DELETE(userId)
          );
        }

        if (deleteRes.success) {
          setUsers(users.filter((user) => user.id !== userId));
        }
      } catch (error) {
        console.error("Error deleting user:", error);
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
      }
    } catch (error) {
      console.error("Error changing user role:", error);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      phone: user.email,
      password: "",
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      const updateData = {
        name: editingUser.name,
        phone: editingUser.phone,
        role: editingUser.role,
        ...(editingUser.password && { password: editingUser.password }),
      };

      let updateRes;

      // تحديد endpoint بناءً على نوع المستخدم
      if (editingUser.role === "TRAINER") {
        updateRes = await apiClient.put(
          API_ENDPOINTS.ADMIN.TRAINERS.UPDATE(editingUser.id),
          updateData
        );
      } else {
        updateRes = await apiClient.put(
          API_ENDPOINTS.ADMIN.USERS.UPDATE(editingUser.id),
          updateData
        );
      }

      if (updateRes.success) {
        fetchUsers();
        setShowEditModal(false);
        setEditingUser(null);
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleAddUser = async () => {
    try {
      let addUserRes;

      if (newUser.role === "TRAINER") {
        addUserRes = await apiClient.post(
          API_ENDPOINTS.ADMIN.TRAINERS.CREATE,
          newUser
        );
      } else {
        addUserRes = await apiClient.post(
          API_ENDPOINTS.ADMIN.USERS.CREATE,
          newUser
        );
      }

      if (addUserRes.success) {
        fetchUsers();
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
          role: "USER",
        });
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4">
          <div className="text-6xl mb-6 animate-bounce">❌</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            خطأ في التحميل
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center sm:text-right">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
              إدارة المستخدمين
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto sm:mx-0">
              عرض وإدارة جميع مستخدمي المنصة بطريقة سهلة وفعالة
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">
                  إجمالي المستخدمين
                </p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">
                  المستخدمون المفعلون
                </p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.isActive).length}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm font-medium">المدراء</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === "ADMIN").length}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <span className="text-2xl">👑</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">المدربون</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === "TRAINER").length}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <span className="text-2xl">💪</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Filters and Controls */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Search and Filters */}
              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Search Input */}
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="البحث عن مستخدم..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-right shadow-sm group-hover:shadow-md"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Role Filter */}
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-4 py-3 text-black dark:text-white   bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-right shadow-sm hover:shadow-md"
                  >
                    <option value="all">جميع الأدوار</option>
                    <option value="USER">مستخدم</option>
                    <option value="TRAINER">مدرب</option>
                    <option value="ADMIN">مدير</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-white text-black dark:text-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-right shadow-sm hover:shadow-md"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="active">مفعل</option>
                    <option value="inactive">غير مفعل</option>
                  </select>

                  {/* Items per page */}
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 bg-white text-black dark:text-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-right shadow-sm hover:shadow-md"
                  >
                    <option value={5}>5 لكل صفحة</option>
                    <option value={10}>10 لكل صفحة</option>
                    <option value={25}>25 لكل صفحة</option>
                    <option value={50}>50 لكل صفحة</option>
                  </select>
                </div>
              </div>

              {/* Add User Button */}
              <div className="flex items-center">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full xl:w-auto bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-semibold py-3 px-6 sm:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 whitespace-nowrap"
                >
                  <span className="text-lg sm:text-xl">➕</span>
                  <span className="text-sm sm:text-base">
                    إضافة مستخدم جديد
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mx-6 mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-700 shadow-inner">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300 font-semibold">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {selectedUsers.length}
                  </span>
                  <span>تم اختيار {selectedUsers.length} مستخدم</span>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  <button
                    onClick={handleBulkActivate}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                  >
                    <span>✅</span>
                    <span>تفعيل المحددين</span>
                  </button>
                  <button
                    onClick={handleBulkDeactivate}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                  >
                    <span>⏸️</span>
                    <span>إلغاء تفعيل</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                  >
                    <span>🗑️</span>
                    <span>حذف المحددين</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-hidden">
            {/* Mobile Cards View */}
            <div className="lg:hidden">
              {currentUsers.length > 0 ? (
                <div className="p-6 space-y-4">
                  {currentUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                          />
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                              {user.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleToggleUserStatus(user.id, user.isActive)
                          }
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                            user.isActive
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-200 dark:shadow-emerald-800"
                              : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-200 dark:shadow-red-800"
                          } shadow-lg`}
                        >
                          {user.isActive ? "مفعل" : "غير مفعل"}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                            الدور
                          </p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              user.status === "مدير"
                                ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white"
                                : user.status === "مدرب"
                                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                            } shadow-lg`}
                          >
                            {user.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                            تاريخ التسجيل
                          </p>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {user.joinDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                        >
                          <span>✏️</span>
                          <span>تعديل</span>
                        </button>
                        {user.isActive ? (
                          <button
                            onClick={() => handleDeactivateUser(user.id)}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                          >
                            <span>⏸️</span>
                            <span>إلغاء تفعيل</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                          >
                            <span>✅</span>
                            <span>تفعيل</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                        >
                          <span>🗑️</span>
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4 opacity-50">👥</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {searchTerm ||
                    filterRole !== "all" ||
                    filterStatus !== "all"
                      ? "لا توجد نتائج للبحث المحدد"
                      : "لا يوجد مستخدمون حالياً"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ||
                    filterRole !== "all" ||
                    filterStatus !== "all"
                      ? "جرب تغيير معايير البحث والفلترة"
                      : "ابدأ بإضافة مستخدمين جدد للمنصة"}
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="text-right py-4 px-6 font-bold text-gray-900 dark:text-white text-sm">
                        <input
                          type="checkbox"
                          checked={
                            selectedUsers.length === currentUsers.length &&
                            currentUsers.length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                        />
                      </th>
                      <th className="text-right py-4 px-6 font-bold text-gray-900 dark:text-white text-sm">
                        الاسم
                      </th>
                      <th className="text-right py-4 px-6 font-bold text-gray-900 dark:text-white text-sm">
                        البريد الإلكتروني
                      </th>
                      <th className="text-right py-4 px-6 font-bold text-gray-900 dark:text-white text-sm">
                        تاريخ التسجيل
                      </th>
                      <th className="text-right py-4 px-6 font-bold text-gray-900 dark:text-white text-sm">
                        الدور
                      </th>
                      <th className="text-right py-4 px-6 font-bold text-gray-900 dark:text-white text-sm">
                        الحالة
                      </th>
                      <th className="text-right py-4 px-6 font-bold text-gray-900 dark:text-white text-sm">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user: any, index) => (
                        <tr
                          key={user.id}
                          className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 ${
                            index % 2 === 0
                              ? "bg-white dark:bg-gray-800"
                              : "bg-gray-50 dark:bg-gray-850"
                          }`}
                        >
                          <td className="py-4 px-6 text-center">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                              className="rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                            />
                          </td>
                          <td className="py-4 px-6 text-gray-900 dark:text-white">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-lg">
                                  {user.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  ID: {user.id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-medium">
                            {user.email}
                          </td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-medium">
                            {user.joinDate}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center justify-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg ${
                                user.status === "مدير"
                                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white"
                                  : user.status === "مدرب"
                                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                                  : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                              }`}
                            >
                              {user.status === "مدير" && (
                                <span className="ml-1 sm:ml-2">👑</span>
                              )}
                              {user.status === "مدرب" && (
                                <span className="ml-1 sm:ml-2">💪</span>
                              )}
                              {user.status === "مستخدم" && (
                                <span className="ml-1 sm:ml-2">👤</span>
                              )}
                              <span className="hidden sm:inline">
                                {user.status}
                              </span>
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() =>
                                handleToggleUserStatus(user.id, user.isActive)
                              }
                              className={`w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                                user.isActive
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-200 dark:shadow-emerald-800"
                                  : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-200 dark:shadow-red-800"
                              }`}
                            >
                              {user.isActive ? (
                                <>
                                  <span className="ml-1 sm:ml-2">✅</span>
                                  <span className="hidden sm:inline">مفعل</span>
                                </>
                              ) : (
                                <>
                                  <span className="ml-1 sm:ml-2">❌</span>
                                  <span className="hidden sm:inline">
                                    غير مفعل
                                  </span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-1 sm:gap-2"
                              >
                                <span className="text-sm">✏️</span>
                                <span className="hidden sm:inline">تعديل</span>
                              </button>
                              {user.isActive ? (
                                <button
                                  onClick={() => handleDeactivateUser(user.id)}
                                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-1 sm:gap-2"
                                >
                                  <span className="text-sm">⏸️</span>
                                  <span className="hidden sm:inline">
                                    إلغاء تفعيل
                                  </span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivateUser(user.id)}
                                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-1 sm:gap-2"
                                >
                                  <span className="text-sm">✅</span>
                                  <span className="hidden sm:inline">
                                    تفعيل
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-1 sm:gap-2"
                              >
                                <span className="text-sm">🗑️</span>
                                <span className="hidden sm:inline">حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <div className="text-6xl mb-4 opacity-50">👥</div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {searchTerm ||
                            filterRole !== "all" ||
                            filterStatus !== "all"
                              ? "لا توجد نتائج للبحث المحدد"
                              : "لا يوجد مستخدمون حالياً"}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {searchTerm ||
                            filterRole !== "all" ||
                            filterStatus !== "all"
                              ? "جرب تغيير معايير البحث والفلترة"
                              : "ابدأ بإضافة مستخدمين جدد للمنصة"}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  عرض {startIndex + 1} إلى{" "}
                  {Math.min(endIndex, filteredUsers.length)} من{" "}
                  {filteredUsers.length} نتيجة
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                  >
                    <span>←</span>
                    <span>السابق</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 ${
                            currentPage === page
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                  >
                    <span>التالي</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Footer */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    إجمالي المستخدمين:{" "}
                    <span className="font-bold text-gray-900 dark:text-white">
                      {users.length}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    المفعلون:{" "}
                    <span className="font-bold text-green-600">
                      {users.filter((u) => u.isActive).length}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    غير المفعلين:{" "}
                    <span className="font-bold text-red-600">
                      {users.filter((u) => !u.isActive).length}
                    </span>
                  </span>
                </div>
              </div>
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-full">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {selectedUsers.length}
                  </span>
                  <span>تم اختيار {selectedUsers.length} مستخدم</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">إضافة مستخدم جديد</h3>
                  <p className="text-blue-100">أضف مستخدم جديد إلى المنصة</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddUser();
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      الاسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-right shadow-inner"
                      placeholder="أدخل اسم المستخدم"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-right shadow-inner"
                      placeholder="أدخل رقم الهاتف"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      كلمة المرور <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-right shadow-inner"
                      placeholder="أدخل كلمة المرور"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      الدور
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-right shadow-inner"
                    >
                      <option value="USER">مستخدم</option>
                      <option value="TRAINER">مدرب</option>
                      <option value="ADMIN">مدير</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <span className="text-xl">➕</span>
                    <span>إضافة المستخدم</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                  >
                    <span className="text-xl">✕</span>
                    <span>إلغاء</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">تعديل المستخدم</h3>
                  <p className="text-emerald-100">تحديث بيانات المستخدم</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateUser();
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      الاسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-right shadow-inner"
                      placeholder="أدخل اسم المستخدم"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={editingUser.phone}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-right shadow-inner"
                      placeholder="أدخل رقم الهاتف"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      كلمة المرور الجديدة (اختياري)
                    </label>
                    <input
                      type="password"
                      value={editingUser.password}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-right shadow-inner"
                      placeholder="اتركها فارغة إذا لم ترد تغييرها"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      الدور
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-right shadow-inner"
                    >
                      <option value="USER">مستخدم</option>
                      <option value="TRAINER">مدرب</option>
                      <option value="ADMIN">مدير</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 mt-6">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-1">
                          تنبيه
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          اترك حقل كلمة المرور فارغاً إذا كنت لا تريد تغييرها.
                          سيتم الاحتفاظ بكلمة المرور الحالية.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <span className="text-xl">💾</span>
                    <span>حفظ التغييرات</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                  >
                    <span className="text-xl">✕</span>
                    <span>إلغاء</span>
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
