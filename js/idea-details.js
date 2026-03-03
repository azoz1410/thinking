import { db } from './firebase-config.js';
import { 
    collection,
    doc, 
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// التحقق من تسجيل الدخول
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

if (!currentUser || !currentUser.id) {
    window.location.href = 'index.html';
}

// الحصول على معرف الفكرة من URL
const urlParams = new URLSearchParams(window.location.search);
const ideaId = urlParams.get('id');

if (!ideaId) {
    showError('معرف الفكرة غير موجود');
}

// متغير لتخزين صاحب الفكرة
let ideaOwnerId = null;

// تسجيل الخروج
document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// الرجوع للصفحة الرئيسية
document.getElementById('backBtn').addEventListener('click', function() {
    window.location.href = 'dashboard.html';
});

// تحميل تفاصيل الفكرة
async function loadIdeaDetails() {
    try {
        const ideaDoc = await getDoc(doc(db, 'ideas', ideaId));
        
        if (!ideaDoc.exists()) {
            showError('الفكرة غير موجودة أو تم حذفها');
            return;
        }
        
        const idea = ideaDoc.data();
        displayIdeaDetails(idea, ideaId);
        
    } catch (error) {
        console.error('خطأ في تحميل الفكرة:', error);
        showError('حدث خطأ في تحميل الفكرة');
    }
}

// عرض تفاصيل الفكرة
function displayIdeaDetails(idea, ideaId) {
    // إخفاء Loading وعرض المحتوى
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('ideaDetailContainer').style.display = 'block';
    
    // حفظ معرف صاحب الفكرة
    ideaOwnerId = idea.userId;
    
    // العنوان
    document.getElementById('ideaTitle').textContent = idea.title || 'بدون عنوان';
    
    // البيانات الوصفية
    document.getElementById('ideaAuthor').textContent = `بواسطة: ${idea.userName || 'غير معروف'}`;
    document.getElementById('ideaDate').textContent = formatTimestamp(idea.timestamp);
    
    // المحتوى
    document.getElementById('ideaDescription').textContent = idea.description || 'لا توجد نبذة';
    document.getElementById('ideaProblem').textContent = idea.problem || 'لم يتم تحديد المشكلة';
    document.getElementById('ideaSolution').textContent = idea.solution || 'لم يتم تحديد الحل';
    
    // إظهار زر الحذف إذا كان المستخدم هو صاحب الفكرة
    if (idea.userId === currentUser.id) {
        const deleteBtn = document.getElementById('deleteIdeaBtn');
        deleteBtn.style.display = 'inline-block';
        deleteBtn.onclick = () => deleteIdea(ideaId);
    }
    
    // تحميل التقييمات والتعليقات
    loadUserRating();
    loadRatings();
    loadComments();
}

// حذف الفكرة
async function deleteIdea(ideaId) {
    if (confirm('هل أنت متأكد من حذف هذه الفكرة؟\n\nلن تتمكن من استعادتها بعد الحذف.')) {
        try {
            await deleteDoc(doc(db, 'ideas', ideaId));
            alert('تم حذف الفكرة بنجاح');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('خطأ في حذف الفكرة:', error);
            alert('حدث خطأ في حذف الفكرة. حاول مرة أخرى.');
        }
    }
}

// عرض رسالة خطأ
function showError(message) {
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('ideaDetailContainer').style.display = 'none';
    document.getElementById('errorContainer').style.display = 'flex';
    document.getElementById('errorMessage').textContent = message;
}

// تنسيق التاريخ والوقت
function formatTimestamp(timestamp) {
    if (!timestamp) return 'غير محدد';
    
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
        return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : minutes === 2 ? 'دقيقتين' : 'دقائق'}`;
    }
    // أقل من يوم
    else if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `منذ ${hours} ${hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : 'ساعات'}`;
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

// نموذج التقييم
document.getElementById('ratingForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const rating = document.querySelector('input[name="rating"]:checked').value;
    
    try {
        // استخدام setDoc لحفظ أو تحديث التقييم
        const ratingDocRef = doc(db, 'ratings', `${ideaId}_${currentUser.id}`);
        await setDoc(ratingDocRef, {
            ideaId: ideaId,
            userId: currentUser.id,
            userName: currentUser.displayName,
            rating: rating,
            timestamp: Timestamp.now()
        });
        
        showSuccessMessage('تم حفظ تقييمك! ✅');
        
    } catch (error) {
        console.error('خطأ في حفظ التقييم:', error);
        alert('حدث خطأ في حفظ التقييم. حاول مرة أخرى.');
    }
});

// نموذج إضافة تعليق
document.getElementById('addCommentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const commentText = document.getElementById('commentText').value.trim();
    
    if (!commentText) {
        alert('يرجى كتابة تعليقك');
        return;
    }
    
    try {
        await addDoc(collection(db, 'comments'), {
            ideaId: ideaId,
            userId: currentUser.id,
            userName: currentUser.displayName,
            comment: commentText,
            timestamp: Timestamp.now(),
            isReply: false,
            replyTo: null
        });
        
        // إعادة تعيين النموذج
        this.reset();
        
        // رسالة نجاح
        showSuccessMessage('تم إضافة التعليق بنجاح! ✅');
        
    } catch (error) {
        console.error('خطأ في إضافة التعليق:', error);
        alert('حدث خطأ في إضافة التعليق. حاول مرة أخرى.');
    }
});

// تحميل تقييم المستخدم الحالي
async function loadUserRating() {
    try {
        const ratingDocRef = doc(db, 'ratings', `${ideaId}_${currentUser.id}`);
        const ratingDoc = await getDoc(ratingDocRef);
        
        if (ratingDoc.exists()) {
            const rating = ratingDoc.data().rating;
            // تحديد الاختيار في النموذج
            const radioBtn = document.querySelector(`input[name="rating"][value="${rating}"]`);
            if (radioBtn) {
                radioBtn.checked = true;
            }
            document.getElementById('ratingSubmitBtn').textContent = 'تحديث التقييم';
        }
    } catch (error) {
        console.error('خطأ في تحميل التقييم:', error);
    }
}

// تحميل جميع التقييمات
function loadRatings() {
    const ratingsQuery = query(
        collection(db, 'ratings'),
        where('ideaId', '==', ideaId)
    );
    
    onSnapshot(ratingsQuery, (snapshot) => {
        const ratings = [];
        snapshot.forEach((doc) => {
            ratings.push(doc.data().rating);
        });
        updateRatingStats(ratings);
    });
}

// إضافة رد على تعليق
async function addReply(commentId, commentOwnerName) {
    const replyText = prompt(`الرد على تعليق ${commentOwnerName}:\n\nاكتب ردك:`);
    
    if (replyText && replyText.trim()) {
        try {
            await addDoc(collection(db, 'comments'), {
                ideaId: ideaId,
                userId: currentUser.id,
                userName: currentUser.displayName,
                rating: 'neutral',
                comment: replyText.trim(),
                timestamp: Timestamp.now(),
                isReply: true,
                replyTo: commentId
            });
            
            showSuccessMessage('تم إضافة الرد بنجاح! ✅');
        } catch (error) {
            console.error('خطأ في إضافة الرد:', error);
            alert('حدث خطأ في إضافة الرد. حاول مرة أخرى.');
        }
    }
}

// تحميل التعليقات
function loadComments() {
    const commentsQuery = query(
        collection(db, 'comments'),
        where('ideaId', '==', ideaId)
    );
    
    onSnapshot(commentsQuery, (snapshot) => {
        const commentsContainer = document.getElementById('commentsContainer');
        
        if (snapshot.empty) {
            commentsContainer.innerHTML = '<div class="no-comments">لا توجد تعليقات بعد. كن أول من يعلق!</div>';
            updateRatingStats([]);
            return;
        }
        
        // تجميع التعليقات والردود
        const allComments = [];
        
        snapshot.forEach((doc) => {
            const comment = { id: doc.id, ...doc.data() };
            allComments.push(comment);
        });
        
        // فصل التعليقات الأصلية عن الردود
        const mainComments = allComments.filter(c => !c.isReply);
        const replies = allComments.filter(c => c.isReply);
        
        // ترتيب التعليقات حسب التاريخ
        mainComments.sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return a.timestamp.toMillis() - b.timestamp.toMillis();
        });
        
        // عرض التعليقات
        commentsContainer.innerHTML = '';
        
        mainComments.forEach(comment => {
            const commentElement = createCommentElement(comment, replies);
            commentsContainer.appendChild(commentElement);
        });
    });
}

// إنشاء عنصر التعليق
function createCommentElement(comment, replies) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-card';
    
    // الردود الخاصة بهذا التعليق
    const commentReplies = replies.filter(r => r.replyTo === comment.id);
    
    // هل المستخدم الحالي هو صاحب الفكرة؟
    const isIdeaOwner = currentUser.id === ideaOwnerId;
    
    // إخفاء زر الرد إذا كان المستخدم هو صاحب التعليق
    const canReply = isIdeaOwner && comment.userId !== currentUser.id;
    
    commentDiv.innerHTML = `
        <div class="comment-header">
            <div class="comment-author">
                <span class="comment-icon">💬</span>
                <strong>${comment.userName}</strong>
            </div>
            <span class="comment-time">${formatTimestamp(comment.timestamp)}</span>
        </div>
        <div class="comment-body">${comment.comment}</div>
        <div class="comment-footer">
            ${canReply ? `<button class="btn-reply" onclick="window.addReply('${comment.id}', '${comment.userName}')">↩️ رد</button>` : ''}
        </div>
        <div class="replies-container" id="replies-${comment.id}"></div>
    `;
    
    // إضافة الردود
    if (commentReplies.length > 0) {
        const repliesContainer = commentDiv.querySelector(`#replies-${comment.id}`);
        commentReplies.forEach(reply => {
            const replyElement = createReplyElement(reply);
            repliesContainer.appendChild(replyElement);
        });
    }
    
    return commentDiv;
}

