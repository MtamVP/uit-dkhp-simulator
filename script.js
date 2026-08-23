// -------------------------
// STATE MANAGEMENT
// -------------------------
let rawData = [];
let registeredCourses = JSON.parse(localStorage.getItem('registered_courses')) || [];

let selectedCoursesToRegister = new Map(); // malop -> course object
let selectedCoursesToDelete = new Map(); // malop -> course object

// -------------------------
// TAB SWITCHING LOGIC
// -------------------------
function switchTab(tabId) {
    document.getElementById('tab-dashboard').style.display = 'none';
    document.getElementById('tab-register').style.display = 'none';
    document.getElementById('tab-registered').style.display = 'none';
    document.getElementById('tab-guide').style.display = 'none';
    
    document.getElementById('nav-dashboard').classList.remove('active');
    document.getElementById('nav-register').classList.remove('active');
    document.getElementById('nav-registered').classList.remove('active');
    document.getElementById('nav-guide').classList.remove('active');
    
    document.getElementById('tab-' + tabId).style.display = 'block';
    document.getElementById('nav-' + tabId).classList.add('active');
    
    // Cập nhật URL trên trình duyệt
    const pathMap = {
        'dashboard': '/dashboard',
        'register': '/courses',
        'registered': '/registered',
        'guide': '/guide'
    };
    if (window.location.pathname !== pathMap[tabId]) {
        history.pushState({ tab: tabId }, '', pathMap[tabId]);
    }
    
    // Ẩn/Hiện thanh nổi tuỳ theo tab
    if (tabId === 'register') {
        updateSelectedBar();
        document.getElementById('selectedDeleteBar').style.display = 'none';
    } else if (tabId === 'registered') {
        renderRegisteredTable();
        updateSelectedDeleteBar();
        document.getElementById('selectedBar').style.display = 'none';
    } else {
        document.getElementById('selectedBar').style.display = 'none';
        document.getElementById('selectedDeleteBar').style.display = 'none';
    }
}

// Lắng nghe sự kiện nút Back/Forward của trình duyệt
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.tab) {
        switchTab(e.state.tab);
    } else {
        const path = window.location.pathname;
        if (path === '/dashboard') switchTab('dashboard');
        else if (path === '/registered') switchTab('registered');
        else if (path === '/guide') switchTab('guide');
        else switchTab('register');
    }
});

// Khởi tạo tab mặc định dựa vào URL ban đầu
window.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path === '/dashboard') switchTab('dashboard');
    else if (path === '/registered') switchTab('registered');
    else if (path === '/guide') switchTab('guide');
    else switchTab('register');
});

// -------------------------
// SELECTED BAR LOGIC
// -------------------------
document.getElementById('tableBody').addEventListener('change', function(e) {
    if(e.target && e.target.classList.contains('course-checkbox')) {
        const malop = e.target.value;
        if(e.target.checked) {
            const course = rawData.find(c => c.malop === malop);
            if(course) selectedCoursesToRegister.set(malop, course);
        } else {
            selectedCoursesToRegister.delete(malop);
        }
        updateSelectedBar();
    }
});

function removeSelected(malop) {
    selectedCoursesToRegister.delete(malop);
    // Uncheck the checkbox in table if visible
    const cb = document.querySelector(`.course-checkbox[value="${malop}"]`);
    if(cb) cb.checked = false;
    updateSelectedBar();
}

function updateSelectedBar() {
    const bar = document.getElementById('selectedBar');
    const container = document.getElementById('selectedChipsContainer');
    const btn = document.getElementById('btnRegisterSelected');
    
    if (selectedCoursesToRegister.size === 0) {
        bar.style.display = 'none';
        return;
    }
    
    // Only show if we are on the register tab
    if (document.getElementById('tab-register').style.display !== 'none') {
        bar.style.display = 'flex';
    }
    
    container.innerHTML = '';
    let totalCredits = 0;
    
    selectedCoursesToRegister.forEach((course, malop) => {
        totalCredits += course.sotc;
        container.innerHTML += `
            <div class="chip">
                ${malop}(${course.sotc}) 
                <span class="chip-close" onclick="removeSelected('${malop}')">&times;</span>
            </div>
        `;
    });
    
    btn.innerText = `Đăng ký ${selectedCoursesToRegister.size} lớp, ${totalCredits} tc`;
}

