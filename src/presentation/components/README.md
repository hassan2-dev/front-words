# Loading Component

مكون تحميل شامل ومتعدد الاستخدامات مع جميع الخيارات في مكون واحد.

## الاستخدام

```tsx
import { Loading } from '@/presentation/components';

// تحميل بسيط
<Loading size="md" />

// تحميل مع فيديو
<Loading variant="video" size="lg" text="جاري التحميل..." />

// تحميل كطبقة فوقية
<Loading isOverlay={true} variant="video" size="xl" text="جاري تحميل البيانات..." />
```

## الخصائص

### الأساسية

- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (افتراضي: 'md')
- `variant`: 'default' | 'video' | 'dots' | 'pulse' (افتراضي: 'default')
- `text`: string (اختياري) - نص يظهر تحت التحميل
- `className`: string (اختياري) - classes إضافية

### الطبقة فوقية

- `isOverlay`: boolean (افتراضي: false) - لجعل التحميل كطبقة فوقية
- `backdrop`: boolean (افتراضي: true) - إظهار خلفية شفافة

## أمثلة الاستخدام

### 1. تحميل بسيط

```tsx
<Loading size="lg" />
```

### 2. تحميل مع فيديو

```tsx
<Loading variant="video" size="xl" text="جاري تحميل البيانات..." />
```

### 3. تحميل بنقاط متحركة

```tsx
<Loading variant="dots" text="Loading..." />
```

### 4. تحميل نبض

```tsx
<Loading variant="pulse" size="lg" />
```

### 5. طبقة تحميل كاملة

```tsx
<Loading
  isOverlay={true}
  variant="video"
  size="xl"
  text="جاري معالجة الطلب..."
/>
```

### 6. طبقة تحميل بدون خلفية

```tsx
<Loading
  isOverlay={true}
  backdrop={false}
  variant="video"
  size="lg"
  text="جاري التحميل..."
/>
```

## الأنواع المختلفة

1. **default**: دوارة تحميل كلاسيكية
2. **video**: فيديو داخل دائرة مع حدود متحركة
3. **dots**: ثلاث نقاط متحركة
4. **pulse**: نبض دائري متدرج

## الأحجام المتاحة

- `xs`: 32px
- `sm`: 48px
- `md`: 64px
- `lg`: 80px
- `xl`: 96px

## الاستخدام في المشروع

```tsx
// في أي صفحة
import { Loading } from "@/presentation/components";

const MyPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      {/* محتوى الصفحة */}

      {/* طبقة تحميل */}
      {isLoading && (
        <Loading
          isOverlay={true}
          variant="video"
          size="xl"
          text="جاري تحميل البيانات..."
        />
      )}
    </div>
  );
};
```
