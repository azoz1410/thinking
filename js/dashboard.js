import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    query, 
    where,
    orderBy,
    getDocs,
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// التحقق من تسجيل الدخول
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

if (!currentUser || !currentUser.id) {
    window.location.href = 'index.html';
}

// عرض اسم المستخدم الحالي
document.getElementById('currentUser').textContent = `مرحباً، ${currentUser.displayName}`;

// تخزين أسماء الأعضاء (سيتم تحديثها من قاعدة البيانات)
let memberNames = {};

// تسجيل الخروج
document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// جلب أسماء الأعضاء من قاعدة البيانات
async function loadMembers() {
    try {
        const usersQuery = query(collection(db, 'users'), where('role', '==', 'member'));
        const querySnapshot = await getDocs(usersQuery);
        
        memberNames = {};
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            memberNames[doc.id] = userData.displayName;
        });
        
        // إخفاء الأعمدة الفارغة وإعادة تنظيم الشبكة
        updateColumnsLayout();
        
    } catch (error) {
        console.error('خطأ في جلب الأعضاء:', error);
    }
}

// تحديث تخطيط الأعمدة بناءً على عدد الأعضاء
function updateColumnsLayout() {
    const container = document.getElementById('columnsContainer');
    container.innerHTML = '';
    
    // إنشاء أعمدة للأعضاء المسجلين فقط
    Object.keys(memberNames).forEach(memberId => {
        const column = document.createElement('div');
        column.className = 'column';
        column.dataset.member = memberId;
        
        column.innerHTML = `
            <h2 class="column-header">${memberNames[memberId]}</h2>
            <div class="ideas-list" id="ideas-${memberId}"></div>
        `;
        
        container.appendChild(column);
    });
    
    // تعديل عدد الأعمدة في CSS بناءً على عدد الأعضاء
    const memberCount = Object.keys(memberNames).length;
    if (memberCount > 0) {
        container.style.gridTemplateColumns = `repeat(${Math.min(memberCount, 4)}, 1fr)`;
    }
}

// تحميل الأعضاء عند بدء الصفحة
loadMembers();

// التعامل مع Modal
const modal = document.getElementById('addIdeaModal');
const addIdeaBtn = document.getElementById('addIdeaBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');

addIdeaBtn.addEventListener('click', () => {
    modal.classList.add('show');
    document.getElementById('ideaTitle').focus();
});

closeModal.addEventListener('click', () => {
    modal.classList.remove('show');
    document.getElementById('addIdeaForm').reset();
});

cancelBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    document.getElementById('addIdeaForm').reset();
});

// إغلاق Modal عند النقر خارجها
modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        modal.classList.remove('show');
        document.getElementById('addIdeaForm').reset();
    }
});

// إضافة فكرة جديدة
document.getElementById('addIdeaForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('ideaTitle').value.trim();
    const description = document.getElementById('ideaDescription').value.trim();
    const problem = document.getElementById('ideaProblem').value.trim();
    const solution = document.getElementById('ideaSolution').value.trim();
    
    if (title && description && problem && solution) {
        try {
            await addDoc(collection(db, 'ideas'), {
                title: title,
                description: description,
                problem: problem,
                solution: solution,
                userId: currentUser.id,
                userName: currentUser.displayName,
                timestamp: Timestamp.now()
            });
            
            // إغلاق Modal وإعادة تعيين النموذج
            modal.classList.remove('show');
            document.getElementById('addIdeaForm').reset();
            
        } catch (error) {
            console.error('خطأ في إضافة الفكرة:', error);
            alert('حدث خطأ في إضافة الفكرة. حاول مرة أخرى.');
        }
    }
});

// حذف فكرة
async function deleteIdea(ideaId) {
    if (confirm('هل أنت متأكد من حذف هذه الفكرة؟')) {
        try {
            await deleteDoc(doc(db, 'ideas', ideaId));
        } catch (error) {
            console.error('خطأ في حذف الفكرة:', error);
            alert('حدث خطأ في حذف الفكرة. حاول مرة أخرى.');
        }
    }
}

