# تفعيل حسابات قدّها

بنية الحسابات موجودة في التطبيق وتبقى معطلة تلقائيًا حتى تتوفر إعدادات Supabase.

## متغيرات Vercel

- `VITE_SUPABASE_URL`: رابط مشروع Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: المفتاح العام القابل للنشر. يدعم التطبيق مؤقتًا الاسم القديم `VITE_SUPABASE_ANON_KEY` أيضًا.

لا يوضع مفتاح `service_role` أو أي مفتاح سري في تطبيق الويب.

## إعداد المصادقة

1. فعّل تسجيل البريد وكلمة المرور في Supabase Auth.
2. اجعل Site URL هو `https://qaddha.vercel.app`.
3. أضف رابط الموقع إلى قائمة Redirect URLs لاستعادة كلمة المرور وOAuth.
4. لتفعيل Google، أضف Client ID وClient Secret داخل لوحة Supabase فقط، ثم فعّل Google provider.
5. أضف المتغيرين إلى Production وPreview في Vercel، ثم أعد النشر.

بعد الربط ستظهر أزرار الدخول وإنشاء الحساب والاستعادة والخروج تلقائيًا داخل ملف اللاعب، بينما يظل وضع الضيف متاحًا.