// -------------------------
// DELETE SELECTED LOGIC
// -------------------------
document.getElementById('registeredTableBody').addEventListener('change', function(e) {
    if(e.target && e.target.classList.contains('course-delete-checkbox')) {
        const malop = e.target.value;
        if(e.target.checked) {
            const course = registeredCourses.find(c => c.malop === malop);
            if(course) selectedCoursesToDelete.set(malop, course);
        } else {
            selectedCoursesToDelete.delete(malop);
        }
        updateSelectedDeleteBar();
    }
});

function removeDeleteSelected(malop) {
    selectedCoursesToDelete.delete(malop);
    const cb = document.querySelector(`.course-delete-checkbox[value="${malop}"]`);
    if(cb) cb.checked = false;
    updateSelectedDeleteBar();
}

function updateSelectedDeleteBar() {
    const bar = document.getElementById('selectedDeleteBar');
    const container = document.getElementById('selectedDeleteChipsContainer');
    const btn = document.getElementById('btnDeleteSelected');
    
    if (selectedCoursesToDelete.size === 0) {
        bar.style.display = 'none';
        return;
    }
    
    if (document.getElementById('tab-registered').style.display !== 'none') {
        bar.style.display = 'flex';
    }
    
    container.innerHTML = '';
    let totalCredits = 0;
    
    selectedCoursesToDelete.forEach((course, malop) => {
        totalCredits += course.sotc;
        container.innerHTML += `
            <div class="chip" style="border-color: #dc3545; color: #dc3545;">
                ${malop}(${course.sotc}) 
                <span class="chip-close" onclick="removeDeleteSelected('${malop}')">&times;</span>
            </div>
        `;
    });
    
    btn.innerText = `Xoá ${selectedCoursesToDelete.size} lớp, ${totalCredits} tc`;
}

