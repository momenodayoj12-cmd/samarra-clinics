const clinicsGrid = document.getElementById('clinicsGrid');
const searchInput = document.getElementById('searchInput');
const specialtyFilter = document.getElementById('specialtyFilter');
const symptomFilter = document.getElementById('symptomFilter');
const dailyTipBox = document.getElementById('dailyTip');
const showFavoritesBtn = document.getElementById('showFavoritesBtn');

// محفظة المريض (تخزين الأطباء المفضلين في جهاز المستخدم)
let savedDoctors = JSON.parse(localStorage.getItem('mySamarraDoctors')) || [];
let showingOnlyFavorites = false;

// 1. تهيئة خريطة سامراء التفاعلية
const samarraMap = L.map('samarraMap').setView([34.1961, 43.8920], 13); // مركز سامراء

// ربط الخريطة بخوادم OpenStreetMap المجانية
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(samarraMap);

// إضافة الأطباء كدبابيس على الخريطة
function addMarkersToMap() {
    doctorsData.forEach(doc => {
        if (doc.lat && doc.lng) {
            // نص النافذة المنبثقة عند الضغط على الدبوس
            const popupContent = `<b>${doc.name}</b><br>${doc.specialty}<br>${doc.address}`;
            const marker = L.marker([doc.lat, doc.lng]).addTo(samarraMap);
            marker.bindPopup(popupContent);
        }
    });
}

// 2. تعبئة قائمة التخصصات
function populateSpecialties() {
    const specialties = [...new Set(doctorsData.map(doc => doc.specialty))];
    specialties.forEach(specialty => {
        const option = document.createElement('option');
        option.value = specialty;
        option.textContent = specialty;
        specialtyFilter.appendChild(option);
    });
}

// 3. عرض نصيحة عشوائية لطبيب VIP أو Premium
function showDailyTip() {
    const premiumDoctors = doctorsData.filter(doc => (doc.isVIP || doc.isPremium) && doc.dailyTip);
    if (premiumDoctors.length > 0) {
        const randomDoc = premiumDoctors[Math.floor(Math.random() * premiumDoctors.length)];
        dailyTipBox.innerHTML = `<strong><i class="fa-solid fa-lightbulb"></i> نصيحة اليوم من ${randomDoc.name}:</strong> ${randomDoc.dailyTip}`;
    } else {
        dailyTipBox.style.display = 'none';
    }
}

// 4. ترتيب الأطباء (VIP أولاً)
function sortDoctors(doctors) {
    return doctors.sort((a, b) => {
        if (a.isVIP && !b.isVIP) return -1;
        if (!a.isVIP && b.isVIP) return 1;
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        return 0;
    });
}

// 5. حفظ أو إزالة الطبيب من المفضلة
window.toggleSaveDoctor = function (doctorId) {
    const index = savedDoctors.indexOf(doctorId);
    if (index === -1) {
        savedDoctors.push(doctorId); // إضافة
    } else {
        savedDoctors.splice(index, 1); // إزالة
    }
    localStorage.setItem('mySamarraDoctors', JSON.stringify(savedDoctors));
    filterDoctors(); // إعادة رسم البطاقات لتحديث شكل القلب
}