// إنشاء عنصر الرد
function createReplyElement(reply) {
    const replyDiv = document.createElement('div');
    replyDiv.className = 'reply-card';
    
    replyDiv.innerHTML = `
        <div class="reply-header">
            <div class="reply-author">
                <span class="reply-icon">💭</span>
                <strong>${reply.userName}</strong>
                ${reply.userId === ideaOwnerId ? '<span class="owner-badge">صاحب الفكرة</span>' : ''}
            </div>
            <span class="reply-time">${formatTimestamp(reply.timestamp)}</span>
        </div>
        <div class="reply-body">${reply.comment}</div>
    `;
    
    return replyDiv;
}

// تحديث إحصائيات التقييم
function updateRatingStats(ratings) {
    const supportCount = ratings.filter(r => r === 'support').length;
    const neutralCount = ratings.filter(r => r === 'neutral').length;
    const opposeCount = ratings.filter(r => r === 'oppose').length;
    
    document.getElementById('supportCount').textContent = supportCount;
    document.getElementById('neutralCount').textContent = neutralCount;
    document.getElementById('opposeCount').textContent = opposeCount;
}

// عرض رسالة نجاح
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        successDiv.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 300);
    }, 3000);
}

// جعل الدوال متاحة عالمياً
window.addReply = addReply;

// تحميل الفكرة عند تحميل الصفحة
loadIdeaDetails();
