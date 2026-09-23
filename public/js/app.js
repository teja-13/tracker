/**
 * UCSR Placement Tracker - Frontend Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    drives: [],
    currentView: 'dashboard',
    sortKey: 'driveDate',
    sortOrder: 'asc',
    editingDriveId: null,
    deletingDriveId: null,
    editingResumeDriveId: null
  };

  // DOM Elements
  const elements = {
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileCloseBtn: document.getElementById('mobile-close-btn'),
    navItems: document.querySelectorAll('.nav-item'),
    viewTitle: document.getElementById('view-title'),

    // Sections
    sectionDashboard: document.getElementById('section-dashboard'),
    sectionBeyond: document.getElementById('section-beyond'),
    sectionUpcoming: document.getElementById('section-upcoming'),
    sectionApplied: document.getElementById('section-applied'),
    sectionPast: document.getElementById('section-past'),
    sectionAll: document.getElementById('section-all'),
    sectionResume: document.getElementById('section-resume'),

    // Dashboard Content
    dashboardContent: document.getElementById('dashboard-content'),

    // Table Bodies & Empty States
    tbodyBeyond: document.getElementById('tbody-beyond'),
    emptyBeyond: document.getElementById('empty-beyond'),
    tbodyUpcoming: document.getElementById('tbody-upcoming'),
    emptyUpcoming: document.getElementById('empty-upcoming'),
    tbodyApplied: document.getElementById('tbody-applied'),
    emptyApplied: document.getElementById('empty-applied'),
    tbodyPast: document.getElementById('tbody-past'),
    emptyPast: document.getElementById('empty-past'),
    tbodyAll: document.getElementById('tbody-all'),
    emptyAll: document.getElementById('empty-all'),
    tbodyResume: document.getElementById('tbody-resume'),
    emptyResume: document.getElementById('empty-resume'),

    // Main Modal & Form Elements
    openAddModalBtn: document.getElementById('open-add-modal-btn'),
    driveModal: document.getElementById('drive-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    modalSubmitText: document.getElementById('modal-submit-text'),
    driveForm: document.getElementById('drive-form'),
    driveIdInput: document.getElementById('drive-id'),
    companyNameInput: document.getElementById('company-name'),
    driveDateInput: document.getElementById('drive-date'),
    companyRoleInput: document.getElementById('company-role'),
    driveTypeSelect: document.getElementById('drive-type'),
    groupStatus: document.getElementById('group-status'),
    driveStatusSelect: document.getElementById('drive-status'),
    groupExamStatus: document.getElementById('group-exam-status'),
    examStatusSelect: document.getElementById('exam-status'),

    // Resume Modal & Form Elements
    resumeModal: document.getElementById('resume-modal'),
    resumeModalCloseBtn: document.getElementById('resume-modal-close-btn'),
    resumeModalCancelBtn: document.getElementById('resume-modal-cancel-btn'),
    resumeForm: document.getElementById('resume-form'),
    resumeDriveIdInput: document.getElementById('resume-drive-id'),
    resumeCompanyNameInput: document.getElementById('resume-company-name'),
    resumeLinkInput: document.getElementById('resume-link-input'),

    // Delete Modal
    deleteModal: document.getElementById('delete-modal'),
    deleteWarningText: document.getElementById('delete-warning-text'),
    deleteCancelBtn: document.getElementById('delete-cancel-btn'),
    deleteConfirmBtn: document.getElementById('delete-confirm-btn'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // Constant definitions
  const APPLIED_STATUS_LIST = ['Applied', 'Shortlisted', 'Test Completed', 'Interview', 'Selected', 'Rejected'];
  const STATUS_OPTIONS = ['Upcoming', 'Applied', 'Shortlisted', 'Test Completed', 'Interview', 'Selected', 'Rejected', 'Completed'];
  const EXAM_STATUS_OPTIONS = ['Not Completed', 'Completed'];

  // --- Helper Functions: Date & Countdown ---

  function getStartOfDay(dateInput) {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function getToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function getCountdownText(driveDate) {
    if (!driveDate) return 'Date TBD';
    const driveDay = getStartOfDay(driveDate);
    const today = getToday();
    if (!driveDay) return 'Date TBD';

    const diffTime = driveDay.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) return 'Completed';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} Days Left`;
  }

  function formatDate(dateInput) {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // --- API Calls ---

  async function loadDrives() {
    try {
      const res = await fetch('/api/drives');
      if (!res.ok) throw new Error('Failed to load placement drives');
      state.drives = await res.json();
      renderCurrentView();
    } catch (err) {
      showToast('Error connecting to backend server', 'error');
      console.error(err);
    }
  }

  async function createDrive(data) {
    try {
      const res = await fetch('/api/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add drive');
      }
      showToast(`Drive for "${data.companyName}" added`, 'success');
      closeModal();
      await loadDrives();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function updateDrive(id, data) {
    try {
      const res = await fetch(`/api/drives/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update drive');
      }
      showToast('Placement drive updated', 'success');
      closeModal();
      closeResumeModal();
      await loadDrives();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function deleteDrive(id) {
    try {
      const res = await fetch(`/api/drives/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete drive');
      showToast('Placement drive deleted', 'success');
      closeDeleteModal();
      await loadDrives();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // --- Section Navigation ---

  function switchSection(viewName) {
    state.currentView = viewName;

    elements.navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Hide all sections
    elements.sectionDashboard.style.display = 'none';
    elements.sectionBeyond.style.display = 'none';
    elements.sectionUpcoming.style.display = 'none';
    elements.sectionApplied.style.display = 'none';
    elements.sectionPast.style.display = 'none';
    elements.sectionAll.style.display = 'none';
    elements.sectionResume.style.display = 'none';

    // Show ONLY active section
    if (viewName === 'dashboard') elements.sectionDashboard.style.display = 'block';
    else if (viewName === 'beyond') elements.sectionBeyond.style.display = 'block';
    else if (viewName === 'upcoming') elements.sectionUpcoming.style.display = 'block';
    else if (viewName === 'applied') elements.sectionApplied.style.display = 'block';
    else if (viewName === 'past') elements.sectionPast.style.display = 'block';
    else if (viewName === 'all') elements.sectionAll.style.display = 'block';
    else if (viewName === 'resume') elements.sectionResume.style.display = 'block';

    renderCurrentView();
  }

  function renderCurrentView() {
    const today = getToday();

    if (state.currentView === 'dashboard') renderDashboard(today);
    else if (state.currentView === 'beyond') renderBeyondDrives();
    else if (state.currentView === 'upcoming') renderUpcomingDrives(today);
    else if (state.currentView === 'applied') renderAppliedDrives();
    else if (state.currentView === 'past') renderPastDrives(today);
    else if (state.currentView === 'all') renderAllDrives();
    else if (state.currentView === 'resume') renderResumeView();
  }

  // 1. Dashboard View
  function renderDashboard(today) {
    if (state.drives.length === 0) {
      elements.dashboardContent.innerHTML = `<div class="empty-dashboard-msg">No placement drives added yet.</div>`;
      return;
    }

    let campusCount = 0;
    let beyondCount = 0;
    let upcomingCount = 0;
    let appliedCount = 0;
    let examCompletedCount = 0;
    let interviewCount = 0;
    let selectedCount = 0;
    let rejectedCount = 0;
    let pastCount = 0;

    state.drives.forEach(d => {
      const type = d.driveType || 'Campus Drive';
      if (type === 'Beyond Drive') beyondCount++;
      else campusCount++;

      const driveDay = getStartOfDay(d.driveDate);
      const isPast = driveDay && driveDay.getTime() < today.getTime();

      if (!isPast) upcomingCount++;
      else pastCount++;

      if (APPLIED_STATUS_LIST.includes(d.status)) appliedCount++;
      if (d.examStatus === 'Completed') examCompletedCount++;
      if (d.status === 'Interview') interviewCount++;
      if (d.status === 'Selected') selectedCount++;
      if (d.status === 'Rejected') rejectedCount++;
    });

    elements.dashboardContent.innerHTML = `
      <table class="dashboard-table">
        <tbody>
          <tr><td class="stat-name">Total Drives</td><td class="stat-count">${state.drives.length}</td></tr>
          <tr><td class="stat-name">Campus Drives</td><td class="stat-count">${campusCount}</td></tr>
          <tr><td class="stat-name">Beyond Drives</td><td class="stat-count">${beyondCount}</td></tr>
          <tr><td class="stat-name">Upcoming Drives</td><td class="stat-count">${upcomingCount}</td></tr>
          <tr><td class="stat-name">Applied</td><td class="stat-count">${appliedCount}</td></tr>
          <tr><td class="stat-name">Exam Completed</td><td class="stat-count">${examCompletedCount}</td></tr>
          <tr><td class="stat-name">Interviews</td><td class="stat-count">${interviewCount}</td></tr>
          <tr><td class="stat-name">Selected</td><td class="stat-count">${selectedCount}</td></tr>
          <tr><td class="stat-name">Rejected</td><td class="stat-count">${rejectedCount}</td></tr>
          <tr><td class="stat-name">Past Drives</td><td class="stat-count">${pastCount}</td></tr>
        </tbody>
      </table>
    `;
  }

  // 2. Beyond Drives View
  function renderBeyondDrives() {
    const beyondDrives = state.drives.filter(d => (d.driveType || 'Campus Drive') === 'Beyond Drive');

    if (beyondDrives.length === 0) {
      elements.tbodyBeyond.innerHTML = '';
      elements.emptyBeyond.style.display = 'block';
    } else {
      elements.emptyBeyond.style.display = 'none';
      renderTableRows(elements.tbodyBeyond, beyondDrives);
    }
  }

  // 3. Upcoming Drives View
  function renderUpcomingDrives(today) {
    const upcomingDrives = state.drives.filter(d => {
      if (!d.driveDate) return true;
      const driveDay = getStartOfDay(d.driveDate);
      return driveDay && driveDay.getTime() >= today.getTime();
    });

    upcomingDrives.sort((a, b) => {
      const dateA = a.driveDate ? new Date(a.driveDate).getTime() : 8640000000000000;
      const dateB = b.driveDate ? new Date(b.driveDate).getTime() : 8640000000000000;
      return dateA - dateB;
    });

    if (upcomingDrives.length === 0) {
      elements.tbodyUpcoming.innerHTML = '';
      elements.emptyUpcoming.style.display = 'block';
    } else {
      elements.emptyUpcoming.style.display = 'none';
      renderTableRows(elements.tbodyUpcoming, upcomingDrives);
    }
  }

  // 4. Applied Drives View
  function renderAppliedDrives() {
    const appliedDrives = state.drives.filter(d => APPLIED_STATUS_LIST.includes(d.status));

    if (appliedDrives.length === 0) {
      elements.tbodyApplied.innerHTML = '';
      elements.emptyApplied.style.display = 'block';
    } else {
      elements.emptyApplied.style.display = 'none';
      renderTableRows(elements.tbodyApplied, appliedDrives);
    }
  }

  // 5. Past Drives View
  function renderPastDrives(today) {
    const pastDrives = state.drives.filter(d => {
      if (!d.driveDate) return false;
      const driveDay = getStartOfDay(d.driveDate);
      return driveDay && driveDay.getTime() < today.getTime();
    });

    pastDrives.sort((a, b) => new Date(b.driveDate) - new Date(a.driveDate));

    if (pastDrives.length === 0) {
      elements.tbodyPast.innerHTML = '';
      elements.emptyPast.style.display = 'block';
    } else {
      elements.emptyPast.style.display = 'none';
      renderTableRows(elements.tbodyPast, pastDrives);
    }
  }

  // 6. All Drives View
  function renderAllDrives() {
    let allDrives = [...state.drives];

    allDrives.sort((a, b) => {
      let valA = a[state.sortKey] || '';
      let valB = b[state.sortKey] || '';

      if (state.sortKey === 'driveDate') {
        valA = a.driveDate ? new Date(a.driveDate).getTime() : 0;
        valB = b.driveDate ? new Date(b.driveDate).getTime() : 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return state.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    if (allDrives.length === 0) {
      elements.tbodyAll.innerHTML = '';
      elements.emptyAll.style.display = 'block';
    } else {
      elements.emptyAll.style.display = 'none';
      renderTableRows(elements.tbodyAll, allDrives);
    }
  }

  // 7. Resume Section View (ONLY Company Name & Resume Link)
  function renderResumeView() {
    if (state.drives.length === 0) {
      elements.tbodyResume.innerHTML = '';
      elements.emptyResume.style.display = 'block';
      return;
    }

    elements.emptyResume.style.display = 'none';
    elements.tbodyResume.innerHTML = '';

    state.drives.forEach((drive, index) => {
      const tr = document.createElement('tr');

      const resumeLinkHTML = drive.resumeLink && drive.resumeLink.trim()
        ? `<a href="${escapeHTML(drive.resumeLink)}" target="_blank" rel="noopener noreferrer" class="link-btn resume-btn">📄 View Resume</a>`
        : '-';

      const actionBtnText = drive.resumeLink && drive.resumeLink.trim() ? 'Edit Link' : '+ Add Link';

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${escapeHTML(drive.companyName)}</strong></td>
        <td>${resumeLinkHTML}</td>
        <td>
          <button class="btn btn-secondary btn-sm upload-resume-btn" data-id="${drive._id}">${actionBtnText}</button>
        </td>
      `;

      tr.querySelector('.upload-resume-btn').addEventListener('click', () => {
        openResumeModal(drive);
      });

      elements.tbodyResume.appendChild(tr);
    });
  }

  // --- Table Rows Renderer for Main Drives Tables ---

  function renderTableRows(tbodyElement, drivesList) {
    tbodyElement.innerHTML = '';

    drivesList.forEach((drive, index) => {
      const tr = document.createElement('tr');

      const countdownText = getCountdownText(drive.driveDate);
      const roleText = drive.role && drive.role.trim() ? escapeHTML(drive.role) : '-';
      const typeText = drive.driveType || 'Campus Drive';
      const typeBadgeClass = typeText === 'Beyond Drive' ? 'beyond' : 'campus';

      let statusOptionsHTML = STATUS_OPTIONS.map(opt =>
        `<option value="${opt}" ${drive.status === opt ? 'selected' : ''}>${opt}</option>`
      ).join('');

      const statusSelectHTML = `
        <select class="table-select status-select status-${slugify(drive.status)}" data-id="${drive._id}">
          ${statusOptionsHTML}
        </select>
      `;

      const currentExamStatus = drive.examStatus || 'Not Completed';
      let examOptionsHTML = EXAM_STATUS_OPTIONS.map(opt =>
        `<option value="${opt}" ${currentExamStatus === opt ? 'selected' : ''}>${opt}</option>`
      ).join('');

      const examSelectHTML = `
        <select class="table-select exam-select exam-${slugify(currentExamStatus)}" data-id="${drive._id}">
          ${examOptionsHTML}
        </select>
      `;

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${escapeHTML(drive.companyName)}</strong></td>
        <td>${formatDate(drive.driveDate)}</td>
        <td>${roleText}</td>
        <td><span class="type-badge ${typeBadgeClass}">${escapeHTML(typeText)}</span></td>
        <td>${countdownText}</td>
        <td>${statusSelectHTML}</td>
        <td>${examSelectHTML}</td>
        <td>
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${drive._id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${drive._id}">Delete</button>
        </td>
      `;

      const statusSelect = tr.querySelector('.status-select');
      statusSelect.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        await updateDrive(drive._id, { status: newStatus });
      });

      const examSelect = tr.querySelector('.exam-select');
      examSelect.addEventListener('change', async (e) => {
        const newExamStatus = e.target.value;
        await updateDrive(drive._id, { examStatus: newExamStatus });
      });

      tr.querySelector('.edit-btn').addEventListener('click', () => {
        openAddOrEditModal(drive);
      });

      tr.querySelector('.delete-btn').addEventListener('click', () => {
        openDeleteModal(drive);
      });

      tbodyElement.appendChild(tr);
    });
  }

  function slugify(text) {
    return String(text).toLowerCase().replace(/\s+/g, '-');
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Main Drive Modal Helpers ---

  function openAddOrEditModal(driveToEdit = null) {
    elements.driveForm.reset();

    if (driveToEdit) {
      state.editingDriveId = driveToEdit._id;
      elements.modalTitle.textContent = 'Edit Placement Drive';
      elements.modalSubmitText.textContent = 'Update Drive';
      elements.driveIdInput.value = driveToEdit._id;
      elements.companyNameInput.value = driveToEdit.companyName || '';

      if (driveToEdit.driveDate) {
        const d = new Date(driveToEdit.driveDate);
        elements.driveDateInput.value = d.toISOString().split('T')[0];
      } else {
        elements.driveDateInput.value = '';
      }

      elements.companyRoleInput.value = driveToEdit.role || '';
      elements.driveTypeSelect.value = driveToEdit.driveType || 'Campus Drive';

      elements.groupStatus.style.display = 'block';
      elements.groupExamStatus.style.display = 'block';
      elements.driveStatusSelect.value = driveToEdit.status || 'Upcoming';
      elements.examStatusSelect.value = driveToEdit.examStatus || 'Not Completed';
    } else {
      state.editingDriveId = null;
      elements.modalTitle.textContent = '+ Add Placement Drive';
      elements.modalSubmitText.textContent = 'Save Drive';
      elements.driveIdInput.value = '';

      if (state.currentView === 'beyond') {
        elements.driveTypeSelect.value = 'Beyond Drive';
      } else {
        elements.driveTypeSelect.value = 'Campus Drive';
      }

      elements.groupStatus.style.display = 'none';
      elements.groupExamStatus.style.display = 'none';
      elements.driveStatusSelect.value = 'Upcoming';
      elements.examStatusSelect.value = 'Not Completed';
    }

    elements.driveModal.style.display = 'flex';
    elements.companyNameInput.focus();
  }

  function closeModal() {
    elements.driveModal.style.display = 'none';
    elements.driveForm.reset();
    state.editingDriveId = null;
  }

  // --- Dedicated Resume Modal Helpers ---

  function openResumeModal(drive) {
    state.editingResumeDriveId = drive._id;
    elements.resumeDriveIdInput.value = drive._id;
    elements.resumeCompanyNameInput.value = drive.companyName || '';
    elements.resumeLinkInput.value = drive.resumeLink || '';
    elements.resumeModal.style.display = 'flex';
    elements.resumeLinkInput.focus();
  }

  function closeResumeModal() {
    elements.resumeModal.style.display = 'none';
    elements.resumeForm.reset();
    state.editingResumeDriveId = null;
  }

  function openDeleteModal(drive) {
    state.deletingDriveId = drive._id;
    elements.deleteWarningText.textContent = `Are you sure you want to delete "${drive.companyName}"?`;
    elements.deleteModal.style.display = 'flex';
  }

  function closeDeleteModal() {
    elements.deleteModal.style.display = 'none';
    state.deletingDriveId = null;
  }

  // --- Toast Helpers ---

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    toast.innerHTML = `<span>${type === 'error' ? '⚠' : '✓'}</span> <span>${escapeHTML(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- Event Listeners ---

  function setupEventListeners() {
    elements.mobileMenuBtn.addEventListener('click', () => {
      elements.sidebar.classList.add('open');
      elements.sidebarOverlay.classList.add('active');
    });

    const closeSidebar = () => {
      elements.sidebar.classList.remove('open');
      elements.sidebarOverlay.classList.remove('active');
    };

    elements.mobileCloseBtn.addEventListener('click', closeSidebar);
    elements.sidebarOverlay.addEventListener('click', closeSidebar);

    elements.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        closeSidebar();
        switchSection(view);
      });
    });

    elements.openAddModalBtn.addEventListener('click', () => openAddOrEditModal());
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.modalCancelBtn.addEventListener('click', closeModal);

    // Main Drive Form Submit Handler
    elements.driveForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const companyName = elements.companyNameInput.value.trim();
      const driveDate = elements.driveDateInput.value;
      const role = elements.companyRoleInput.value.trim();
      const driveType = elements.driveTypeSelect.value;

      if (!companyName) {
        showToast('Company Name is required', 'error');
        return;
      }

      const driveData = {
        companyName,
        driveDate: driveDate || null,
        role,
        driveType
      };

      if (state.editingDriveId) {
        driveData.status = elements.driveStatusSelect.value;
        driveData.examStatus = elements.examStatusSelect.value;
        await updateDrive(state.editingDriveId, driveData);
      } else {
        driveData.status = 'Upcoming';
        driveData.examStatus = 'Not Completed';
        await createDrive(driveData);
      }
    });

    // Dedicated Resume Form Submit Handler
    elements.resumeModalCloseBtn.addEventListener('click', closeResumeModal);
    elements.resumeModalCancelBtn.addEventListener('click', closeResumeModal);
    elements.resumeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const resumeLink = elements.resumeLinkInput.value.trim();
      if (state.editingResumeDriveId) {
        await updateDrive(state.editingResumeDriveId, { resumeLink });
      }
    });

    elements.deleteCancelBtn.addEventListener('click', closeDeleteModal);
    elements.deleteConfirmBtn.addEventListener('click', async () => {
      if (state.deletingDriveId) {
        await deleteDrive(state.deletingDriveId);
      }
    });

    const sortableHeaders = document.querySelectorAll('#table-all th.sortable');
    sortableHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const sortKey = th.getAttribute('data-sort');
        if (state.sortKey === sortKey) {
          state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortKey = sortKey;
          state.sortOrder = 'asc';
        }
        renderAllDrives();
      });
    });

    window.addEventListener('click', (e) => {
      if (e.target === elements.driveModal) closeModal();
      if (e.target === elements.resumeModal) closeResumeModal();
      if (e.target === elements.deleteModal) closeDeleteModal();
    });
  }

  setupEventListeners();
  switchSection('dashboard');
  loadDrives();
});
