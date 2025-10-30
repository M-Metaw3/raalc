# نظام رفع الملفات | File Upload System

## نظرة عامة | Overview

نظام متكامل لرفع الملفات باستخدام **Multer** مع:
- ✅ تخزين منظم في فولدرات منفصلة لكل مستخدم
- ✅ Error handling احترافي
- ✅ دعم الصور ل Admins, Users, Agents
- ✅ حفظ URL في قاعدة البيانات
- ✅ إمكانية التحديث والحذف

---

## هيكل الملفات | Folder Structure

```
uploads/
├── admin/
│   ├── admin_dubaicourts_ae/
│   │   └── avatar_1729407600000_a1b2c3d4.jpg
│   └── admin2_dubaicourts_ae/
│       └── avatar_1729407700000_e5f6g7h8.png
├── user/
│   ├── ahmed_example_com/
│   │   └── avatar_1729407800000_i9j0k1l2.jpg
│   └── 0551234567/
│       └── avatar_1729407900000_m3n4o5p6.png
└── agent/
    ├── agent_example_com/
    │   └── avatar_1729408000000_q7r8s9t0.jpg
    └── 0559876543/
        └── avatar_1729408100000_u1v2w3x4.png
```

### تسمية الفولدرات | Folder Naming
- يتم إنشاء فولدر منفصل لكل مستخدم باستخدام **email** أو **phone number**
- يتم تنظيف الأسماء من الأحرف الخاصة (@ و . تصبح _)
- مثال: `admin@dubaicourts.ae` → `admin_dubaicourts_ae`
- مثال: `0551234567` → `0551234567`

---

## الملفات المدعومة | Supported Files

### صور الملف الشخصي | Profile Images
- ✅ JPEG / JPG
- ✅ PNG
- ✅ GIF
- ✅ WebP
- 📏 الحجم الأقصى: 5MB

### المستندات | Documents (للوكلاء فقط)
- ✅ PDF
- ✅ DOC / DOCX
- ✅ XLS / XLSX
- 📏 الحجم الأقصى: 10MB

---

## API Endpoints

### 1. رفع صورة المستخدم | Upload User Avatar

```http
PATCH /api/users/avatar
Authorization: Bearer {user_access_token}
Content-Type: multipart/form-data

Form Data:
- avatar: [image file]
```

**Response:**
```json
{
  "ok": true,
  "message": "Profile image uploaded successfully.",
  "data": {
    "user": {
      "id": 1,
      "firstName": "أحمد",
      "lastName": "محمد",
      "email": "ahmed@example.com",
      "avatar": "http://localhost:4000/uploads/user/ahmed_example_com/avatar_1729407800000_i9j0k1l2.jpg",
      "userType": "USER"
    },
    "file": {
      "filename": "avatar_1729407800000_i9j0k1l2.jpg",
      "url": "http://localhost:4000/uploads/user/ahmed_example_com/avatar_1729407800000_i9j0k1l2.jpg",
      "size": 245678
    }
  }
}
```

### 2. رفع صورة الوكيل | Upload Agent Avatar

```http
PATCH /api/agents/avatar
Authorization: Bearer {agent_access_token}
Content-Type: multipart/form-data

Form Data:
- avatar: [image file]
```

### 3. رفع صورة المسؤول | Upload Admin Avatar

```http
PATCH /api/admins/avatar
Authorization: Bearer {admin_access_token}
Content-Type: multipart/form-data

Form Data:
- avatar: [image file]
```

### 4. حذف الصورة | Delete Avatar

```http
DELETE /api/users/avatar
Authorization: Bearer {user_access_token}

DELETE /api/agents/avatar
Authorization: Bearer {agent_access_token}

DELETE /api/admins/avatar
Authorization: Bearer {admin_access_token}
```

**Response:**
```json
{
  "ok": true,
  "message": "Profile image deleted successfully.",
  "data": {
    "user": {
      "id": 1,
      "avatar": null
    }
  }
}
```

---

## أمثلة باستخدام cURL

### رفع صورة
```bash
curl -X PATCH http://localhost:4000/api/users/avatar \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

### حذف صورة
```bash
curl -X DELETE http://localhost:4000/api/users/avatar \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## أمثلة باستخدام JavaScript (Frontend)

### React / Vue / Angular

```javascript
// Upload Avatar
async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await fetch('http://localhost:4000/api/users/avatar', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    });

    const data = await response.json();
    
    if (data.ok) {
      console.log('Avatar uploaded:', data.data.file.url);
      // Update UI with new avatar URL
      setAvatarUrl(data.data.user.avatar);
    } else {
      console.error('Upload failed:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Delete Avatar
async function deleteAvatar() {
  try {
    const response = await fetch('http://localhost:4000/api/users/avatar', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    
    if (data.ok) {
      console.log('Avatar deleted');
      setAvatarUrl(null);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Handle file input change
function handleFileChange(event) {
  const file = event.target.files[0];
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    alert('يرجى اختيار صورة صالحة (JPEG, PNG, GIF, WebP)');
    return;
  }
  
  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('حجم الملف يجب أن يكون أقل من 5MB');
    return;
  }
  
  uploadAvatar(file);
}
```

