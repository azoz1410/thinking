# 🧠 نظام الأفكار للفريق

نظام لإدارة ومشاركة الأفكار بين أعضاء الفريق (4 أعضاء) مع قاعدة بيانات Firebase.

## 📋 المميزات

- ✅ تسجيل دخول بسيط باختيار اسم العضو
- ✅ 4 أعمدة متساوية لعرض أفكار كل عضو
- ✅ إضافة أفكار جديدة
- ✅ حذف الأفكار (كل عضو يحذف أفكاره فقط)
- ✅ تحديث فوري (Real-time) - الأفكار تظهر مباشرة لجميع الأعضاء
- ✅ تصميم متجاوب يعمل على الجوال والكمبيوتر

## 🚀 كيفية التشغيل المحلي

### 1. افتح الملفات مباشرة

يمكنك فتح `index.html` مباشرة في المتصفح، لكن قد تواجه مشاكل مع Firebase modules.

### 2. استخدم Live Server (موصى به)

إذا كنت تستخدم VS Code:
1. قم بتثبيت إضافة "Live Server"
2. انقر بزر الماوس الأيمن على `index.html`
3. اختر "Open with Live Server"

### 3. استخدم Python Server

```bash
# في مجلد المشروع
python3 -m http.server 8000

# ثم افتح المتصفح على
# http://localhost:8000
```

## 🌐 رفع المشروع على Firebase Hosting

### الخطوة 1: تثبيت Firebase CLI

```bash
npm install -g firebase-tools
```

### الخطوة 2: تسجيل الدخول

```bash
firebase login
```

### الخطوة 3: تهيئة المشروع

```bash
firebase init hosting
```

اختر:
- ✅ Use an existing project → thinking-b71b0
- ✅ Public directory: اضغط Enter (سيستخدم المجلد الحالي)
- ✅ Single-page app: No
- ✅ Overwrite index.html: No

### الخطوة 4: رفع المشروع

```bash
firebase deploy
```

سيعطيك رابط مثل:
```
https://thinking-b71b0.web.app
```

## 🔧 إعدادات Firebase

### تفعيل Firestore

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر مشروع "thinking-b71b0"
3. من القائمة الجانبية → **Firestore Database**
4. اضغط على "Create database"
5. اختر موقع (مثل: europe-west1)
6. اختر **Start in test mode** (مؤقتاً للتجربة)
7. اضغط "Enable"

### تأمين قاعدة البيانات (بعد التجربة)

في Firestore → Rules، غير القواعد إلى:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // السماح بالقراءة للجميع
    match /ideas/{idea} {
      allow read: if true;
      allow create: if true;
      allow delete: if request.auth != null || true;
    }
    
    match /members/{member} {
      allow read: if true;
    }
  }
}
```

## ✏️ تعديل أسماء الأعضاء

لتغيير أسماء الأعضاء، عدّل هذه الملفات:

### 1. في `index.html` (السطور 18-21):
```html
<option value="member1">اسم العضو الجديد 1</option>
<option value="member2">اسم العضو الجديد 2</option>
<option value="member3">اسم العضو الجديد 3</option>
<option value="member4">اسم العضو الجديد 4</option>
```

### 2. في `dashboard.html` (السطور 23, 28, 33, 38):
```html
<h2 class="column-header">اسم العضو الجديد 1</h2>
<h2 class="column-header">اسم العضو الجديد 2</h2>
<h2 class="column-header">اسم العضو الجديد 3</h2>
<h2 class="column-header">اسم العضو الجديد 4</h2>
```

### 3. في `js/auth.js` (السطور 2-7):
```javascript
const members = {
    member1: 'اسم العضو الجديد 1',
    member2: 'اسم العضو الجديد 2',
    member3: 'اسم العضو الجديد 3',
    member4: 'اسم العضو الجديد 4'
};
```

### 4. في `js/dashboard.js` (السطور 11-16):
```javascript
const memberNames = {
    member1: 'اسم العضو الجديد 1',
    member2: 'اسم العضو الجديد 2',
    member3: 'اسم العضو الجديد 3',
    member4: 'اسم العضو الجديد 4'
};
```

## 📁 هيكل المشروع

```
thinking/
├── index.html              # صفحة تسجيل الدخول
├── dashboard.html          # الصفحة الرئيسية
├── css/
│   └── style.css          # التنسيقات
├── js/
│   ├── firebase-config.js # إعدادات Firebase
│   ├── auth.js            # منطق تسجيل الدخول
│   ├── dashboard.js       # منطق الصفحة الرئيسية
│   └── init-members.js    # ملف مساعد (اختياري)
└── README.md              # هذا الملف

```

## 🐛 حل المشاكل الشائعة

### المشكلة: "Firebase is not defined"
- تأكد من فتح المشروع عبر Live Server وليس مباشرة
- تأكد من الاتصال بالإنترنت

### المشكلة: الأفكار لا تظهر
- تأكد من تفعيل Firestore في Firebase Console
- افتح Console في المتصفح (F12) لرؤية الأخطاء
- تحقق من قواعد Firestore (يجب أن تكون test mode)

### المشكلة: "Permission denied"
- اذهب إلى Firestore → Rules
- تأكد أنك في test mode أو عدّل القواعد

## 📞 الدعم

إذا واجهت أي مشكلة، تحقق من:
1. Console في المتصفح (F12)
2. Firebase Console → Firestore → Data
3. Firebase Console → Firestore → Rules

---

**تم الإنشاء في:** 3 مارس 2026
**الإصدار:** 1.0.0