function deleteSelectedCourses() {
    if (selectedCoursesToDelete.size === 0) return;
    
    Swal.fire({
        title: 'Xác nhận huỷ',
        text: `Bạn có chắc chắn muốn huỷ đăng ký ${selectedCoursesToDelete.size} lớp này?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Không'
    }).then((result) => {
        if (result.isConfirmed) {
            let successListHtml = '';
            let successCount = 0;

            selectedCoursesToDelete.forEach((course, malop) => {
                registeredCourses = registeredCourses.filter(c => c.malop !== malop);
                successListHtml += `<div>${malop}: Huỷ đăng ký thành công</div>`;
                successCount++;
            });
            
            localStorage.setItem('registered_courses', JSON.stringify(registeredCourses));
            
            selectedCoursesToDelete.clear();
            updateSelectedDeleteBar();
            renderRegisteredTable();
            
            // Hiển thị Modal kết quả
            const modalTitle = document.querySelector('#resultModal h3');
            if (modalTitle) modalTitle.innerText = 'KẾT QUẢ HUỶ ĐĂNG KÝ';

            document.getElementById('successCount').innerText = successCount;
            document.getElementById('successList').innerHTML = successListHtml || '<div><i>Không có</i></div>';
            
            document.getElementById('errorCount').innerText = 0;
            document.getElementById('errorList').innerHTML = '<div><i>Không có</i></div>';
            
            document.getElementById('resultModal').style.display = 'flex';
        }
    });
}

// -------------------------
// SIMULATION LOGIC & MODAL
// -------------------------
function parseSchedule(tghoc) {
    if (!tghoc) return [];
    const regex = /T(\d)\s*\(([\d,]+)\)/g;
    let match;
    const sessions = [];
    while ((match = regex.exec(tghoc)) !== null) {
        const thu = parseInt(match[1]);
        const periods = match[2].split(',').map(Number);
        sessions.push({ thu, periods });
    }
    return sessions;
}

function checkConflict(courseA, courseB) {
    const sessionsA = parseSchedule(courseA.tghoc);
    const sessionsB = parseSchedule(courseB.tghoc);
    
    for (let sa of sessionsA) {
        for (let sb of sessionsB) {
            if (sa.thu === sb.thu) {
                const overlap = sa.periods.some(p => sb.periods.includes(p));
                if (overlap) return true;
            }
        }
    }
    return false;
}

function registerSelectedCourses() {
    if (selectedCoursesToRegister.size === 0) return;
    
    let successListHtml = '';
    let errorListHtml = '';
    let successCount = 0;
    let errorCount = 0;
    
    let pendingToAdd = Array.from(selectedCoursesToRegister.values());
    let currentRegistered = [...registeredCourses];
    let errors = new Map(); // malop -> reason
    
    // 1. Quét tìm danh sách các môn Lý Thuyết BẮT BUỘC có Thực Hành
    let globalBaseNeedsTH = new Set();
    rawData.forEach(c => {
        let isTH = c.malop.includes('.1') || c.malop.includes('.2') || c.malop.includes('.3');
        if (isTH) {
            let base = c.malop.substring(0, c.malop.lastIndexOf('.'));
            globalBaseNeedsTH.add(base);
        }
    });

    // 2. Lọc các môn đã đăng ký
    pendingToAdd = pendingToAdd.filter(course => {
        if (currentRegistered.find(c => c.malop === course.malop)) {
            errors.set(course.malop, "Đã đăng ký trước đó");
            return false;
        }
        return true;
    });

    // 3. Kiểm tra trùng lịch (với môn cũ & nội bộ môn mới)
    for (let i = 0; i < pendingToAdd.length; i++) {
        let c1 = pendingToAdd[i];
        if (errors.has(c1.malop)) continue;

        // Trùng với môn cũ
        for (let r of currentRegistered) {
            if (checkConflict(c1, r)) {
                errors.set(c1.malop, `Trùng lịch với ${r.malop}`);
                break;
            }
        }
        if (errors.has(c1.malop)) continue;
        
        // Trùng nội bộ môn mới
        for (let j = 0; j < pendingToAdd.length; j++) {
            if (i === j) continue;
            let c2 = pendingToAdd[j];
            if (errors.has(c2.malop)) continue;
            if (checkConflict(c1, c2)) {
                errors.set(c1.malop, `Trùng lịch với ${c2.malop}`);
                errors.set(c2.malop, `Trùng lịch với ${c1.malop}`);
            }
        }
    }
    
    pendingToAdd = pendingToAdd.filter(c => !errors.has(c.malop));

    // 4. Kiểm tra ràng buộc LT - TH (lặp lại đến khi không còn lỗi rơi rớt)
    let constraintChanged = true;
    while(constraintChanged) {
        constraintChanged = false;
        
        // Tạo map hiện trạng LT/TH
        let finalState = [...currentRegistered, ...pendingToAdd];
        let baseMapFinal = new Map();
        finalState.forEach(c => {
            let isTH = c.malop.includes('.1') || c.malop.includes('.2') || c.malop.includes('.3');
            let base = isTH ? c.malop.substring(0, c.malop.lastIndexOf('.')) : c.malop;
            if (!baseMapFinal.has(base)) baseMapFinal.set(base, { LT: null, TH: [] });
            if (isTH) baseMapFinal.get(base).TH.push(c);
            else baseMapFinal.get(base).LT = c;
        });

        // Duyệt ngược để xoá an toàn
        for (let i = pendingToAdd.length - 1; i >= 0; i--) {
            let c = pendingToAdd[i];
            let isTH = c.malop.includes('.1') || c.malop.includes('.2') || c.malop.includes('.3');
            let base = isTH ? c.malop.substring(0, c.malop.lastIndexOf('.')) : c.malop;
            let group = baseMapFinal.get(base);
            
            let hasError = false;
            let errorMsg = '';
            
            if (isTH) {
                if (!group.LT) {
                    hasError = true;
                    errorMsg = "Bắt buộc phải đăng ký cùng lớp Lý thuyết";
                }
            } else {
                if (globalBaseNeedsTH.has(base) && group.TH.length === 0) {
                    hasError = true;
                    errorMsg = "Bắt buộc phải đăng ký kèm lớp Thực hành";
                }
            }
            
            if (hasError) {
                errors.set(c.malop, errorMsg);
                pendingToAdd.splice(i, 1);
                constraintChanged = true;
                break; // Break để map lại từ đầu cho chắc chắn (Hiệu ứng Domino)
            }
        }
    }

    // 5. Tổng hợp kết quả
    pendingToAdd.forEach(course => {
        registeredCourses.push(course);
        successListHtml += `<div>${course.malop}: Đăng ký thành công</div>`;
        successCount++;
    });

    Array.from(selectedCoursesToRegister.values()).forEach(course => {
        if (errors.has(course.malop)) {
            errorListHtml += `<div>${course.malop}: <span style="color:#dc3545">Lỗi (${errors.get(course.malop)})</span></div>`;
            errorCount++;
        }
    });
    
    // Save state
    if(successCount > 0) {
        localStorage.setItem('registered_courses', JSON.stringify(registeredCourses));
    }
    
    // Cập nhật Modal
    const modalTitle = document.querySelector('#resultModal h3');
    if (modalTitle) modalTitle.innerText = 'KẾT QUẢ ĐĂNG KÝ';

    document.getElementById('successCount').innerText = successCount;
    document.getElementById('successList').innerHTML = successListHtml || '<div><i>Không có</i></div>';
    
    document.getElementById('errorCount').innerText = errorCount;
    document.getElementById('errorList').innerHTML = errorListHtml || '<div><i>Không có</i></div>';
    
    // Hiển thị Modal
    document.getElementById('resultModal').style.display = 'flex';
    
    // Dọn dẹp danh sách chọn
    selectedCoursesToRegister.clear();
    document.querySelectorAll('.course-checkbox:checked').forEach(cb => cb.checked = false);
    updateSelectedBar();
}

function closeModal() {
    document.getElementById('resultModal').style.display = 'none';
}

function renderRegisteredTable() {
    const tbody = document.getElementById('registeredTableBody');
    tbody.innerHTML = '';
    
    let totalCredits = 0;
    
    if (registeredCourses.length === 0) {
        document.getElementById('registered-title').innerText = `Đã đăng ký: 0 lớp (0 tín chỉ)`;
        tbody.innerHTML = `<tr><td colspan="7" style="background:#d9edf7; text-align:left; font-weight:bold; color: #31708f; padding: 15px;">Chưa có dữ liệu</td></tr>`;
        return;
    }
    
    registeredCourses.forEach(course => {
        totalCredits += course.sotc;
        
        const mamh = course.mamh || course.malop.split('.')[0];
        const tenMhHtml = `<b>${mamh}</b><br><span style="color:#666">${course.tenmh}</span>`;
        
        let thoiGian = course.tghoc || '';
        if (course.ngaybatdau && course.ngayketthuc) {
                thoiGian += `<br><span style="color: #666; font-size: 12px;">${course.ngaybatdau} &rarr; ${course.ngayketthuc}</span>`;
        }
        
        const isChecked = selectedCoursesToDelete.has(course.malop) ? 'checked' : '';
        
        const row = `
            <tr>
                <td>
                    <input type="checkbox" class="course-delete-checkbox" value="${course.malop}" ${isChecked} style="transform: scale(1.2); cursor: pointer; accent-color: #dc3545;">
                </td>
                <td class="text-blue" style="font-weight: bold;">${course.malop}</td>
                <td class="text-left text-blue">${tenMhHtml}</td>
                <td class="text-left text-blue">${thoiGian}</td>
                <td class="text-blue">${course.giangvien || ''}</td>
                <td>${course.sotc}</td>
                <td class="text-blue">${course.dadk}/${course.siso}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
    
    document.getElementById('registered-title').innerText = `Đã đăng ký: ${registeredCourses.length} lớp(${totalCredits} tín chỉ)`;
}

// -------------------------
// FETCH & RENDER LOGIC
// -------------------------
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const stats = document.getElementById('stats');
const tokenInput = document.getElementById('tokenInput');
const refreshBtn = document.getElementById('refreshBtn');
const autoRefreshCb = document.getElementById('autoRefresh');

tokenInput.value = localStorage.getItem('dkhp_token') || '';

function renderTable(data) {
    let htmlContent = '';
    data.forEach(course => {
        const conTrong = course.siso - course.dadk;
        
        let slotDisplay = '';
        if (conTrong > 0) {
            slotDisplay = `<span class="highlight-green">${conTrong} slot</span>`;
        } else {
            slotDisplay = `<span class="highlight-red">Hết chỗ</span>`;
        }
        
        const mamh = course.mamh || course.malop.split('.')[0];
        const tenMhFull = `${mamh} - ${course.tenmh}`;

        let thoiGian = course.tghoc || '';
        if (course.ngaybatdau && course.ngayketthuc) {
                thoiGian += `<br><span style="color: #666; font-size: 12px;">${course.ngaybatdau} &rarr; ${course.ngayketthuc}</span>`;
        }
        
        const giangVien = course.giangvien || '';
        
        // Mở khoá checkbox để mô phỏng, giữ trạng thái nếu đã check
        const isChecked = selectedCoursesToRegister.has(course.malop) ? 'checked' : '';
        const checkboxHtml = `<input type="checkbox" class="course-checkbox" value="${course.malop}" ${isChecked} style="transform: scale(1.2); cursor: pointer;">`;

        htmlContent += `
            <tr>
                <td class="checkbox-col">${checkboxHtml}</td>
                <td class="text-blue">${course.malop}</td>
                <td class="text-left text-blue">${tenMhFull}</td>
                <td>${course.sotc}</td>
                <td class="text-left text-blue">${thoiGian}</td>
                <td class="text-blue">${giangVien}</td>
                <td class="text-blue">${course.dadk}/${course.siso}</td>
                <td>${slotDisplay}</td>
            </tr>
        `;
    });
    tableBody.innerHTML = htmlContent;
}

async function fetchCourses(isAuto = false, isInitial = false) {
    let token = tokenInput.value.trim();
    
    if (token && !token.startsWith('Bearer ')) {
        token = 'Bearer ' + token;
        tokenInput.value = token;
    }
    
    if (token) {
        localStorage.setItem('dkhp_token', token);
    } else {
        localStorage.removeItem('dkhp_token');
    }
    
    const sharedTokenMsg = document.getElementById('sharedTokenMsg');
    if (sharedTokenMsg) {
        sharedTokenMsg.style.display = 'none';
        tokenInput.style.backgroundColor = '';
        tokenInput.style.borderColor = '';
    }
    
    refreshBtn.innerText = 'Đang tải...';
    refreshBtn.disabled = true;

    try {
        const targetUrl = '/api/courses';
        
        const headers = {
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = token;
        }
        
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            let errorMsg = 'Lỗi máy chủ: ' + response.status;
            try {
                const errorData = await response.json();
                if (errorData.error) errorMsg = errorData.error;
            } catch (e) {}
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        rawData = data.courses || data;
        
        if (!token && sharedTokenMsg) {
            sharedTokenMsg.style.display = 'block';
            tokenInput.style.backgroundColor = '#e8f5e9';
            tokenInput.style.borderColor = '#c3e6cb';
        } else if (token && !isAuto && !isInitial) {
            // Hiện lời cảm ơn nếu user tự nhập token và bấm Tải Dữ Liệu thành công
            Swal.fire({
                title: 'Cảm ơn bạn đã chia sẻ!',
                html: 'Hành động chia sẻ Token của bạn vừa giúp đỡ rất nhiều sinh viên khác.<br><br><i>Token của bạn đã được hệ thống mã hoá và lưu trữ an toàn trên cloudflare, không ai có thể xem được!</i>',
                icon: 'success',
                timer: 4500,
                showConfirmButton: false
            });
        }
        
        stats.innerText = `(Tổng cộng: ${rawData.length} lớp - Cập nhật lúc: ${new Date().toLocaleTimeString()})`;
        
        searchInput.dispatchEvent(new Event('input'));
        
    } catch (error) {
        if (!isAuto && !isInitial) {
            Swal.fire('Lỗi', error.message, 'error');
        } else if (isInitial) {
            document.getElementById('stats').innerText = `(${error.message})`;
            document.getElementById('stats').style.color = '#dc3545';
        }
        if (isAuto) autoRefreshCb.checked = false;
    } finally {
        refreshBtn.innerText = 'Tải Dữ Liệu';
        refreshBtn.disabled = false;
    }
}

refreshBtn.addEventListener('click', fetchCourses);

let intervalId = null;
autoRefreshCb.addEventListener('change', (e) => {
    if (e.target.checked) {
        if(rawData.length === 0) fetchCourses(true);
        intervalId = setInterval(() => fetchCourses(true), 10000);
    } else {
        if (intervalId) clearInterval(intervalId);
    }
});

searchInput.addEventListener('input', (e) => {
    const rawTerm = e.target.value.trim().toLowerCase();
    if (!rawTerm) {
        renderTable(rawData);
        return;
    }
    
    const terms = rawTerm.split(/[,\s;\n\r]+/).filter(t => t.length > 0);
    
    const filtered = rawData.filter(c => {
        return terms.some(term => 
            (c.malop && c.malop.toLowerCase().includes(term)) || 
            (c.tenmh && c.tenmh.toLowerCase().includes(term)) ||
            (c.mamh && c.mamh.toLowerCase().includes(term))
        );
    });
    renderTable(filtered);
});

// Không bắt buộc phải có Token mới gọi hàm ban đầu nữa
fetchCourses(false, true);

// POPUP WELCOME CHÀO MỪNG
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('hideWelcomePopup')) {
        Swal.fire({
            title: 'Một Người Vì Mọi Người!',
            html: `
                <div style="text-align: left; font-size: 15px; line-height: 1.6;">
                    <p>Chào mừng bạn đến với Hệ thống Đăng ký Học phần Mô phỏng!</p>
                    <p>Hệ thống có tính năng <b>Token Cộng Đồng</b>: Khi bạn dán Token vào có thể giúp những bạn khóa dưới cũng có thể xem được tình trạng môn học.</p>
                    <p><b>Cam kết bảo mật:</b> Token của bạn được mã hóa và lưu trực tiếp trên Cloudflare. Hệ thống chỉ dùng nó thay mặt bạn lấy dữ liệu môn học từ trường, <b>tuyệt đối không hiển thị</b> ra ngoài hay lưu vết trên trình duyệt của người khác. An toàn 100%!</p>
                    <hr>
                    <label style="display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer; font-size: 14px; margin-top: 15px;">
                        <input type="checkbox" id="dontShowAgain"> Không hiển thị lại thông báo này
                    </label>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Tuyệt vời, tôi đã hiểu!',
            confirmButtonColor: '#28a745',
            preConfirm: () => {
                const cb = document.getElementById('dontShowAgain');
                if (cb && cb.checked) {
                    localStorage.setItem('hideWelcomePopup', 'true');
                }
            }
        });
    }
});