// تنسيق التاريخ والوقت
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date;
    
    // أقل من دقيقة
    if (diff < 60000) {
        return 'الآن';
    }
    // أقل من ساعة
    else if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `منذ ${minutes} دقيقة`;
    }
    // أقل من يوم
    else if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `منذ ${hours} ساعة`;
    }
    // أكثر من يوم
    else {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} - ${hours}:${minutes}`;
    }
}

// عرض فكرة في العمود المناسب
async function displayIdea(idea, ideaId) {
    const ideaElement = document.createElement('div');
    ideaElement.className = 'idea-card';
    ideaElement.dataset.id = ideaId;
    
    const canDelete = idea.userId === currentUser.id;
    const ideaTitle = idea.title || idea.text || 'بدون عنوان';
    
    // جلب التقييمات لهذه الفكرة
    let supportCount = 0;
    let neutralCount = 0;
    let opposeCount = 0;
    
    try {
        const ratingsQuery = query(
            collection(db, 'ratings'),
            where('ideaId', '==', ideaId)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        
        ratingsSnapshot.forEach((doc) => {
            const rating = doc.data().rating;
            if (rating === 'support') supportCount++;
            else if (rating === 'neutral') neutralCount++;
            else if (rating === 'oppose') opposeCount++;
        });
    } catch (error) {
        console.error('خطأ في جلب التقييمات:', error);
    }
    
    const totalRatings = supportCount + neutralCount + opposeCount;
    
    ideaElement.innerHTML = `
        <div class="idea-card-header">
            <a href="idea-details.html?id=${ideaId}" class="idea-card-title-link">
                <h3 class="idea-card-title">${ideaTitle}</h3>
            </a>
        </div>
        <div class="idea-ratings-summary">
            <span class="rating-count support">✅ ${supportCount}</span>
            <span class="rating-count neutral">⚪ ${neutralCount}</span>
            <span class="rating-count oppose">❌ ${opposeCount}</span>
            <span class="total-ratings">(${totalRatings} تقييم)</span>
        </div>
        <div class="idea-footer">
            <span class="idea-time">${formatTimestamp(idea.timestamp)}</span>
            ${canDelete ? `<button class="btn-delete" onclick="window.deleteIdea('${ideaId}')">حذف</button>` : ''}
        </div>
    `;
    
    return ideaElement;
}

// الاستماع للتحديثات الفورية من Firestore
const ideasQuery = query(collection(db, 'ideas'), orderBy('timestamp', 'desc'));

onSnapshot(ideasQuery, (snapshot) => {
    // مسح جميع الأفكار الحالية
    Object.keys(memberNames).forEach(memberId => {
        const container = document.getElementById(`ideas-${memberId}`);
        if (container) {
            container.innerHTML = '';
        }
    });
    
    // تجميع الأفكار حسب العضو
    const ideasByMember = {};
    
    // تهيئة المصفوفات للأعضاء المسجلين
    Object.keys(memberNames).forEach(memberId => {
        ideasByMember[memberId] = [];
    });
    
    snapshot.forEach((doc) => {
        const idea = doc.data();
        const ideaId = doc.id;
        
        if (ideasByMember[idea.userId]) {
            ideasByMember[idea.userId].push({ ...idea, id: ideaId });
        }
    });
    
    // عرض الأفكار في الأعمدة
    Object.keys(ideasByMember).forEach(memberId => {
        const container = document.getElementById(`ideas-${memberId}`);
        if (!container) return;
        
        const ideas = ideasByMember[memberId];
        
        if (ideas.length === 0) {
            container.innerHTML = '<div class="no-ideas">لا توجد أفكار بعد</div>';
        } else {
            // عرض الأفكار بشكل async
            ideas.forEach(async idea => {
                const ideaElement = await displayIdea(idea, idea.id);
                container.appendChild(ideaElement);
            });
        }
    });
});

// جعل دالة الحذف متاحة عالمياً
window.deleteIdea = deleteIdea;
