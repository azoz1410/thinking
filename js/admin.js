import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    updateDoc,
    deleteDoc,
    doc, 
    getDocs,
    query,
    where,
    onSnapshot,
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// التحقق من أن المستخدم admin
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

if (!currentUser || currentUser.role !== 'admin') {
    alert('غير مصرح لك بالدخول إلى هذه الصفحة');
    window.location.href = 'index.html';
}

// تسجيل الخروج
document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// الانتقال لصفحة الأفكار
document.getElementById('viewIdeasBtn').addEventListener('click', function() {
    window.location.href = 'dashboard.html';
});

// تشفير كلمة المرور (Base64)
function encodePassword(password) {
    return btoa(password);
}

// فك تشفير كلمة المرور
function decodePassword(encodedPassword) {
    try {
        return atob(encodedPassword);
    } catch (e) {
        return encodedPassword;
    }
}

// متغير لتتبع وضع التعديل
let editingMemberId = null;

// إضافة/تعديل عضو
document.getElementById('addMemberForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('memberUsername').value.trim();
    const password = document.getElementById('memberPassword').value;
    const displayName = document.getElementById('memberDisplayName').value.trim();
    const memberId = document.getElementById('editMemberId').value;
    
    if (!username || !password || !displayName) {
        alert('يرجى ملء جميع الحقول');
        return;
    }

    try {
        if (memberId) {
            // تعديل عضو موجود
            await updateDoc(doc(db, 'users', memberId), {
                username: username,
                password: encodePassword(password),
                displayName: displayName,
                updatedAt: Timestamp.now()
            });
            alert('تم تعديل العضو بنجاح');
        } else {
            // التحقق من عدم وجود اسم مستخدم مكرر
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                alert('اسم المستخدم موجود مسبقاً. اختر اسم آخر.');
                return;
            }

            // إضافة عضو جديد
            await addDoc(collection(db, 'users'), {
                username: username,
                password: encodePassword(password),
                displayName: displayName,
                role: 'member',
                createdAt: Timestamp.now()
            });
            alert('تم إضافة العضو بنجاح');
        }
        
        // إعادة تعيين النموذج
        resetForm();
        
    } catch (error) {
        console.error('خطأ في حفظ العضو:', error);
        console.error('تفاصيل الخطأ:', error.message);
        alert('حدث خطأ: ' + error.message + '\n\nتحقق من:\n1. تفعيل Firestore\n2. قواعد الأمان في Firebase');
    }
});

// إلغاء التعديل
document.getElementById('cancelEditBtn').addEventListener('click', function() {
    resetForm();
});

// إعادة تعيين النموذج
function resetForm() {
    document.getElementById('addMemberForm').reset();
    document.getElementById('editMemberId').value = '';
    document.getElementById('submitBtn').textContent = 'إضافة عضو';
    document.getElementById('cancelEditBtn').style.display = 'none';
    editingMemberId = null;
}

// تعديل عضو
function editMember(memberId, username, password, displayName) {
    document.getElementById('memberUsername').value = username;
    document.getElementById('memberPassword').value = decodePassword(password);
    document.getElementById('memberDisplayName').value = displayName;
    document.getElementById('editMemberId').value = memberId;
    document.getElementById('submitBtn').textContent = 'حفظ التعديلات';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    editingMemberId = memberId;
    
    // التمرير للأعلى
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// حذف عضو
async function deleteMember(memberId, displayName) {
    if (confirm(`هل أنت متأكد من حذف العضو "${displayName}"؟\n\nسيتم حذف جميع أفكاره أيضاً.`)) {
        try {
            // حذف العضو
            await deleteDoc(doc(db, 'users', memberId));
            
            // حذف جميع أفكار العضو
            const ideasRef = collection(db, 'ideas');
            const q = query(ideasRef, where('userId', '==', memberId));
            const querySnapshot = await getDocs(q);
            
            const deletePromises = [];
            querySnapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });
            
            await Promise.all(deletePromises);
            
            alert('تم حذف العضو وأفكاره بنجاح');
            
        } catch (error) {
            console.error('خطأ في حذف العضو:', error);
            alert('حدث خطأ في حذف العضو. حاول مرة أخرى.');
        }
    }
}

// عرض قائمة الأعضاء
const usersQuery = query(collection(db, 'users'), where('role', '==', 'member'));

onSnapshot(usersQuery, (snapshot) => {
    const membersList = document.getElementById('membersList');
    const memberCount = document.getElementById('memberCount');
    
    if (snapshot.empty) {
        membersList.innerHTML = '<div class="no-members">لا يوجد أعضاء مسجلين بعد</div>';
        memberCount.textContent = '0 عضو';
        return;
    }
    
    membersList.innerHTML = '';
    memberCount.textContent = `${snapshot.size} ${snapshot.size === 1 ? 'عضو' : snapshot.size === 2 ? 'عضوان' : 'أعضاء'}`;
    
    snapshot.forEach((docSnap) => {
        const member = docSnap.data();
        const memberId = docSnap.id;
        
        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';
        
        // حساب عدد الأفكار (سيتم تحديثه لاحقاً)
        memberCard.innerHTML = `
            <div class="member-info">
                <h3>${member.displayName}</h3>
                <p><strong>اسم المستخدم:</strong> ${member.username}</p>
                <p><strong>كلمة المرور:</strong> ${'•'.repeat(8)}</p>
                <p class="member-date">تاريخ الإضافة: ${formatDate(member.createdAt)}</p>
            </div>
            <div class="member-actions">
                <button class="btn-edit" onclick="window.editMember('${memberId}', '${member.username}', '${member.password}', '${member.displayName}')">
                    تعديل
                </button>
                <button class="btn-delete" onclick="window.deleteMember('${memberId}', '${member.displayName}')">
                    حذف
                </button>
            </div>
        `;
        
        membersList.appendChild(memberCard);
    });
});

// تنسيق التاريخ
function formatDate(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    const date = timestamp.toDate();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

// جعل الدوال متاحة عالمياً
window.editMember = editMember;
window.deleteMember = deleteMember;
