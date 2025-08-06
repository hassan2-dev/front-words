# نظام تعلم اللغة الإنجليزية - Let's Speak AI

## نظرة عامة

نظام تعلم اللغة الإنجليزية المتقدم الذي يستخدم الذكاء الاصطناعي لتوفير تجربة تعليمية شخصية ومتطورة. النظام مصمم لمساعدة الطلاب على تعلم اللغة الإنجليزية من خلال القصص التفاعلية والكلمات اليومية والدردشة مع الذكاء الاصطناعي.

## الميزات الرئيسية

### 🎯 الكلمات اليومية

- كلمات مخصصة حسب مستوى المستخدم
- جمل أمثلة محسنة لكل كلمة
- تتبع التقدم في تعلم الكلمات
- إمكانية إضافة كلمات خاصة

### 📚 القصص التفاعلية

- قصص يومية مخصصة
- ترجمة عربية دقيقة
- كلمات مميزة بألوان مختلفة
- إمكانية الاستماع للقصة
- اختبارات تفاعلية

### 🤖 الدردشة مع الذكاء الاصطناعي

- محادثة ذكية لتعلم اللغة
- مساعدة في النطق والقواعد
- إجابة على الأسئلة
- تخصيص المحتوى حسب المستوى

### 🏆 نظام الإنجازات

- تتبع التقدم والإنجازات
- نقاط وجوائز
- قائمة المتصدرين
- إشعارات التحفيز

### 📊 لوحة التحكم

- إحصائيات مفصلة
- تتبع التقدم
- تحليل الأداء
- توصيات ذكية

## التقنيات المستخدمة

### الواجهة الأمامية

- **React 18** - مكتبة واجهة المستخدم
- **TypeScript** - لكتابة كود آمن ومنظم
- **Tailwind CSS** - لتصميم سريع وجميل
- **Vite** - أداة بناء سريعة
- **React Router** - للتنقل بين الصفحات

### الخدمات الخلفية

- **Node.js** - بيئة تشغيل JavaScript
- **Express.js** - إطار عمل الويب
- **Prisma** - ORM لقاعدة البيانات
- **PostgreSQL** - قاعدة البيانات
- **JWT** - للمصادقة

### الذكاء الاصطناعي

- **OpenAI API** - لتوليد المحتوى
- **Azure Cognitive Services** - للترجمة والنطق
- **Custom AI Models** - لتحليل المستوى والتوصيات

## البداية السريعة

### متطلبات النظام

- Node.js 18+
- npm أو yarn
- PostgreSQL 14+

### التثبيت

1. **استنساخ المشروع**

```bash
git clone https://github.com/your-username/letspeak-ai.git
cd letspeak-ai/front
```

2. **تثبيت التبعيات**

```bash
npm install
```

3. **إعداد متغيرات البيئة**

```bash
cp .env.example .env
```

تعديل ملف `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Let's Speak AI
```

4. **تشغيل التطبيق**

```bash
npm run dev
```

التطبيق سيعمل على `http://localhost:5173`

## هيكل المشروع

```
front/
├── src/
│   ├── core/
│   │   ├── config/          # إعدادات التطبيق
│   │   ├── constants/       # الثوابت
│   │   ├── guards/          # حماية المسارات
│   │   ├── hooks/           # React Hooks مخصصة
│   │   ├── providers/       # Context Providers
│   │   ├── types/           # TypeScript Types
│   │   └── utils/           # أدوات مساعدة
│   ├── features/
│   │   ├── auth/            # المصادقة
│   │   ├── dashboard/       # لوحة التحكم
│   │   ├── daily-words/     # الكلمات اليومية
│   │   ├── stories/         # القصص
│   │   ├── chat-with-ai/    # الدردشة مع الذكاء الاصطناعي
│   │   ├── achievements/    # الإنجازات
│   │   ├── notifications/   # الإشعارات
│   │   ├── profile/         # الملف الشخصي
│   │   ├── admin/           # لوحة الإدارة
│   │   └── trainer/         # لوحة المدرب
│   └── presentation/
│       ├── layouts/         # تخطيطات الصفحات
│       └── styles/          # الأنماط
├── public/                  # الملفات العامة
└── docs/                    # التوثيق
```

## نقاط النهاية الرئيسية

### المصادقة

- `POST /auth/login` - تسجيل الدخول
- `POST /auth/register` - التسجيل
- `GET /auth/me` - معلومات المستخدم

### الكلمات

- `GET /words/all` - جلب جميع الكلمات
- `POST /words` - إضافة كلمة جديدة
- `POST /words/{word}/learn` - تعليم كلمة
- `GET /words/learned` - الكلمات المتعلمة

### القصص

- `GET /stories/daily/story` - القصة اليومية
- `POST /stories/daily/story/generate` - توليد قصة جديدة
- `POST /stories/daily/story/complete` - إكمال القصة

### الذكاء الاصطناعي

