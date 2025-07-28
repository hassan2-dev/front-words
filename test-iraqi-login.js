// Test Iraqi Phone Number Login
// اختبار تسجيل الدخول بأرقام الهواتف العراقية

const testUsers = [
  {
    name: "أحمد محمد",
    phone: "+964700123456",
    password: "123456",
  },
  {
    name: "فاطمة علي",
    phone: "+964701234567",
    password: "123456",
  },
  {
    name: "محمد حسن",
    phone: "+964702345678",
    password: "123456",
  },
];

// Test different Iraqi phone number formats
const testFormats = [
  "+964700123456", // International format
  "964700123456", // Without +
  "0700123456", // Local format
];

async function testLogin(phone, password) {
  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phone,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log(`✅ تسجيل الدخول ناجح لـ ${phone}:`, {
        success: data.success,
        message: data.message,
        token: data.data?.token ? "موجود" : "غير موجود",
        user: data.data?.user ? data.data.user.name : "غير موجود",
        level: data.data?.user?.level || "غير محدد",
        experience: data.data?.user?.experience || "غير محدد",
      });
      return data;
    } else {
      console.log(
        `❌ فشل تسجيل الدخول لـ ${phone}:`,
        data.message || data.error
      );
      return null;
    }
  } catch (error) {
    console.log(`❌ خطأ في الاتصال لـ ${phone}:`, error.message);
    return null;
  }
}

async function testRegister(name, phone, password) {
  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        phone: phone,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log(`✅ تسجيل مستخدم جديد ناجح لـ ${phone}:`, {
        success: data.success,
        message: data.message,
        token: data.data?.token ? "موجود" : "غير موجود",
        user: data.data?.user ? data.data.user.name : "غير موجود",
        level: data.data?.user?.level || "غير محدد",
        experience: data.data?.user?.experience || "غير محدد",
      });
      return data;
    } else {
      console.log(
        `❌ فشل تسجيل مستخدم جديد لـ ${phone}:`,
        data.message || data.error
      );
      return null;
    }
  } catch (error) {
    console.log(`❌ خطأ في الاتصال لـ ${phone}:`, error.message);
    return null;
  }
}

async function testUserProfile(token) {
  if (!token) {
    console.log("❌ لا يوجد توكن لاختبار الملف الشخصي");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ جلب الملف الشخصي ناجح:`, {
        user: data.user ? data.user.name : "غير موجود",
        level: data.user?.level || "غير محدد",
        experience: data.user?.experience || "غير محدد",
        streak: data.user?.streak || "غير محدد",
        totalWords: data.user?.totalWords || "غير محدد",
      });
      return data;
    } else {
      console.log(`❌ فشل جلب الملف الشخصي:`, data.message || data.error);
      return null;
    }
  } catch (error) {
    console.log(`❌ خطأ في الاتصال:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log("🚀 بدء اختبار أرقام الهواتف العراقية...\n");

  // Test 1: Login with existing users
  console.log("📱 اختبار تسجيل الدخول بالمستخدمين الموجودين:");
  let loginResults = [];
  for (const user of testUsers) {
    const result = await testLogin(user.phone, user.password);
    if (result && result.data?.token) {
      loginResults.push({
        user: user.name,
        token: result.data.token,
        userData: result.data.user,
      });
    }
  }

  // Test 2: Test user profile with tokens
  console.log("\n👤 اختبار جلب الملف الشخصي:");
  for (const result of loginResults) {
    console.log(`\n--- ملف ${result.user} ---`);
    await testUserProfile(result.token);
  }

  console.log("\n📝 اختبار تسجيل مستخدمين جدد بأرقام مختلفة:");

  // Test 3: Register new users with different formats
  const newUsers = [
    {
      name: "علي أحمد",
      phone: "+964703456789",
      password: "123456",
    },
    {
      name: "سارة محمد",
      phone: "964704567890",
      password: "123456",
    },
    {
      name: "حسن علي",
      phone: "0705678901",
      password: "123456",
    },
  ];

  for (const user of newUsers) {
    await testRegister(user.name, user.phone, user.password);
  }

  console.log("\n✅ انتهى الاختبار!");
  console.log("\n📊 ملخص النتائج:");
  console.log(
    `- عدد تسجيلات الدخول الناجحة: ${loginResults.length}/${testUsers.length}`
  );
  console.log(`- عدد المستخدمين الجدد: ${newUsers.length}`);
}

// Run tests if this file is executed directly
if (typeof window === "undefined") {
  runTests().catch(console.error);
}

export { testLogin, testRegister, testUserProfile, testUsers, testFormats };
