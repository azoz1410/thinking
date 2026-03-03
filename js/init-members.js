import { db } from './firebase-config.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// هذا الملف لإضافة الأعضاء إلى Firestore (اختياري)
// يمكن تشغيله مرة واحدة فقط لإضافة الأعضاء

const members = [
    { id: 'member1', name: 'العضو الأول' },
    { id: 'member2', name: 'العضو الثاني' },
    { id: 'member3', name: 'العضو الثالث' },
    { id: 'member4', name: 'العضو الرابع' }
];

async function initMembers() {
    try {
        for (const member of members) {
            await addDoc(collection(db, 'members'), {
                id: member.id,
                name: member.name
            });
        }
        console.log('تمت إضافة الأعضاء بنجاح!');
    } catch (error) {
        console.error('خطأ في إضافة الأعضاء:', error);
    }
}

// لتشغيل الدالة، قم بفتح Console في المتصفح واكتب: initMembers()
// أو قم بإلغاء التعليق عن السطر التالي:
// initMembers();

window.initMembers = initMembers;
