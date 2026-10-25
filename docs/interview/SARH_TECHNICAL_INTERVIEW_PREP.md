# 🎯 الدليل الشامل والجاهز للمقابلة التقنية — شركة SARH Business Solutions
### مرشح الوظيفة: مؤمن هشام (Momen Hesham)
### الوظيفة: Full Stack Developer (React / Node.js)
### المقابلة: 30 دقيقة عبر Microsoft Teams

---

## 📌 فهرس المحتويات السريع
1. [خطة إدارة الـ 30 دقيقة (Interview Time Strategy)](#1-خطة-إدارة-الـ-30-دقيقة)
2. [طريقة استعراض الحل على الشاشة (Screen Walkthrough Flow)](#2-طريقة-استعراض-الحل-على-الشاشة)
3. [الأسئلة التقنية المتوقعة وإجاباتها النموذجية (Technical Q&A)](#3-الأسئلة-التقنية-المتوقعة-وإجاباتها-النموذجية)
   - [R1: التعامل مع تصفح والفلترة السريعة وتجنب الـ Race Conditions](#r1-race-conditions-and-rapid-filtering)
   - [R1: تقنية Keyset Pagination مقابل Offset/Limit](#r1-keyset-pagination-vs-offsetlimit)
   - [R1: محرك البحث FTS5 Trigram و الـ Fallback](#r1-fts5-trigram-search)
   - [R2: ضمان عدم تكرار الطلبات (Idempotency Key & Transactions)](#r2-idempotency-key--concurrency-proof)
   - [إثبات التزامن باختبار عمليتين منفصلتين (npm test Proof)](#npm-test-proof)
   - [مراجعة كود المقاول وحل الثغرات الـ 12 (Security Review)](#security-review-contractors-code)
   - [حماية التعديل المتزامن (Optimistic Locking & Versions)](#optimistic-locking-versioning)
   - [سؤال إدارة المنتج: حذف كل الطلبات الملغاة (Product Question)](#product-question-delete-cancelled-orders)
   - [القرارات المعمارية وقابلية التوسع (SQLite vs Postgres)](#architecture--scalability)
   - [استخدام الذكاء الاصطناعي بكل أمانة واحترافية (AI Disclosure)](#ai-disclosure--pair-programming)
4. [السيناريوهات العملية للتعديل الحي على الكود (Live Coding Scenarios)](#4-التعديلات-الحية-المحتملة-على-الكود-live-coding)
   - [السيناريو 1: إضافة حقل جديد للطلب (مثل Notes أو Phone Number)](#السيناريو-1-إضافة-حقل-جديد-للطلب-notes-أو-phone)
   - [السيناريو 2: إضافة حالة طلب جديدة (New Order Status مثل "processing" أو "refunded")](#السيناريو-2-إضافة-حالة-طلب-جديدة-order-status)
   - [السيناريو 3: زر إجراء سريع (Quick Action مثل إلغاء الطلب Cancel Order مباشرة من الجدول)](#السيناريو-3-زر-إجراء-سريع-quick-cancel-من-الجدول)
   - [السيناريو 4: تصدير البيانات إلى ملف CSV (Export to CSV)](#السيناريو-4-تصدير-البيانات-إلى-csv)
   - [السيناريو 5: إضافة فلترة بتاريخ محدد (Date Range Filter)](#السيناريو-5-فلترة-بنطاق-تاريخ-date-range)
   - [السيناريو 6: عمل Endpoint للإحصائيات السريعة (O1: Quick Stats Endpoint)](#السيناريو-6-إضافة-endpoint-للإحصائيات-stats)
5. [نصائح اللحظات الأخيرة قبل بدء المكالمة (Checklist)](#5-نصائح-اللحظات-الأخيرة-checklist)

---

## 1. خطة إدارة الـ 30 دقيقة

مدة المقابلة 30 دقيقة فقط، وهي مدة سريعة جداً. إدارة الوقت بثقة وهدوء هي نصف النجاح:

| الوقت | المرحلة | الهدف |
| :--- | :--- | :--- |
| **00:00 – 03:00** | الترحيب والمقدمة | كسر الجليد، تعريف سريع بنفسك وبخبرتك باختصار. |
| **03:00 – 12:00** | استعراض الحل (Walkthrough) | مشاركة الشاشة، تشغيل المشروع، شرح بنية النظام وأهم القرارات التقنية. |
| **12:00 – 22:00** | التعديل الحي على الكود (Live Change) | الاستماع لطلب المقابل بدقة، التفكير بصوت عالٍ، كتابة الكود بهدوء وتجربته. |
| **22:00 – 27:00** | مناقشة وتوضيح القرارات المعمارية | الإجابة عن أسباب اختيار الحلول والبدائل التي تم استبعادها. |
| **27:00 – 30:00** | أسئلتك للفريق والختام | إظهار اهتمامك بالشركة وبيئة العمل وإنهاء اللقاء بانطباع ممتاز. |

---

## 2. طريقة استعراض الحل على الشاشة

### قبل أن تبدأ:
1. افتح نافذتين في التيرمينال (Terminal):
   - نافذة لتشغيل السيرفرات: `npm run dev`
   - نافذة ثانية جاهزة لتشغيل الاختبارات: `npm test`
2. افتح المتصفح على الرابطين:
   - `http://localhost:5173/login`
   - افتح الـ DevTools (F12) على تبويب **Network**.
3. افتح محرّر الكود (VS Code) وكن مستعداً لعرض الملفات الأساسية.

### خطوات العرض بالترتيب (Pitch Flow):
1. **تسجيل الدخول والتنقل (Auth & Sessions):**
   - "أهلاً بكم، سأبدأ بتسجيل الدخول بحساب الـ Admin (`admin@orders.local`)."
   - أظهر أن التوكن محفوظ في `httpOnly Cookie` لحمايته من ثغرات XSS، وأن مسارات الـ API محمية بالكامل بـ `requireAuth` على مستوى السيرفر.
2. **استعراض المتطلبات R1 (Search, Filter, Virtualization):**
   - أظهر الفلترة السريعة وتغيير الـ Dropdown (من Paid إلى Cancelled إلى All).
   - "لدينا 50,000 طلب في قاعدة البيانات، ويتم جلب البيانات بـ **Keyset Pagination** (50 طلباً لكل دفعة)، والجدول مبني بتقنية **Virtualization** باستخدام `@tanstack/react-virtual`، لذلك المتصفح يرسم فقط الصفوف الظاهرة أمامه ولا يستهلك ذاكرة إطلاقاً."
   - أظهر مزامنة الـ URL: اكتب في البحث أو غير الحالة، وأظهر أن الرابط أصبح `/orders?q=...&status=...` وأن عمل Refresh يحافظ على نفس الصفحة والنتائج.
3. **إثبات تفادي الـ Race Conditions في الفلترة السريعة:**
   - افتح الـ Network Tab واشرح:
   - "عند تغيير الفلتر بسرعة، نستخدم **TanStack Query** بمفتاح استعلام يعتمد على الفلاتر `['orders', filters]`. هذا يضمن شيئين:
     1. أي استجابة متأخرة لفلتر قديم يتم تخزينها في مفتاحها القديم ولا تعرض على الشاشة إطلاقاً لأن الصفحة تقرأ فقط مفتاح الفلتر الحالي.
     2. نقوم بتمرير `AbortSignal` إلى `fetch`، فيقوم المتصفح بإلغاء الطلب القديم فوراً (`net::ERR_ABORTED`)."
4. **استعراض المتطلب R2 (Duplicate Prevention & Idempotency):**
   - افتح نافذة إنشاء طلب جديد (New Order Modal).
   - "كل نموذج إنشاء طلب يولد `Idempotency-Key` فريد (UUID) بمجرد فتح النموذج. إذا قام المستخدم بالضغط المزدوج (Double-click) أو انقطع الاتصال وتمت إعادة المحاولة تلقائياً، السيرفر يضمن إدخال سجل واحد فقط داخل معاملة `BEGIN IMMEDIATE` بالاعتماد على Unique Index في قاعدة البيانات."
5. **تشغيل اختبار التزامن الحي (`npm test`):**
   - انتقل للتيرمينال واكتب: `npm test`.
   - "هنا نقوم باختبار عملي قوي: نشغل عمليتين Express منفصلتين تماماً (Two Node.js Processes) متصلتين بنفس قاعدة البيانات، ونرسل نفس الطلب 20 مرة متزامنة إلى السيرفرين في نفس اللحظة، والنتيجة أن قاعدة البيانات تحتوي على طلب واحد فقط."

---

## 3. الأسئلة التقنية المتوقعة وإجاباتها النموذجية

---

### R1: Race Conditions and Rapid Filtering
#### س: كيف قمت بحل مشكلة الـ Race Conditions عندما يقوم المستخدم بتغيير الفلاتر بسرعة فائقة؟
**الإجابة النموذجية:**
> "المشكلة الكلاسيكية هي: إذا طلب المستخدم فلتر (A) ثم فلتر (B)، وقد تأخر رد (A) في الشبكة ووصل بعد (B)، فإنه قد يستبدل النتيجة الأحدث بنتيجة قديمة غير صحيحة.
> 
> قمت بحل ذلك عبر مستويين متكاملين:
> 1. **عزل البيانات معمارياً (Structural Guarantee) عبر TanStack Query:**
>    - مفتاح الاستعلام مربوط بحالة الفلاتر: `queryKey: ['orders', filters]`.
>    - المكون (Component) يقرأ حصرياً البيانات المرتبطة بالفلاتر الحالية النشطة. إذا وصل رد متأخر للفلتر السابق، فإنه يدخل في الكاش الخاص بالفلتر القديم، ولا يؤثر إطلاقاً على ما هو معروض أمام المستخدم.
> 2. **إلغاء الطلبات القديمة (Request Cancellation):**
>    - نمرر الـ `signal` القادم من React Query إلى دالة `fetch`. عند تغيير الفلتر، يتم إلغاء الطلب السابق في طبقة الشبكة فوراً (`AbortController`).
> 3. **إعادة تركيب الجدول (Key-based Remounting):**
>    - وضعنا `key={JSON.stringify(filters)}` على جدول الطلبات، مما يعيد تصفير موضع الـ Scroll ويجعل الـ Virtualizer يبدأ من أعلى الجدول بشكل نظيف."

---

### R1: Keyset Pagination vs Offset/Limit
#### س: لماذا اخترت Keyset Pagination بدلاً من Offset / Limit التقليدي؟
**الإجابة النموذجية:**
> "الاعتماد على `OFFSET` في الجداول الكبيرة (مثل 50,000 إلى ملايين السجلات) فيه عيبان قاتلان:
> 1. **الأداء المتدهور (Performance Degradation):** عند تنفيذ `OFFSET 10000 LIMIT 50`، محرك قاعدة البيانات يضطر لقراءة وفحص الـ 10,000 سجل والتخلص منها قبل إرجاع الـ 50 صفاً، مما يجعل استجابة الصفحة رقم 500 أبطأ بمئات المرات من الصفحة رقم 1.
> 2. **عدم دقة النتائج (Row Drift / Inconsistency):** إذا تمت إضافة طلب جديد أثناء تصفح المستخدم، فإن جميع السجلات تنزاح لأسفل بمقدار سجل واحد، فيرى المستخدم سجلاً مكرراً عند الانتقال للصفحة التالية.
> 
> **الحل بـ Keyset Pagination (Cursor-based):**
> - نعتمد على مؤشر مركب `(sort_value, id)`.
> - الاستعلام يبحث مباشرة باستخدام الـ Index: `WHERE (o.created_at, o.id) < (?, ?) ORDER BY o.created_at DESC, o.id DESC LIMIT 51`.
> - زمن الاستعلام يظل ثابتاً (~3ms) في الصفحة الأولى كما في الصفحة رقم 500، لأن المحرك يقوم بـ Index Range Scan مباشرة دون فحص السجلات السابقة."

---

### R1: FTS5 Trigram Search
#### س: كيف صممت البحث في الأسماء والإيميل؟ ولماذا احتجت إلى Trigram مع Fallback؟
**الإجابة النموذجية:**
> "البحث المطلوب هو بحث جزئي (Substring Search / Contains).
> 1. الـ B-Tree Index العادي في SQL لا يمكنه خدمة استعلام `LIKE '%term%'` لأن علامة `%` في البداية تجعل المحرك يقوم بـ Full Table Scan.
> 2. استخدمت جدول افتراضي **SQLite FTS5** باستخدام مجزئ **Trigram Tokenizer**. هذا الجدول يقوم بفهرسة كل 3 أحرف متتالية، مما يجعل البحث فائق السرعة (~5ms) في 50 ألف سجل.
> 3. **المشكلة:** مجزئ الـ Trigram يعجز عن مطابقة الكلمات المكونة من حرف أو حرفين (أقل من 3 حروف).
> 4. **الحل:** بدلاً من إجبار المستخدم على كتابة 3 حروف (مما يضر تجربة المستخدم)، قمت بعمل Fallback ذكي:
>    - إذا كان طول كلمة البحث >= 3: نستخدم `FTS5 MATCH`.
>    - إذا كان طول كلمة البحث 1 أو 2 حرف: نستخدم استعلام `LIKE` العادي مع عمل Escape دقيق للرموز الخاصة (`%`, `_`, `!`). وبما أن السجلات محدودة بـ `LIMIT 50`، فإن استعلام الحرف أو الحرفين يستغرق ~0.3ms فقط."

---

### R2: Idempotency Key & Concurrency Proof
#### س: كيف منعت تكرار الطلبات عند النقر المزدوج أو إعادة المحاولة من شبكات الجوال؟ ولماذا في قاعدة البيانات تحديداً؟
**الإجابة النموذجية:**
> "1. **تعطيل الزر في الواجهة غير كافٍ:** المستخدم قد يرسل طلبين متوازيين لو انقطع الاتصال أو أعاد المتصفح المحاولة تلقائياً، أو لو تم إرسال الطلب عبر أداة مثل Curl أو Postman.
> 2. **الحل الهندسي:**
>    - يقوم الكلاينت بتوليد UUID فريد لكل شاشة طلب، ويرسله في ترويسة `Idempotency-Key`.
>    - السيرفر يقوم بحساب Hash لمحتوى الطلب (SHA-256 Request Hash).
>    - في قاعدة البيانات، يوجد **Unique Index** مركب على: `(created_by, idempotency_key)`.
>    - يتم الإدخال عبر جملة: `INSERT ... ON CONFLICT (created_by, idempotency_key) DO NOTHING RETURNING id`.
> 3. **الحالات الممكنة:**
>    - **طلب جديد لأول مرة:** السجل يدخل بنجاح ويرجع كود `201 Created`.
>    - **نفس الطلب لنفس المحاولة (Retry):** تفشل عملية الإدخال بسبب الـ Unique Index، فيقوم السيرفر بجلب السجل الأصلي وإرجاعه مع كود `200 OK` وترويسة `Idempotent-Replayed: true`.
>    - **إعادة استخدام نفس المفتاح لطلب مختلف (Tampering):** نقارن الـ Request Hash، وإذا كان مختلفاً نرجع كود `422 Unprocessable Entity`."

---

### npm test Proof
#### س: لماذا قمت بتشغيل نسختين من السيرفر (Two API Processes) في اختبار `npm test`؟
**الإجابة النموذجية:**
> "لأن Node.js يعمل بنظام Single-Threaded Event Loop للعملية الواحدة. لو شغلنا عملية واحدة، قد يظن البعض أن عدم التكرار سببه أن السيرفر استقبل الطلب الأول وعالجه قبل أن يبدأ في معالجة الطلب الثاني.
> 
> ولكن بتشغيل عمليتين منفصلتين تماماً تشتركان في نفس ملف قاعدة البيانات، وإرسال 20 طلباً متزامناً للعمليتين في نفس الجزء من الثانية، أثبتنا قطعيّاً أن الضمانة تأتي من قاعدة البيانات واستخدام `BEGIN IMMEDIATE` والـ Unique Index، وليس من طبيعة تشغيل Node.js."

---

### Security Review (Contractor's Code)
#### س: ما هي أبرز المشاكل الأمنية التي اكتشفتها في كود المقاول السابق، وكيف أصلحتها؟
**الإجابة النموذجية:**
> "وجدت 12 مشكلة أمنية ومعمارية حرجة، أهمها:
> 1. **استخدام `jwt.decode` بدلاً من `jwt.verify`:** الكود القديم كان يقرأ التوكن دون التحقق من التوقيع الرقمي (Signature)! أي شخص كان يستطيع إنشاء توكن مزيف بصلاحية `admin`. أصلحتها باستخدام `jwt.verify` وتحديد خوارزمية `HS256`.
> 2. **المفتاح السري كان Hard-coded في الكود (`sarh-secret-2026`):** نقلته إلى متغيرات البيئة `JWT_SECRET` مع اشتراط طول لا يقل عن 32 حرفاً.
> 3. **قبول التوكن عبر الـ URL Query Parameter (`?token=`):** الـ URLs تسجل في سجلات السيرفر والبروكسي وتاريخ المتصفح. نقلت التوكن بالكامل إلى `httpOnly Cookie` آمن.
> 4. **الاعتماد على React لإخفاء الأزرار (`AdminOnly`):** إخفاء زر الحذف في الواجهة مجرد تجميل، وأي مستخدم يستطيع استدعاء `DELETE /api/orders/:id`. أضفت ميدلوير `requireRole('admin')` الصارم على مستوى السيرفر.
> 5. **تخزين كلمات المرور بصيغة نصية مجردة (Plaintext):** استبدلتها بتشفير `scrypt` المقوى بالـ Salt ومقارنة ثابتة الوقت (Timing-safe comparison) لمنع هجمات الـ Timing Attacks.
> 6. **غياب الحماية من هجمات التخمين (Brute-Force):** أضفت Rate Limiter يقيد المحاولات الفاشلة بـ 10 محاولات كل 15 دقيقة لكل IP."

---

### Optimistic Locking (Versioning)
#### س: كيف تحمي بيانات الطلب من الضياع عند قيام موظفين بتعديل نفس الطلب في نفس الوقت؟
**الإجابة النموذجية:**
> "استخدمت نمط **Optimistic Concurrency Control (OCC)**:
> 1. كل طلب لديه عمود `version` رقمي يبدأ بـ 1.
> 2. عند فتح شاشة التعديل، يحصل الموظف على النسخة الحالية (مثلاً `version = 2`).
> 3. عند الحفظ، يرسل الكلاينت رقم النسخة مع البيانات، وينفذ السيرفر:
>    `UPDATE orders SET ..., version = version + 1 WHERE id = ? AND version = ?`
> 4. إذا قام موظف آخر بالحفظ قبله، فإن الـ Version في قاعدة البيانات يصبح 3، وبالتالي تفشل الجملة (`changes === 0`).
> 5. يرجع السيرفر كود `409 Conflict`، وتعرض الواجهة رسالة تنبيه واضحة للمستخدم بأن شخصاً آخر قام بتعديل الطلب ويجب تحديث الصفحة لرؤية التغييرات."

---

### Product Question: "Delete Cancelled Orders"
#### س: مسؤولة العمليات طلبت زر 'حذف جميع الطلبات الملغاة'، كيف تتصرف كـ Senior Engineer؟
**الإجابة النموذجية:**
> "قبل كتابة سطر كود واحد لحذف البيانات نهائياً، أسألها عدة أسئلة جوهرية لفهم السبب الجذري (Root Cause):
> 1. **ما هي المشكلة الفعلية التي تسببها الطلبات الملغاة؟** هل هي تشتيت الموظفين في الجدول؟ أم بطء في التقارير؟ أم استهلاك مساحة التخزين؟
> 2. **من يحتاج هذه البيانات لاحقاً؟** المحاسبة والمالية للمطابقة والـ Chargebacks؟ الدعم الفني عند استفسار العميل عن سبب الخصم؟ الجهات الرقابية والقانونية وفترات الحفظ الإلزامية؟
> 3. **ماذا عن الطلبات الحديثة؟** هل 'جميع' تشمل طلباً أُلغي قبل نصف ساعة وما زال قابلاً للنزاع مع العميل؟
> 
> **الحل الهندسي المقترح:**
> - إذا كانت المشكلة هي مظهر الجدول: نقوم بإخفاء الطلبات الملغاة من العرض الافتراضي (Default Filter) مع إمكانية إظهارها عند الرغبة.
> - إذا كانت المشكلة تخزين: نقوم بعمل **Archive** أو **Soft Delete** للطلبات الملغاة التي مر عليها أكثر من 6 أو 12 شهراً، مع قصر العملية على المديرين (Admin Only) وتوثيق العملية في سجل التدقيق (Audit Log)."

---

### Architecture & Scalability
#### س: لماذا اخترت SQLite في هذا التقييم، ومتى تقترح الانتقال إلى PostgreSQL؟
**الإجابة النموذجية:**
> "1. **لماذا SQLite هنا؟**
>    - مطابقة دقيقة لمتطلبات الـ Brief: يعمل فوراً بدون الحاجة لتثبيت خوادم قواعد بيانات، وتستغرق التهيئة أقل من 5 دقائق.
>    - أداء فائق جداً لقاعدة بيانات In-Process (زمن الاستعلام 0.2ms إلى 3ms).
> 2. **متى ننتقل إلى PostgreSQL؟**
>    - SQLite تدعم كاتباً واحداً في نفس اللحظة (Single Writer Locks). عند التوسع لخدمة آلاف الموظفين المتزامنين الذين يكتبون في نفس اللحظة، أو عند الحاجة لتشغيل السيرفر على عدة خوادم سحابية (Multi-instance Containers / Horizontal Scaling)، يصبح الانتقال لـ PostgreSQL أو MySQL ضرورة حتمية."

---

### AI Disclosure & Pair Programming
#### س: كيف استخدمت الذكاء الاصطناعي في هذا المشروع؟
**الإجابة النموذجية:**
> "استخدمت الذكاء الاصطناعي (Claude Code) كـ **Pair Programmer** ومساعد إنتاجية لتسريع البناء الروتيني (Scaffolding)، ومساعدتي في كتابة مسودات الاختبارات وقياس زمن الاستعلامات.
> 
> أما جميع **القرارات الهندسية الجوهرية (Architectural Decisions)** فكانت بتوجيه كامل مني، مثل:
> - اختيار Idempotency Key وقفل قاعدة البيانات بدلاً من Content Guessing.
> - تصميم فهارس البحث Trigram FTS5 مع الـ Fallback.
> - اختيار TanStack Query لحل مشكلة الـ Race Conditions معمارياً.
> - مراجعة كل سطر كود وفحصه بنفسي وكتابة الاختبارات للتحقق من صحته."

---

## 4. التعديلات الحية المحتملة على الكود (Live Coding)

في المقابلة، سيطلبون منك: *"Make a small live change to your code"*.
فيما يلي أشهر السيناريوهات المتوقعة مع **الكود الجاهز بدقة ومكان وضعه**:

---

### السيناريو 1: إضافة حقل جديد للطلب (Notes أو Phone)
**الطلب المحتمل:** "نريد إضافة حقل ملاحظات اختياري `notes` أو رقم جوال `customerPhone` للطلب."

#### خطوات التنفيذ السريعة:
1. **في قاعدة البيانات:** أضف Migration أو عدل على جدول `orders`:
   افتح ملف [migrations.ts](file:///e:/Company/orders-console/server/src/db/migrations.ts) وأضف migration جديد في نهاية المصفوفة:
   ```ts
   {
     id: 6,
     name: "add_notes_to_orders",
     sql: `ALTER TABLE orders ADD COLUMN notes TEXT;`
   }
   ```
2. **في الـ Schema بالسيرفر [orders.schema.ts](file:///e:/Company/orders-console/server/src/orders/orders.schema.ts):**
   في `createOrderSchema`:
   ```ts
   export const createOrderSchema = z.object({
     customerName: z.string().trim().min(2).max(100),
     customerEmail: z.string().trim().toLowerCase().pipe(z.email().max(254)),
     notes: z.string().max(500).optional(), // <-- أضف هذا السطر
     items: z.array(...)
   });
   ```
3. **في الـ Repository [orders.repository.ts](file:///e:/Company/orders-console/server/src/orders/orders.repository.ts):**
   - في واجهة `OrderSummary` أو `OrderDetail`: أضف `notes?: string;`
   - في `SUMMARY_COLUMNS`: أضف `o.notes,`
   - في جملة الـ `INSERT INTO orders`:
     ```ts
     `INSERT INTO orders (customer_name, customer_email, notes, status, total_cents, created_by, idempotency_key, request_hash)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`
     ```
     ومرّر `input.notes ?? null` في معاملات الاستعلام.
4. **في الواجهة [OrderFormModal.tsx](file:///e:/Company/orders-console/client/src/features/orders/OrderFormModal.tsx):**
   أضف حقل الإدخال في الـ Form:
   ```tsx
   <label className="field field--grow">
     <span>Notes</span>
     <input
       value={draft.notes || ""}
       placeholder="Special delivery instructions"
       onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
     />
   </label>
   ```

---

### السيناريو 2: إضافة حالة طلب جديدة (Order Status)
**الطلب المحتمل:** "نريد إضافة حالة طلب جديدة اسمها `processing` أو `refunded`."

#### خطوات التنفيذ السريعة:
1. **في السيرفر [order-status.ts](file:///e:/Company/orders-console/server/src/orders/order-status.ts):**
   ```ts
   export const ORDER_STATUSES = [
     "pending",
     "processing", // <-- الحالة الجديدة
     "paid",
     "shipped",
     "delivered",
     "cancelled",
     "refunded"    // <-- أو هنا
   ] as const;
   ```
2. **في الكلاينت [orders.ts](file:///e:/Company/orders-console/client/src/api/orders.ts):**
   قم بتحديث نفس المصفوفة في الكلاينت:
   ```ts
   export const ORDER_STATUSES = [
     "pending",
     "processing",
     "paid",
     "shipped",
     "delivered",
     "cancelled",
     "refunded"
   ] as const;
   ```
3. **في التنسيق CSS [index.css](file:///e:/Company/orders-console/client/src/index.css):**
   أضف لون الشارة (Badge) الجديد:
   ```css
   .status--processing {
     background-color: #eff6ff;
     color: #1d4ed8;
     border-color: #bfdbfe;
   }
   ```
*(شغل المتصفح فوراً، وستظهر الحالة الجديدة تلقائياً في الـ Dropdown للفلترة وفي شاشة التعديل).*

---

### السيناريو 3: زر إجراء سريع (Quick Cancel من الجدول)
**الطلب المحتمل:** "نريد إضافة زر سريع في الجدول لإلغاء الطلب (Cancel Order) بنقرة واحدة."

#### خطوات التنفيذ السريعة:
في [OrdersTable.tsx](file:///e:/Company/orders-console/client/src/features/orders/OrdersTable.tsx):
1. استورد `useUpdateOrder` أو دالة الـ update:
   ```tsx
   import { updateOrder } from "../../api/orders.ts";
   import { useMutation, useQueryClient } from "@tanstack/react-query";
   ```
2. داخل مكون `OrdersTable`:
   ```tsx
   const queryClient = useQueryClient();
   const cancelMutation = useMutation({
     mutationFn: async (order: OrderSummary) => {
       // جلب الطلب لمعرفة الـ version والـ items
       const detail = await fetchOrder(order.id);
       return updateOrder(order.id, {
         customerName: detail.customerName,
         customerEmail: detail.customerEmail,
         items: detail.items,
         status: "cancelled",
         version: detail.version,
       });
     },
     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
   });
   ```
3. في أعمدة الإجراءات (`row-actions`):
   ```tsx
   {order.status !== "cancelled" && (
     <button
       type="button"
       className="row-action button-danger-outline"
       disabled={cancelMutation.isPending}
       onClick={() => cancelMutation.mutate(order)}
     >
       Cancel
     </button>
   )}
   ```

---

### السيناريو 4: تصدير البيانات إلى CSV
**الطلب المحتمل:** "أضف زراً في الـ Toolbar لتصدير الطلبات الحالية المحملة إلى ملف CSV."

#### خطوات التنفيذ السريعة:
في [OrdersPage.tsx](file:///e:/Company/orders-console/client/src/features/orders/OrdersPage.tsx):
1. أضف دالة التصدير:
   ```tsx
   function exportToCsv(orders: OrderSummary[]) {
     const headers = ["ID", "Customer Name", "Customer Email", "Status", "Items", "Total ($)", "Created At"];
     const rows = orders.map((o) => [
       o.id,
       `"${o.customerName}"`,
       `"${o.customerEmail}"`,
       o.status,
       o.itemCount,
       (o.totalCents / 100).toFixed(2),
       `"${o.createdAt}"`,
     ]);
     const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `orders-export-${new Date().toISOString().slice(0, 10)}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
   }
   ```
2. أضف الزر في الـ Toolbar:
   ```tsx
   <button type="button" className="toolbar-action" onClick={() => exportToCsv(loadedOrders)}>
     Export CSV
   </button>
   ```

---

### السيناريو 5: فلترة بنطاق تاريخ (Date Range)
**الطلب المحتمل:** "نريد إمكانية فلترة الطلبات التي تم إنشاؤها بعد تاريخ معين (`createdAfter`)."

#### خطوات التنفيذ السريعة:
1. في السيرفر [orders.schema.ts](file:///e:/Company/orders-console/server/src/orders/orders.schema.ts):
   ```ts
   export const listOrdersQuerySchema = z.object({
     // ... الفلاتر الحالية
     createdAfter: z.string().optional(),
   });
   ```
2. في السيرفر [orders.repository.ts](file:///e:/Company/orders-console/server/src/orders/orders.repository.ts):
   في دالة `listOrders`:
   ```ts
   if (query.createdAfter) {
     conditions.push("o.created_at >= ?");
     params.push(query.createdAfter);
   }
   ```
3. في الكلاينت:
   أضف حقل `<input type="date" />` في الـ Toolbar ومرره في كائن `filters`.

---

### السيناريو 6: إضافة Endpoint للإحصائيات (Stats)
**الطلب المحتمل:** "نريد Endpoint يرجع إحصائيات سريعة: عدد الطلبات الإجمالي وإجمالي المبالغ لكل حالة."

#### خطوات التنفيذ السريعة:
في [orders.routes.ts](file:///e:/Company/orders-console/server/src/orders/orders.routes.ts):
```ts
ordersRouter.get("/stats", (req, res) => {
  const stats = db.prepare(`
    SELECT 
      status, 
      COUNT(*) AS count, 
      SUM(total_cents) AS totalCents 
    FROM orders 
    GROUP BY status
  `).all();
  res.json({ stats });
});
```
*(ملاحظة ذكية: ضع هذا المسار قبل `ordersRouter.get("/:id")` حتى لا يعتبر Express كلمة "stats" كأنها `:id`).*

---

## 5. نصائح اللحظات الأخيرة (Checklist)

### قبل المقابلة بـ 15 دقيقة:
- [ ] شغل المشروع وتأكد أنه يعمل دون أخطاء: `npm run dev` (أو `npm.cmd run dev` في حال ظهر خطأ ExecutionPolicy في ويندوز).
- [ ] تأكد من نجاح الاختبارات: `npm test` (أو `npm.cmd test`).
- [ ] افتح المتصفح على `http://localhost:5173` وسجل الدخول بحساب الـ Admin (`admin@orders.local` / `Admin#2026`).
- [ ] أغلق أي برامج أخرى تستهلك الذاكرة أو الصوت.
- [ ] اجعل هاتفك على الصامت.

> 💡 **ملاحظة لنظام Windows PowerShell:** إذا ظهر لك تنبيه أن `npm.ps1 cannot be loaded because running scripts is disabled`، استخدم فوراً أمر `npm.cmd test` أو شغل في التيرمينال: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.

### أثناء المقابلة والتعديل الحي (Live Coding Mindset):
1. **اسمع جيداً ولا تبدأ فوراً في الكتابة:** اسأل سؤالاً لتأكيد المطلوب:
   *"Just to confirm, you want to add the `phone` field as an optional field in the create form and store it in SQLite, right?"*
2. **فكر بصوت عالٍ (Think Out Loud):**
   *"I will first update the SQLite migration/schema, then add the field to the Zod validator, then map it into the repository query, and finally add the input in the React form."*
3. **إذا ظهر خطأ في الـ Terminal أو المتصفح، لا ترتبك أبداً:**
   كل مبرمج يواجه أخطاء أثناء الكتابة المباشرة. اقرأ رسالة الخطأ بصوت هادئ:
   *"Let's check the terminal... ah, it's a TypeScript type mismatch here, let me add it to the interface."*
   المقابل يبحث عن **كيفية تفكيرك وحلك للمشاكل (Problem Solving Skills)** أكثر من حفظك للكود!

---

**بالتوفيق يا مؤمن! مشروعك مبني بمعايير معمارية استثنائية (Senior Level)، وأنت جاهز تماماً لتقديم أداء مبهر بإذن الله!** 🚀
