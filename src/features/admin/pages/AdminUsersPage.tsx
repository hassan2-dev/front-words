/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "../../../presentation/components";
import toast from "react-hot-toast";

/**
 * صفحة إدارة المستخدمين للمدير
 *
 * هذه الصفحة تتيح للمدير:
 * - عرض جميع المستخدمين (طلاب، مدربين، مدراء)
 * - إضافة مستخدمين جدد مع تحديد دورهم
 * - تعديل بيانات المستخدمين
 * - تفعيل/إلغاء تفعيل المستخدمين
 * - حذف المستخدمين
 *
 * الأدوار المتاحة:
 * - USER: مستخدم عادي (طالب)
 * - TRAINER: مدرب (يمكنه إدارة الطلاب)
 * - ADMIN: مدير (صلاحيات كاملة)
 *
 * ملاحظة: المدربون يتم إرسالهم إلى endpoint منفصل (/admin/trainers)
 * بينما المستخدمون العاديون والمدراء يتم إرسالهم إلى (/admin/users)
 */

// Helper function to format date for input field
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
  } catch (error) {
    return "";
  }
};

// Helper function to validate user data
const validateUserData = (
  userData: any,
  isNewUser: boolean = false
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  let hasErrors = false;

  // التحقق من الاسم (يجب أن يكون باللغة الإنجليزية)
  if (!userData.name || userData.name.trim().length < 2) {
    toast.error("الاسم يجب أن يكون على الأقل حرفين");
    errors.push("الاسم يجب أن يكون على الأقل حرفين");
    hasErrors = true;
  } else if (userData.name.trim().length > 50) {
    toast.error("الاسم يجب أن يكون أقل من 50 حرف");
    errors.push("الاسم يجب أن يكون أقل من 50 حرف");
    hasErrors = true;
  } else if (!/^[a-zA-Z\s]+$/.test(userData.name.trim())) {
    toast.error("الاسم يجب أن يكون باللغة الإنجليزية (أحرف لاتينية فقط)");
    errors.push("الاسم يجب أن يكون باللغة الإنجليزية (أحرف لاتينية فقط)");
    hasErrors = true;
  }

  // التحقق من رقم الهاتف
  if (!userData.phone || userData.phone.trim().length < 9) {
    toast.error("رقم الهاتف يجب أن يكون صحيحاً (9 أرقام على الأقل)");
    errors.push("رقم الهاتف يجب أن يكون صحيحاً (9 أرقام على الأقل)");
    hasErrors = true;
  } else if (userData.phone.trim().length > 15) {
    toast.error("رقم الهاتف طويل جداً");
    errors.push("رقم الهاتف طويل جداً");
    hasErrors = true;
  }

  // التحقق من كلمة المرور للمستخدمين الجدد
  if (isNewUser) {
    if (!userData.password || userData.password.length < 8) {
      toast.error("كلمة المرور يجب أن تكون على الأقل 8 أحرف");
      errors.push("كلمة المرور يجب أن تكون على الأقل 8 أحرف");
      hasErrors = true;
    } else if (userData.password.length > 10) {
      toast.error("كلمة المرور طويلة جداً");
      errors.push("كلمة المرور طويلة جداً");
      hasErrors = true;
    } else if (!/^[a-zA-Z\s 0-9]+$/.test(userData.password.trim())) {
      toast.error(
        "كلمة المرور يجب أن يكون باللغة الإنجليزية (أحرف لاتينية فقط)"
      );
      errors.push(
        "كلمة المرور يجب أن يكون باللغة الإنجليزية (أحرف لاتينية فقط)"
      );
      hasErrors = true;
    }
  }

  // التحقق من الدور
  if (!userData.role || !["USER", "TRAINER", "ADMIN"].includes(userData.role)) {
    toast.error("يجب تحديد دور صحيح للمستخدم (مستخدم، مدرب، أو مدير)");
    errors.push("يجب تحديد دور صحيح للمستخدم (مستخدم، مدرب، أو مدير)");
    hasErrors = true;
  }

  return {
    isValid: !hasErrors,
    errors: errors,
  };
};

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
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
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAssignTrainerModal, setShowAssignTrainerModal] = useState(false);
  const [selectedUserForTrainer, setSelectedUserForTrainer] =
    useState<any>(null);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [unassignedUsers, setUnassignedUsers] = useState<any[]>([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
  const [isLoadingUnassigned, setIsLoadingUnassigned] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    phone: "",
    password: "",
    trainerId: "",
    level: "L1",
    goal: "",
    birthDate: "",
    email: "",
    role: "USER", // تعيين دور افتراضي للمستخدم
  });
  const [selectedTrainerForNewUser, setSelectedTrainerForNewUser] =
    useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

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
        toast.success(
          `تم ${currentStatus ? "إلغاء تفعيل" : "تفعيل"} المستخدم بنجاح`
        );
      } else {
        toast.error("حدث خطأ في تغيير حالة المستخدم");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("حدث خطأ في تغيير حالة المستخدم");
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
    } catch (error) {}
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
    } catch (error) {}
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
    } catch (error) {}
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
      return;
    }
    handleBulkToggleStatus(selectedUsers, true);
  };

  const handleBulkDeactivate = () => {
    if (selectedUsers.length === 0) {
      return;
    }
    handleBulkToggleStatus(selectedUsers, false);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
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

  const levels = [
    { id: "L1", name: "L1" },
    { id: "L2", name: "L2" },
    { id: "L3", name: "L3" },
    { id: "L4", name: "L4" },
    { id: "L5", name: "L5" },
    { id: "L6", name: "L6" },
    { id: "L7", name: "L7" },
    { id: "L8", name: "L8" },
  ];
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
            ? new Date(user.createdAt).toLocaleDateString("en-US")
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
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setError("مشكلة في المصادقة. يرجى إعادة تسجيل الدخول.");
      } else {
        setError("حدث خطأ في تحميل بيانات المستخدمين");
      }
    } finally {
      setLoading(false);
    }
  };

  // جلب المدربين المتاحين
  const fetchAvailableTrainers = async () => {
    try {
      setIsLoadingTrainers(true);
      const response = await apiClient.get<any>("/admin/trainers/available");
      if (response.success) {
        setAvailableTrainers(response.data?.trainers || []);
      }
    } catch (error) {
    } finally {
      setIsLoadingTrainers(false);
    }
  };

  // ربط مستخدم بمدرب
  const handleAssignTrainer = async (userId: string, trainerId: string) => {
    try {
      const response = await apiClient.put(
        `/admin/users/${userId}/assign-trainer`,
        {
          trainerId,
        }
      );

      if (response.success) {
        toast.success("تم ربط المستخدم بالمدرب بنجاح");
        fetchUsers(); // إعادة تحميل قائمة المستخدمين
        setShowAssignTrainerModal(false);
        setSelectedUserForTrainer(null);
      } else {
        toast.error("فشل في ربط المستخدم بالمدرب");
      }
    } catch (error) {
      console.error("Error assigning trainer:", error);
      toast.error("حدث خطأ في ربط المستخدم بالمدرب");
    }
  };

  // إزالة ربط مستخدم من مدرب
  const handleRemoveTrainer = async (userId: string) => {
    if (!window.confirm("هل أنت متأكد من إزالة ربط المستخدم من المدرب؟")) {
      return;
    }

    try {
      const response = await apiClient.put(
        `/admin/users/${userId}/remove-trainer`
      );

      if (response.success) {
        fetchUsers(); // إعادة تحميل قائمة المستخدمين
      }
    } catch (error) {
      console.error("Error removing trainer:", error);
    }
  };

  // فتح نافذة ربط المدرب
  const openAssignTrainerModal = (user: any) => {
    setSelectedUserForTrainer(user);
    setShowAssignTrainerModal(true);
    fetchAvailableTrainers();
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
    const confirmed = await new Promise<boolean>((resolve) => {
      // استخدم نافذة تأكيد صغيرة (Yes/No) مخصصة بدل window.confirm
      const modal = document.createElement("div");
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100vw";
      modal.style.height = "100vh";
      modal.style.background = "rgba(0,0,0,0.3)";
      modal.style.display = "flex";
      modal.style.alignItems = "center";
      modal.style.justifyContent = "center";
      modal.style.zIndex = "9999";

      const box = document.createElement("div");
      box.style.background = "#fff";
      box.style.borderRadius = "12px";
      box.style.boxShadow = "0 2px 16px rgba(0,0,0,0.15)";
      box.style.padding = "24px 20px";
      box.style.textAlign = "center";
      box.style.minWidth = "240px";
      box.style.fontFamily = "inherit";

      const msg = document.createElement("div");
      msg.textContent = "هل أنت متأكد من حذف هذا المستخدم؟";
      msg.style.fontSize = "16px";
      msg.style.marginBottom = "18px";
      box.appendChild(msg);

      const btns = document.createElement("div");
      btns.style.display = "flex";
      btns.style.justifyContent = "center";
      btns.style.gap = "12px";

      const yesBtn = document.createElement("button");
      yesBtn.textContent = "نعم";
      yesBtn.style.background = "#ef4444";
      yesBtn.style.color = "#fff";
      yesBtn.style.border = "none";
      yesBtn.style.borderRadius = "6px";
      yesBtn.style.padding = "8px 20px";
      yesBtn.style.fontWeight = "bold";
      yesBtn.style.cursor = "pointer";
      yesBtn.onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
      };

      const noBtn = document.createElement("button");
      noBtn.textContent = "لا";
      noBtn.style.background = "#e5e7eb";
      noBtn.style.color = "#222";
      noBtn.style.border = "none";
      noBtn.style.borderRadius = "6px";
      noBtn.style.padding = "8px 20px";
      noBtn.style.fontWeight = "bold";
      noBtn.style.cursor = "pointer";
      noBtn.onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
      };

      btns.appendChild(yesBtn);
      btns.appendChild(noBtn);
      box.appendChild(btns);
      modal.appendChild(box);
      document.body.appendChild(modal);
    });

    if (confirmed) {
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
      } catch (error) {}
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
    } catch (error) {}
  };

  const handleEditUser = async (user: any) => {
    try {
      // جلب معلومات المستخدم الكاملة من الباك إند
      let userDetails;

      if (user.role === "TRAINER") {
        const response = await apiClient.get<any>(`/admin/trainers/${user.id}`);
        if (response.success) {
          userDetails = response.data?.trainer;
        } else {
        }
      } else {
        const response = await apiClient.get<any>(`/admin/users/${user.id}`);
        if (response.success) {
          userDetails = response.data?.user;
        } else {
        }
      }

      if (userDetails) {
        // استخدام البيانات من الخادم مع fallback للبيانات المحلية
        setEditingUser({
          id: user.id,
          name: userDetails.name || user.name || "",
          phone: userDetails.phone || user.email || "",
          email: userDetails.email || "",
          level: userDetails.level || "L1",
          goal: userDetails.goal || "",
          birthDate: userDetails.birthDate || "",
          password: "", // دائماً فارغ للتعديل
          role: user.role,
          trainerId: userDetails.trainerId || "",
        });
      } else {
        // إذا فشل جلب التفاصيل، استخدم البيانات المتاحة
        setEditingUser({
          id: user.id,
          name: user.name || "",
          phone: user.email || "",
          email: "",
          level: "L1",
          goal: "",
          birthDate: "",
          password: "",
          role: user.role,
          trainerId: "",
        });
      }

      setShowEditModal(true);
    } catch (error: any) {
      // معالجة الأخطاء
      console.error("Error loading user details:", error);

      // استخدم البيانات المتاحة في حالة الخطأ
      setEditingUser({
        id: user.id,
        name: user.name || "",
        phone: user.email || "",
        email: "",
        level: "L1",
        goal: "",
        birthDate: "",
        password: "",
        role: user.role,
        trainerId: "",
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateUser = async () => {
    try {
      // التحقق من وجود بيانات التعديل
      if (!editingUser || !editingUser.id) {
        return;
      }

      // تحضير البيانات للإرسال
      const updateData = {
        name: editingUser.name?.trim(),
        phone: editingUser.phone?.trim(),
        email: editingUser.email?.trim(),
        level: editingUser.level,
        goal: editingUser.goal?.trim(),
        birthDate: editingUser.birthDate,
        role: editingUser.role,
        ...(editingUser.password &&
          editingUser.password.trim() && {
            password: editingUser.password.trim(),
          }),
        ...(editingUser.trainerId && { trainerId: editingUser.trainerId }),
      };

      // التحقق من صحة البيانات
      const validation = validateUserData(updateData, false);
      if (!validation.isValid) {
        return;
      }

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
        // إعادة تحميل قائمة المستخدمين
        await fetchUsers();

        // إغلاق النافذة وإعادة تعيين البيانات
        setShowEditModal(false);
        setEditingUser(null);

        toast.success("تم تحديث بيانات المستخدم بنجاح ✅");
      } else {
        const errorMessage =
          updateRes.error ||
          updateRes.message ||
          "حدث خطأ في تحديث بيانات المستخدم";
        toast.error(`فشل في التحديث: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("حدث خطأ في تحديث بيانات المستخدم");
    }
  };

  const handleAddUser = async () => {
    try {
      setIsAddingUser(true); // بدء التحميل

      // تحضير البيانات للإرسال
      const userData = {
        name: newUser.name.trim(),
        phone: newUser.phone.trim(),
        password: newUser.password,
        level: newUser.level,
        role: newUser.role,
        // إضافة trainerId إذا كان المستخدم عادي وتم اختيار مدرب
        ...(newUser.role === "USER" &&
          selectedTrainerForNewUser && {
            trainerId: selectedTrainerForNewUser,
          }),
      };

      // التحقق من صحة البيانات
      const validation = validateUserData(userData, true);
      if (!validation.isValid) {
        return;
      }

      // التحقق من اختيار المدرب للمستخدم العادي
      if (newUser.role === "USER" && !selectedTrainerForNewUser) {
        return;
      }

      let addUserRes;

      if (newUser.role === "TRAINER") {
        // إرسال بيانات المدرب إلى endpoint المدربين
        addUserRes = await apiClient.post(
          API_ENDPOINTS.ADMIN.TRAINERS.CREATE,
          userData
        );
      } else {
        // إرسال بيانات المستخدم العادي إلى endpoint المستخدمين
        addUserRes = await apiClient.post(
          API_ENDPOINTS.ADMIN.USERS.CREATE,
          userData
        );
      }

      if (addUserRes.success) {
        // نجح إنشاء المستخدم
        await fetchUsers(); // إعادة تحميل قائمة المستخدمين
        setShowAddModal(false);
        setNewUser({
          name: "",
          phone: "",
          password: "",
          trainerId: "",
          level: "",
          goal: "",
          birthDate: "",
          email: "",
          role: "USER",
        });

        toast.success(
          `تم إضافة ${
            newUser.role === "TRAINER" ? "المدرب" : "المستخدم"
          } بنجاح${
            newUser.role === "USER" && selectedTrainerForNewUser
              ? " وربطه بالمدرب المختار"
              : ""
          }`
        );
      } else {
        const errorMessage =
          addUserRes.error || addUserRes.message || "حدث خطأ غير معروف";
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast.error("حدث خطأ في إضافة المستخدم");
    } finally {
      setIsAddingUser(false); // إنهاء التحميل
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  إجمالي المستخدمين
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {users.length}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  المستخدمون المفعلون
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {users.filter((u) => u.isActive).length}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  المدراء
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {users.filter((u) => u.role === "ADMIN").length}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3">
                <span className="text-2xl">👑</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  المدربون
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {users.filter((u) => u.role === "TRAINER").length}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3">
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(true);
                    // تحميل المدربين عند فتح النافذة
                    fetchAvailableTrainers();
                  }}
                  className="w-full xl:w-auto bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-semibold py-3 px-6 sm:px-8 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2 sm:gap-3 whitespace-nowrap"
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
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                  >
                    <span>✅</span>
                    <span>تفعيل المحددين</span>
                  </button>
                  <button
                    onClick={handleBulkDeactivate}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                  >
                    <span>⏸️</span>
                    <span>إلغاء تفعيل</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
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
                            {user.role === "USER" && (
                              <button
                                onClick={() =>
                                  navigate(`/admin/students/${user.id}`)
                                }
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mt-1"
                              >
                                عرض التفاصيل →
                              </button>
                            )}
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
                          className="flex-1 bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-500 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                        >
                          <span>✏️</span>
                          <span>تعديل</span>
                        </button>
                        {user.isActive ? (
                          <button
                            onClick={() => handleDeactivateUser(user.id)}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                          >
                            <span>⏸️</span>
                            <span>إلغاء تفعيل</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                          >
                            <span>✅</span>
                            <span>تفعيل</span>
                          </button>
                        )}
                        {user.role === "USER" && (
                          <>
                            {user.trainerId ? (
                              <button
                                onClick={() => handleRemoveTrainer(user.id)}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                                title="إزالة ربط المدرب"
                              >
                                <span>🚫</span>
                                <span>إزالة المدرب</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openAssignTrainerModal(user)}
                                className="flex-1 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                                title="ربط بمدرب"
                              >
                                <span>👨‍🏫</span>
                                <span>ربط بمدرب</span>
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
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
                                {user.role === "USER" && (
                                  <button
                                    onClick={() =>
                                      navigate(`/admin/students/${user.id}`)
                                    }
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mt-1"
                                  >
                                    عرض التفاصيل →
                                  </button>
                                )}
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
                                className="w-full sm:w-auto bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-500 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-1 sm:gap-2"
                              >
                                <span className="text-sm">✏️</span>
                                <span className="hidden sm:inline">تعديل</span>
                              </button>
                              {user.isActive ? (
                                <button
                                  onClick={() => handleDeactivateUser(user.id)}
                                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-1 sm:gap-2"
                                >
                                  <span className="text-sm">⏸️</span>
                                  <span className="hidden sm:inline">
                                    إلغاء تفعيل
                                  </span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivateUser(user.id)}
                                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-1 sm:gap-2"
                                >
                                  <span className="text-sm">✅</span>
                                  <span className="hidden sm:inline">
                                    تفعيل
                                  </span>
                                </button>
                              )}
                              {user.role === "USER" && (
                                <>
                                  {user.trainerId ? (
                                    <button
                                      onClick={() =>
                                        handleRemoveTrainer(user.id)
                                      }
                                      className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-1 sm:gap-2"
                                      title="إزالة ربط المدرب"
                                    >
                                      <span className="text-sm">🚫</span>
                                      <span className="hidden sm:inline">
                                        إزالة المدرب
                                      </span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        openAssignTrainerModal(user)
                                      }
                                      className="w-full sm:w-auto bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-1 sm:gap-2"
                                      title="ربط بمدرب"
                                    >
                                      <span className="text-sm">👨‍🏫</span>
                                      <span className="hidden sm:inline">
                                        ربط بمدرب
                                      </span>
                                    </button>
                                  )}
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-1 sm:gap-2"
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
            <div className="bg-gray-900 dark:bg-gray-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">إضافة مستخدم جديد</h3>
                  <p className="text-blue-100">أضف مستخدم جديد إلى المنصة</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedTrainerForNewUser(""); // إعادة تعيين المدرب المختار
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
                  handleAddUser();
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-white">
                      الاسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-right shadow-inner"
                      placeholder="Enter user name (English only)"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-white">
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
                    <label className="block text-sm font-bold text-gray-700 dark:text-white">
                      كلمة المرور <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
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
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 focus:outline-none"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword
                            ? "إخفاء كلمة المرور"
                            : "إظهار كلمة المرور"
                        }
                      >
                        {showPassword ? (
                          // Eye Off Icon
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.234.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.062-4.675A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.675-.938M3 3l18 18"
                            />
                          </svg>
                        ) : (
                          // Eye Icon
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7 0c0 5-4.03 9-9 9s-9-4-9-9 4.03-9 9-9 9 4 9 9z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-white">
                      الدور <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => {
                        setNewUser({ ...newUser, role: e.target.value });
                        // إعادة تعيين المدرب المختار عند تغيير الدور
                        if (e.target.value !== "USER") {
                          setSelectedTrainerForNewUser("");
                        }
                      }}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-right shadow-inner"
                    >
                      <option value="USER">مستخدم عادي (طالب)</option>
                      <option value="TRAINER">مدرب</option>
                      <option value="ADMIN">مدير</option>
                    </select>
                    {newUser.role === "TRAINER" && (
                      <div className="mt-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                          <span className="text-lg">💪</span>
                          <span className="text-sm font-semibold">
                            سيتم إنشاء حساب مدرب مع صلاحيات إدارة الطلاب
                          </span>
                        </div>
                      </div>
                    )}
                    {newUser.role === "USER" && (
                      <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                          <span className="text-lg">👤</span>
                          <span className="text-sm font-semibold">
                            سيتم إنشاء حساب طالب وربطه بالمدرب المختار
                          </span>
                        </div>
                      </div>
                    )}
                    {newUser.role === "ADMIN" && (
                      <div className="mt-2 p-3 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200 dark:border-rose-700 rounded-lg">
                        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
                          <span className="text-lg">👑</span>
                          <span className="text-sm font-semibold">
                            سيتم إنشاء حساب مدير مع صلاحيات كاملة على النظام
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* اختيار المدرب للمستخدم العادي */}
                  {newUser.role === "USER" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-white">
                        المستوى <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newUser.level}
                        onChange={(e) =>
                          setNewUser({ ...newUser, level: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-right shadow-inner"
                        required
                      >
                        {levels.map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.name}
                          </option>
                        ))}
                      </select>

                      <label className="block text-sm font-bold text-gray-700 dark:text-white">
                        المدرب المسؤول <span className="text-red-500">*</span>
                      </label>
                      {isLoadingTrainers ? (
                        <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                          <Loading
                            variant="video"
                            size="xl"
                            text="جاري تحميل بيانات المستخدمين..."
                            isOverlay
                          />
                        </div>
                      ) : (
                        <select
                          value={selectedTrainerForNewUser}
                          onChange={(e) =>
                            setSelectedTrainerForNewUser(e.target.value)
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-right shadow-inner"
                          required
                        >
                          <option value="">اختر المدرب المسؤول</option>
                          {availableTrainers.map((trainer) => (
                            <option key={trainer.id} value={trainer.id}>
                              {trainer.name} - {trainer.phone} (عدد الطلاب:{" "}
                              {trainer.studentsCount || 0})
                            </option>
                          ))}
                        </select>
                      )}

                      {availableTrainers.length === 0 && !isLoadingTrainers && (
                        <div className="mt-2 p-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                            <span className="text-lg">⚠️</span>
                            <span className="text-sm font-semibold">
                              لا يوجد مدربون متاحون. يجب إنشاء مدرب أولاً.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="submit"
                    disabled={isAddingUser}
                    className={`flex-1 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-3 ${
                      isAddingUser ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isAddingUser ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>جاري الإضافة...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">➕</span>
                        <span>إضافة المستخدم</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isAddingUser}
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedTrainerForNewUser(""); // إعادة تعيين المدرب المختار
                    }}
                    className={`flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-3 ${
                      isAddingUser ? "opacity-50 cursor-not-allowed" : ""
                    }`}
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
            <div className="bg-gray-900 dark:bg-gray-800 text-white p-6">
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
                onSubmit={async (e) => {
                  e.preventDefault();

                  // التحقق من البيانات قبل الإرسال
                  if (!editingUser?.name?.trim()) {
                    return;
                  }

                  if (!editingUser?.phone?.trim()) {
                    return;
                  }

                  // إرسال البيانات
                  await handleUpdateUser();
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-white">
                      الاسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingUser.name || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, name: e.target.value })
                      }
                      className="w-full px-4 py-3  bg-black dark:bg-white border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-right shadow-inner"
                      placeholder="Enter user name (English only)"
                      required
                      minLength={2}
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-white">
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={editingUser.phone || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3  bg-black dark:bg-white border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-right shadow-inner"
                      placeholder="أدخل رقم الهاتف"
                      required
                      minLength={9}
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-white">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={editingUser.email || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3  bg-black dark:bg-white border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-right shadow-inner"
                      placeholder="أدخل البريد الإلكتروني"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-white">
                      المستوى
                    </label>
                    <select
                      value={editingUser.level}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          level: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3  bg-black dark:bg-white border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-right shadow-inner"
                    >
                      <option value="L1">مبتدئ (L1)</option>
                      <option value="L2">متوسط (L2)</option>
                      <option value="L3">متقدم (L3)</option>
                      <option value="L4">متقدم (L4)</option>
                      <option value="L5">متقدم (L5)</option>
                      <option value="L6">متقدم (L6)</option>
                      <option value="L7">متقدم (L7)</option>
                      <option value="L8">متقدم (L8)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-white">
                      الهدف
                    </label>
                    <input
                      type="text"
                      value={editingUser.goal || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          goal: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3  bg-black dark:bg-white border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-right shadow-inner"
                      placeholder="أدخل هدف التعلم"
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-white">
                      تاريخ الميلاد
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(editingUser.birthDate)}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          birthDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3  bg-black dark:bg-white border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-right shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-white">
                      كلمة المرور الجديدة (اختياري)
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? "text" : "password"}
                        value={editingUser.password || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3  bg-black dark:bg-white border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-right shadow-inner"
                        placeholder="اتركها فارغة إذا لم ترد تغييرها"
                        minLength={8}
                        maxLength={10}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 focus:outline-none"
                        onClick={() => setShowEditPassword((prev) => !prev)}
                        aria-label={
                          showEditPassword
                            ? "إخفاء كلمة المرور"
                            : "إظهار كلمة المرور"
                        }
                      >
                        {showEditPassword ? (
                          // Eye Off Icon
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.234.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.062-4.675A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.675-.938M3 3l18 18"
                            />
                          </svg>
                        ) : (
                          // Eye Icon
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7 0c0 5-4.03 9-9 9s-9-4-9-9 4.03-9 9-9 9 4 9 9z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="submit"
                    disabled={
                      !editingUser?.name?.trim() || !editingUser?.phone?.trim()
                    }
                    className={`flex-1 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-3 ${
                      !editingUser?.name?.trim() || !editingUser?.phone?.trim()
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
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
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-3"
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

      {/* Assign Trainer Modal */}
      {showAssignTrainerModal && selectedUserForTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-900 dark:bg-gray-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    ربط المستخدم بمدرب
                  </h3>
                  <p className="text-blue-100">
                    ربط {selectedUserForTrainer.name} بمدرب
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignTrainerModal(false);
                    setSelectedUserForTrainer(null);
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
              {isLoadingTrainers ? (
                <Loading
                  variant="dots"
                  size="xl"
                  text="جاري تحميل المدربين..."
                  isOverlay
                />
              ) : availableTrainers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4 opacity-50">👨‍🏫</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    لا يوجد مدربون متاحون
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    يجب إنشاء مدربين أولاً قبل ربط المستخدمين
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👤</span>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                          المستخدم المحدد
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedUserForTrainer.name} -{" "}
                          {selectedUserForTrainer.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">
                      اختر المدرب:
                    </h4>
                    <div className="grid gap-3">
                      {availableTrainers.map((trainer) => (
                        <div
                          key={trainer.id}
                          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 cursor-pointer"
                          onClick={() =>
                            handleAssignTrainer(
                              selectedUserForTrainer.id,
                              trainer.id
                            )
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-lg shadow-lg">
                                {trainer.name.charAt(0)}
                              </div>
                              <div>
                                <h5 className="font-bold text-gray-900 dark:text-white">
                                  {trainer.name}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {trainer.phone}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                                  عدد الطلاب: {trainer.studentsCount || 0}
                                </p>
                              </div>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
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
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