// 6. رسم البطاقات
function renderDoctors(doctors) {
    clinicsGrid.innerHTML = '';

    if (doctors.length === 0) {
        clinicsGrid.innerHTML = '<h3 style="text-align:center; width:100%;">لا يوجد أطباء يطابقون بحثك حالياً.</h3>';
        return;
    }

    const sortedDoctors = sortDoctors(doctors);

    sortedDoctors.forEach(doctor => {
        let cardClass = '';
        if (doctor.isVIP) cardClass = 'vip-card';
        else if (doctor.isPremium) cardClass = 'premium-card';

        const isSaved = savedDoctors.includes(doctor.id);
        const whatsappMessage = encodeURIComponent(`مرحباً، أرغب بحجز موعد مع ${doctor.name}. جئتكم عن طريق (دليل عيادات سامراء).`);
        const whatsappLink = `https://wa.me/${doctor.whatsapp}?text=${whatsappMessage}`;

        const card = document.createElement('div');
        card.className = `doctor-card ${cardClass}`;

        card.innerHTML = `
            <button class="save-doctor-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveDoctor(${doctor.id})">
                <i class="fa-solid fa-heart"></i>
            </button>

            ${doctor.isVIP ? '<div class="vip-badge" style="right:15px; left:auto;"><i class="fa-solid fa-crown"></i> رعاية مميزة</div>' : ''}
            
            ${(doctor.isVIP || doctor.isPremium) ? `
                <div class="status-indicator" style="margin-top: 25px;">
                    <span class="dot ${doctor.isOpen ? 'open' : 'closed'}"></span>
                    ${doctor.isOpen ? 'العيادة مفتوحة الآن' : 'العيادة مغلقة'}
                </div>
                ${doctor.onVacation ? '<div class="vacation-notice"><i class="fa-solid fa-plane-slash"></i> العيادة في إجازة حالياً</div>' : ''}
            ` : ''}

            <h2 class="doctor-name" style="${!(doctor.isVIP || doctor.isPremium) ? 'margin-top: 25px;' : ''}">
                ${doctor.name} 
                ${(doctor.isVIP || doctor.isPremium) ? '<i class="fa-solid fa-circle-check verified-icon" title="طبيب موثق"></i>' : ''}
            </h2>
            <div class="doctor-specialty">${doctor.specialty}</div>
            
            ${((doctor.isVIP || doctor.isPremium) && doctor.announcement) ? `
                <div class="announcement"><i class="fa-solid fa-bullhorn"></i> ${doctor.announcement}</div>
            ` : ''}

            ${(doctor.isVIP || doctor.isPremium) ? `
                <div class="thanks-count"><i class="fa-solid fa-heart"></i> تلقى ${doctor.thanksCount} كلمة شكر</div>
            ` : ''}
            
            <div class="card-actions">
                ${doctor.whatsapp && (doctor.isVIP || doctor.isPremium) ? `
                    <a href="${whatsappLink}" target="_blank" class="btn btn-whatsapp">
                        <i class="fa-brands fa-whatsapp"></i> احجز الآن (واتساب)
                    </a>
                ` : ''}
                <a href="tel:${doctor.phone}" class="btn btn-call"><i class="fa-solid fa-phone"></i> اتصال</a>
                <button onclick="shareClinic('${doctor.name}', '${doctor.phone}')" class="btn btn-share">
                    <i class="fa-solid fa-share-nodes"></i> شارك العيادة
                </button>
            </div>
        `;
        clinicsGrid.appendChild(card);
    });
}

window.shareClinic = function (name, phone) {
    const shareData = { title: 'دليل عيادات سامراء', text: `أنصحك بزيارة ${name}، الحجز: ${phone}. وجدته عبر دليل عيادات سامراء.`, url: window.location.href };
    if (navigator.share) navigator.share(shareData); else alert('ميزة المشاركة غير مدعومة.');
}

// 7. البحث والتصفية وعرض المفضلين
function filterDoctors() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedSpecialty = specialtyFilter.value;
    const selectedSymptom = symptomFilter.value;

    const filtered = doctorsData.filter(doctor => {
        const matchesName = doctor.name.toLowerCase().includes(searchTerm);
        const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialty === selectedSpecialty;
        const matchesSymptom = selectedSymptom === 'all' || (doctor.symptoms && doctor.symptoms.includes(selectedSymptom));

        // إذا كان المريض ضغط على زر "أطبائي"، نعرض فقط المحفوظين
        const matchesFavorites = showingOnlyFavorites ? savedDoctors.includes(doctor.id) : true;

        return matchesName && matchesSpecialty && matchesSymptom && matchesFavorites;
    });

    renderDoctors(filtered);
}

// زر تبديل عرض الأطباء المفضلين
showFavoritesBtn.addEventListener('click', () => {
    showingOnlyFavorites = !showingOnlyFavorites;
    showFavoritesBtn.style.backgroundColor = showingOnlyFavorites ? '#c0392b' : '#e74c3c';
    showFavoritesBtn.innerHTML = showingOnlyFavorites ? '<i class="fa-solid fa-times"></i> إخفاء أطبائي' : '<i class="fa-solid fa-heart"></i> أطبائي';
    filterDoctors();
});

// ربط أحداث البحث
searchInput.addEventListener('input', filterDoctors);
specialtyFilter.addEventListener('change', filterDoctors);
symptomFilter.addEventListener('change', filterDoctors);

document.getElementById('nightPharmaciesBtn').addEventListener('click', () => { alert("سيتم عرض الصيدليات الخافرة قريباً!"); });

// 8. التشغيل الأولي
populateSpecialties();
showDailyTip();
addMarkersToMap();
renderDoctors(doctorsData);