- `POST /ai/generate/story-from-words` - توليد قصة من كلمات
- `POST /chat/send` - إرسال رسالة للذكاء الاصطناعي
- `GET /ai/remaining-requests` - الطلبات المتبقية

## كيفية الاستخدام

### 1. تسجيل الدخول

```typescript
import { login } from "@/core/utils/api";

const handleLogin = async (phone: string, password: string) => {
  const response = await login({ phone, password });
  if (response.success) {
    // تخزين token وتوجيه المستخدم
    localStorage.setItem("token", response.data.access_token);
    navigate("/dashboard");
  }
};
```

### 2. جلب الكلمات اليومية

```typescript
import { getDailyWords } from "@/core/utils/api";

const fetchDailyWords = async () => {
  const response = await getDailyWords();
  if (response.success) {
    setWords(response.data.words);
  }
};
```

### 3. توليد قصة يومية

```typescript
import { generateDailyStory } from "@/core/utils/api";

const generateStory = async () => {
  const response = await generateDailyStory({
    publicWords: userPublicWords,
    privateWords: userPrivateWords,
    userName: user.name,
    level: user.level,
  });

  if (response.success) {
    setCurrentStory(response.data);
  }
};
```

### 4. الدردشة مع الذكاء الاصطناعي

```typescript
import { sendChatMessage } from "@/core/utils/api";

const sendMessage = async (message: string) => {
  const response = await sendChatMessage({
    message,
    type: "learning",
    language: "en",
    context: "user is learning English",
  });

  if (response.success) {
    addMessageToChat(response.data);
  }
};
```

## تخصيص النظام

### إضافة كلمات جديدة

```typescript
import { addWord } from "@/core/utils/api";

const addNewWord = async (word: string, meaning: string) => {
  const response = await addWord({ word, meaning });
  if (response.success) {
    showNotification("تم إضافة الكلمة بنجاح", "success");
  }
};
```

### تخصيص القصص

```typescript
import { enhanceStory } from "@/core/utils/storyEnhancer";

const customizeStory = (story: DailyStory) => {
  const enhancedStory = enhanceStory(story);
  return enhancedStory;
};
```

### إضافة إنجازات جديدة

```typescript
import { addAchievement } from "@/core/utils/api";

const createAchievement = async (achievement: Achievement) => {
  const response = await addAchievement(achievement);
  if (response.success) {
    showNotification("تم إضافة الإنجاز بنجاح", "success");
  }
};
```

## إدارة الحالة

### استخدام Context

```typescript
import { useAuth } from "@/core/providers/AuthProvider";
import { useTheme } from "@/core/providers/ThemeProvider";

const MyComponent = () => {
  const { user, isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // استخدام الحالة
};
```

### إدارة التخزين المحلي

```typescript
import { STORAGE_KEYS } from "@/core/constants/app";

// حفظ البيانات
localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

// استرجاع البيانات
const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
```

## الأمان

### حماية المسارات

```typescript
import { ProtectedRoute } from "@/core/guards/ProtectedRoute";

// في App.tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>;
```

### التحقق من الصلاحيات

```typescript
import { RoleBasedRoute } from "@/core/guards/RoleBasedRoute";

<Route
  path="/admin"
  element={
    <RoleBasedRoute allowedRoles={["ADMIN"]}>
      <AdminPage />
    </RoleBasedRoute>
  }
/>;
```

## الاختبار

### تشغيل الاختبارات

```bash
npm run test
```

### اختبار المكونات

```bash
npm run test:components
```

### اختبار الوحدة

```bash
npm run test:unit
```

## البناء والنشر

### بناء الإنتاج

```bash
npm run build
```

### معاينة البناء

```bash
npm run preview
```

### النشر

```bash
npm run deploy
```

## المساهمة

### إعداد بيئة التطوير

1. Fork المشروع
2. إنشاء branch جديد
3. إجراء التغييرات
4. إرسال Pull Request

### معايير الكود

- استخدام TypeScript
- اتباع ESLint rules
- كتابة تعليقات واضحة
- اختبار الكود قبل الإرسال

## الدعم والمساعدة

### التوثيق

- [دليل نقاط النهاية](API_ENDPOINTS_DOCUMENTATION.md)
- [دليل دمج الذكاء الاصطناعي](AI_INTEGRATION_GUIDE.md)
- [دليل المطورين](DEVELOPER_GUIDE.md)

### التواصل

- **البريد الإلكتروني**: support@letspeak.ai
- **GitHub Issues**: للإبلاغ عن الأخطاء
- **Discord**: للمناقشات والمجتمع

## الترخيص

هذا المشروع مرخص تحت رخصة MIT. راجع ملف [LICENSE](LICENSE) للتفاصيل.

## الشكر والتقدير

- فريق OpenAI لتوفير API الذكاء الاصطناعي
- مجتمع React للدعم المستمر
- جميع المساهمين في المشروع

---

**ملاحظة**: هذا النظام في مرحلة التطوير النشط. قد تحدث تغييرات في API والوظائف. يرجى مراجعة التوثيق للحصول على أحدث المعلومات.
