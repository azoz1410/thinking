import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs,
    query,
    where 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// بيانات Admin الافتراضية
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// تشفير كلمة المرور (Base64)
function encodePassword(password) {
    return btoa(password);
}

// التعامل مع نموذج تسجيل الدخول
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    
    // إخفاء رسالة الخطأ
    errorDiv.style.display = 'none';
    
    if (!username || !password) {
        showError('يرجى إدخال اسم المستخدم وكلمة المرور');
        return;
    }
    
    try {
        // التحقق من admin
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            const adminUser = {
                id: 'admin',
                username: ADMIN_USERNAME,
                displayName: 'المدير',
                role: 'admin'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            window.location.href = 'admin-dashboard.html';
            return;
        }
        
        // البحث عن العضو في قاعدة البيانات
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            showError('اسم المستخدم أو كلمة المرور غير صحيحة');
            return;
        }
        
        // التحقق من كلمة المرور
        let userFound = false;
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const encodedPassword = encodePassword(password);
            
            if (userData.password === encodedPassword) {
                userFound = true;
                
                const user = {
                    id: doc.id,
                    username: userData.username,
                    displayName: userData.displayName,
                    role: userData.role
                };
                
                localStorage.setItem('currentUser', JSON.stringify(user));
                window.location.href = 'dashboard.html';
            }
        });
        
        if (!userFound) {
            showError('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
        
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showError('حدث خطأ في تسجيل الدخول. حاول مرة أخرى.');
    }
});

// عرض رسالة خطأ
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// التحقق من تسجيل الدخول عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // إذا كان المستخدم مسجل الدخول بالفعل، انتقل إلى الصفحة المناسبة
    if (currentUser && currentUser.id) {
        if (currentUser.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
});