### HTML Form Example
```html
<form id="avatarForm">
  <input type="file" id="avatarInput" accept="image/*" />
  <button type="submit">رفع الصورة</button>
</form>

<script>
document.getElementById('avatarForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const file = document.getElementById('avatarInput').files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await fetch('/api/users/avatar', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: formData
  });
  
  const data = await response.json();
  console.log(data);
});
</script>
```

---

## معالجة الأخطاء | Error Handling

### أخطاء Multer الشائعة

#### 1. File Too Large
```json
{
  "ok": false,
  "message": "File size exceeds the maximum allowed limit.",
  "messageKey": "errors.fileTooLarge",
  "statusCode": 413,
  "details": {
    "maxSize": "5242880 bytes",
    "maxSizeMB": "5MB"
  }
}
```

#### 2. Invalid File Type
```json
{
  "ok": false,
  "message": "Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP).",
  "messageKey": "errors.invalidFileType",
  "statusCode": 400,
  "details": {
    "allowedTypes": ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
  }
}
```

#### 3. File Required
```json
{
  "ok": false,
  "message": "File is required.",
  "messageKey": "errors.fileRequired",
  "statusCode": 400
}
```

#### 4. Too Many Files
```json
{
  "ok": false,
  "message": "Too many files. Maximum files limit exceeded.",
  "messageKey": "errors.tooManyFiles",
  "statusCode": 400
}
```

---

## المميزات التقنية | Technical Features

### 1. تخزين منظم
- ✅ فولدر منفصل لكل نوع مستخدم (admin/user/agent)
- ✅ فولدر منفصل لكل مستخدم داخل النوع
- ✅ تسمية فريدة للملفات مع timestamp و random hash

### 2. الأمان
- ✅ التحقق من نوع الملف (MIME type)
- ✅ التحقق من حجم الملف
- ✅ تنظيف أسماء الملفات من الأحرف الخاصة
- ✅ حذف الملفات القديمة عند التحديث
- ✅ حذف الملفات المؤقتة عند حدوث خطأ

### 3. تحديث تلقائي
- ✅ عند رفع صورة جديدة، يتم حذف الصورة القديمة تلقائياً
- ✅ يتم تحديث URL في قاعدة البيانات
- ✅ لا توجد ملفات يتيمة

### 4. Error Handling
- ✅ معالجة شاملة لجميع أخطاء Multer
- ✅ رسائل خطأ مترجمة (عربي/إنجليزي)
- ✅ تنظيف الملفات عند حدوث خطأ
- ✅ Logging لجميع عمليات الرفع

---

## الاستخدام في الكود | Code Usage

### في Service
```javascript
const UploadService = require('@services/UploadService');

// Update user avatar
async updateAvatar(userId, avatarUrl) {
  const user = await UserRepository.findById(userId);
  
  // Delete old avatar
  if (user.avatar) {
    UploadService.deleteFileByUrl(user.avatar);
  }
  
  // Update with new avatar
  await UserRepository.update(userId, { avatar: avatarUrl });
}
```

### في Controller
```javascript
async uploadAvatar(req, res, next) {
  try {
    const avatarUrl = UploadService.getFileUrl(req.file.path);
    await UserService.updateAvatar(req.user.id, avatarUrl);
    
    res.json({ ok: true, data: { url: avatarUrl } });
  } catch (error) {
    // Clean up on error
    UploadService.cleanupFiles(req.file);
    next(error);
  }
}
```

### في Routes
```javascript
const { wrapMulterUpload, logUpload } = require('@middleware/uploadHandler');
const UploadService = require('@services/UploadService');

router.patch(
  '/avatar',
  authenticate,
  wrapMulterUpload(UploadService.createUserImageUpload()),
  logUpload,
  userController.uploadAvatar
);
```

---

## Configuration

### Environment Variables
```env
# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880  # 5MB in bytes
APP_URL=http://localhost:4000
```

### Package Required
```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1"
  }
}
```

---

## Best Practices

### للمستخدمين
1. ✅ استخدم صور بجودة مناسبة (لا تزيد عن 5MB)
2. ✅ الصيغ المدعومة: JPEG, PNG, GIF, WebP
3. ✅ الأبعاد الموصى بها: 500x500 pixels للصورة الشخصية

### للمطورين
1. ✅ تحقق دائماً من وجود الملف قبل المعالجة
2. ✅ نظف الملفات المؤقتة عند حدوث خطأ
3. ✅ احذف الملفات القديمة عند التحديث
4. ✅ سجل جميع عمليات الرفع للمراجعة

---

## الصيانة | Maintenance

### تنظيف الملفات القديمة
يمكن إنشاء cron job لحذف الملفات غير المرتبطة بقاعدة البيانات:

```javascript
// cleanup-orphan-files.js
const fs = require('fs');
const path = require('path');

async function cleanupOrphanFiles() {
  // Get all avatar URLs from database
  const allAvatars = await getAllAvatarUrlsFromDB();
  
  // Scan uploads folder
  const uploadedFiles = scanUploadsFolder();
  
  // Find orphan files
  const orphans = uploadedFiles.filter(file => 
    !allAvatars.includes(file)
  );
  
  // Delete orphans
  orphans.forEach(file => fs.unlinkSync(file));
}
```

---

## دعم | Support

للمزيد من المعلومات:
- 📧 Email: support@dubaicourts.ae
- 📚 Documentation: `/docs`

**الإصدار:** 1.0.0

