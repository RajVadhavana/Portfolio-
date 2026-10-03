// ==================== CONFIG ====================
const ADMIN_PASSWORD = 'raj@admin123';

// GitHub Config Defaults
const DEFAULT_GH_OWNER = 'RajVadhavana';
const DEFAULT_GH_REPO = 'portfolio-';
const DEFAULT_GH_BRANCH = 'main';
const GH_FILE_PATH = 'data.json';

// ==================== STATE ====================
let portfolioData = {};

// ==================== LOGIN ====================
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const togglePw = document.getElementById('toggle-pw');
const passwordInput = document.getElementById('admin-password');

// Check if already logged in
if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    showPanel();
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pw = passwordInput.value;
    if (pw === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        loginError.classList.add('hidden');
        showPanel();
    } else {
        loginError.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
    }
});

togglePw.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePw.className = 'bx bx-hide toggle-pw';
    } else {
        passwordInput.type = 'password';
        togglePw.className = 'bx bx-show toggle-pw';
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    adminPanel.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});

async function showPanel() {
    loginScreen.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    initGitHubSettings();
    await loadData();
    populateAllForms();
    updateGitHubStatusUI();
}

// ==================== GITHUB SETTINGS ====================
function getGitHubConfig() {
    return {
        token: (localStorage.getItem('gh_token') || '').trim(),
        owner: (localStorage.getItem('gh_owner') || DEFAULT_GH_OWNER).trim(),
        repo: (localStorage.getItem('gh_repo') || DEFAULT_GH_REPO).trim(),
        branch: (localStorage.getItem('gh_branch') || DEFAULT_GH_BRANCH).trim(),
        path: GH_FILE_PATH
    };
}

function initGitHubSettings() {
    const config = getGitHubConfig();
    const tokenInput = document.getElementById('gh-token');
    const ownerInput = document.getElementById('gh-owner');
    const repoInput = document.getElementById('gh-repo');
    const branchInput = document.getElementById('gh-branch');
    const toggleGhToken = document.getElementById('toggle-gh-token');

    if (tokenInput) tokenInput.value = config.token;
    if (ownerInput) ownerInput.value = config.owner;
    if (repoInput) repoInput.value = config.repo;
    if (branchInput) branchInput.value = config.branch;

    if (toggleGhToken && tokenInput) {
        toggleGhToken.onclick = () => {
            if (tokenInput.type === 'password') {
                tokenInput.type = 'text';
                toggleGhToken.className = 'bx bx-hide toggle-pw';
            } else {
                tokenInput.type = 'password';
                toggleGhToken.className = 'bx bx-show toggle-pw';
            }
        };
    }
}

function saveGitHubSettings() {
    const token = document.getElementById('gh-token')?.value.trim() || '';
    const owner = document.getElementById('gh-owner')?.value.trim() || DEFAULT_GH_OWNER;
    const repo = document.getElementById('gh-repo')?.value.trim() || DEFAULT_GH_REPO;
    const branch = document.getElementById('gh-branch')?.value.trim() || DEFAULT_GH_BRANCH;

    localStorage.setItem('gh_token', token);
    localStorage.setItem('gh_owner', owner);
    localStorage.setItem('gh_repo', repo);
    localStorage.setItem('gh_branch', branch);

    updateGitHubStatusUI();

    if (token) {
        showToast('🔑 GitHub Settings saved! Now testing connection...');
        testGitHubConnection();
    } else {
        showToast('⚠️ GitHub Settings saved (No Token provided).');
    }
}

function updateGitHubStatusUI() {
    const config = getGitHubConfig();
    const badge = document.getElementById('github-status-badge');
    const statusText = document.getElementById('gh-status-text');

    if (!badge || !statusText) return;

    if (config.token) {
        badge.className = 'gh-status-badge connected';
        statusText.textContent = `GitHub: ${config.owner}/${config.repo}`;
        badge.title = `Connected to GitHub (${config.owner}/${config.repo}@${config.branch}). Click to view settings.`;
    } else {
        badge.className = 'gh-status-badge disconnected';
        statusText.textContent = 'GitHub: Not Connected';
        badge.title = 'GitHub Token not configured. Click to connect for direct commits.';
    }
}

async function testGitHubConnection() {
    const config = getGitHubConfig();
    const resultBox = document.getElementById('gh-test-result');
    const testBtn = document.getElementById('test-gh-btn');

    if (!config.token) {
        if (resultBox) {
            resultBox.className = 'gh-result-box error';
            resultBox.innerHTML = `<strong>❌ No Token Found:</strong> Please paste your GitHub Personal Access Token above and click Save.`;
            resultBox.classList.remove('hidden');
        }
        showToast('❌ Please enter your GitHub Personal Access Token first.');
        return;
    }

    if (testBtn) {
        testBtn.disabled = true;
        testBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Testing...`;
    }

    try {
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`;
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (res.ok) {
            const data = await res.json();
            if (resultBox) {
                resultBox.className = 'gh-result-box success';
                resultBox.innerHTML = `
                    <strong>✅ GitHub Connection Successful!</strong><br>
                    • Repository: <strong>${config.owner}/${config.repo}</strong> (${config.branch})<br>
                    • File target: <strong>${config.path}</strong> (Current SHA: <code>${data.sha.substring(0, 7)}</code>)<br>
                    ✨ Direct commit is ready. Any changes saved in Admin will automatically commit directly to your GitHub repository!
                `;
                resultBox.classList.remove('hidden');
            }
            updateGitHubStatusUI();
            showToast('✅ GitHub connection test passed!');
        } else {
            const err = await res.json().catch(() => ({}));
            const msg = err.message || res.statusText;
            if (resultBox) {
                resultBox.className = 'gh-result-box error';
                resultBox.innerHTML = `
                    <strong>❌ Connection Failed (${res.status}):</strong> ${msg}<br>
                    Please verify your token permissions (ensure <code>repo</code> or <code>Contents: Read and write</code> is enabled) and repository name.
                `;
                resultBox.classList.remove('hidden');
            }
            showToast(`❌ GitHub Error: ${msg}`);
        }
    } catch (e) {
        if (resultBox) {
            resultBox.className = 'gh-result-box error';
            resultBox.innerHTML = `<strong>❌ Network Error:</strong> ${e.message}`;
            resultBox.classList.remove('hidden');
        }
        showToast(`❌ Network Error: ${e.message}`);
    } finally {
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.innerHTML = `<i class='bx bx-check-shield'></i> Test Connection`;
        }
    }
}

function switchToGithubTab() {
    const ghTabNav = document.querySelector('.nav-item[data-tab="github"]');
    if (ghTabNav) ghTabNav.click();
}

// UTF-8 to Base64 helper (handles unicode and emojis)
function utf8ToBase64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

// ==================== LOAD DATA ====================
async function loadData() {
    let loaded = false;
    const config = getGitHubConfig();

    // 1. Try Fetching directly from GitHub API if token exists
    if (config.token) {
        try {
            const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`;
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${config.token}`,
                    'Accept': 'application/vnd.github+json'
                }
            });
            if (res.ok) {
                const json = await res.json();
                if (json.content) {
                    const decoded = decodeURIComponent(escape(atob(json.content.replace(/\n/g, ''))));
                    portfolioData = JSON.parse(decoded);
                    loaded = true;
                    localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
                }
            }
        } catch(e) {
            console.warn('GitHub API fetch warning:', e.message);
        }
    }

    // 2. Fallback: Fetch local ../data.json
    if (!loaded) {
        try {
            const res = await fetch('../data.json?t=' + Date.now());
            if (res.ok) {
                portfolioData = await res.json();
                loaded = true;
                localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
            }
        } catch(e) {
            console.warn('Local data.json fetch error:', e.message);
        }
    }

    // 3. Fallback: localStorage
    if (!loaded) {
        const local = localStorage.getItem('portfolioData');
        if (local) {
            try { portfolioData = JSON.parse(local); } catch(e2) {}
        } else {
            portfolioData = {
                hero: { name: '', greeting: '', roles: [], tagline: '', linkedin: '', github: '', cv: '' },
                contactEmail: 'rajvadhavana64@gmail.com',
                about: { title: '', short: '', long: '' },
                skills: [], projects: [], experience: [], education: []
            };
        }
    }
}

// ==================== POPULATE FORMS ====================
function populateAllForms() {
    const h = portfolioData.hero || {};
    setVal('hero-name', h.name);
    setVal('hero-greeting', h.greeting);
    setVal('hero-roles', Array.isArray(h.roles) ? h.roles.join(', ') : h.roles);
    setVal('hero-tagline', h.tagline);
    setVal('hero-linkedin', h.linkedin);
    setVal('hero-github', h.github);
    setVal('hero-cv', h.cv);

    // Contact Email
    setVal('contact-email', portfolioData.contactEmail || 'rajvadhavana64@gmail.com');

    const a = portfolioData.about || {};
    setVal('about-title', a.title);
    setVal('about-short', a.short);
    setVal('about-long', a.long);

    renderSkillsList(portfolioData.skills || []);
    renderProjectsList(portfolioData.projects || []);
    renderExperienceList(portfolioData.experience || []);
    renderEducationList(portfolioData.education || []);
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

// ==================== SKILLS ====================
function renderSkillsList(skills) {
    const container = document.getElementById('skills-list');
    container.innerHTML = '';
    skills.forEach((skill, i) => {
        container.appendChild(createSkillRow(skill, i));
    });
}

function createSkillRow(skill, index) {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.index = index;
    row.innerHTML = `
        <div class="item-row-header">
            <span class="item-row-title">Skill #${index + 1}</span>
            <button class="delete-btn" onclick="deleteItem('skills', ${index})">
                <i class='bx bx-trash'></i> Remove
            </button>
        </div>
        <div class="item-form-grid">
            <div class="form-group">
                <label>Skill Name</label>
                <input type="text" data-field="name" value="${skill.name || ''}" placeholder="e.g. Python">
            </div>
            <div class="form-group">
                <label>Icon URL <small>(simple-icons SVG)</small></label>
                <input type="url" data-field="icon" value="${skill.icon || ''}" placeholder="https://unpkg.com/simple-icons@v9/icons/python.svg">
            </div>
            <div class="form-group">
                <label>Alt Text</label>
                <input type="text" data-field="alt" value="${skill.alt || ''}" placeholder="Python">
            </div>
        </div>
    `;
    return row;
}

function addSkill() {
    collectFormData();
    if (!portfolioData.skills) portfolioData.skills = [];
    portfolioData.skills.push({ name: '', icon: '', alt: '' });
    renderSkillsList(portfolioData.skills);
    scrollToBottom('skills-list');
}

// ==================== PROJECTS ====================
function renderProjectsList(projects) {
    const container = document.getElementById('projects-list');
    container.innerHTML = '';
    projects.forEach((proj, i) => {
        container.appendChild(createProjectRow(proj, i));
    });
}

function createProjectRow(proj, index) {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.index = index;
    row.innerHTML = `
        <div class="item-row-header">
            <span class="item-row-title">Project #${index + 1}: ${proj.title || 'New Project'}</span>
            <button class="delete-btn" onclick="deleteItem('projects', ${index})">
                <i class='bx bx-trash'></i> Remove
            </button>
        </div>
        <div class="item-form-grid">
            <div class="form-group">
                <label>Project Title</label>
                <input type="text" data-field="title" value="${proj.title || ''}" placeholder="MW Flow">
            </div>
            <div class="form-group">
                <label>Tech Stack <small>(comma separated)</small></label>
                <input type="text" data-field="tech" value="${Array.isArray(proj.tech) ? proj.tech.join(', ') : proj.tech || ''}" placeholder="HTML, CSS, JavaScript, PHP">
            </div>
            <div class="form-group full">
                <label>Description</label>
                <textarea data-field="description" rows="3" placeholder="Describe your project...">${proj.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>GitHub URL <small>(Leave blank if none)</small></label>
                <input type="url" data-field="github" value="${proj.github || ''}" placeholder="https://github.com/...">
            </div>
            <div class="form-group">
                <label>Live URL <small>(Leave blank if in development)</small></label>
                <input type="url" data-field="live" value="${proj.live || ''}" placeholder="https://...">
            </div>
            <div class="form-group">
                <label>Icon Class <small>(Boxicons)</small></label>
                <input type="text" data-field="icon" value="${proj.icon || 'bx bx-code-alt'}" placeholder="bx bx-code-alt">
            </div>
        </div>
    `;
    return row;
}

function addProject() {
    collectFormData();
    if (!portfolioData.projects) portfolioData.projects = [];
    portfolioData.projects.push({ title: '', description: '', tech: [], github: '', live: '', icon: 'bx bx-code-alt' });
    renderProjectsList(portfolioData.projects);
    scrollToBottom('projects-list');
}

// ==================== EXPERIENCE ====================
function renderExperienceList(experience) {
    const container = document.getElementById('experience-list');
    container.innerHTML = '';
    experience.forEach((exp, i) => {
        container.appendChild(createExperienceRow(exp, i));
    });
}

function createExperienceRow(exp, index) {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <div class="item-row-header">
            <span class="item-row-title">Experience #${index + 1}</span>
            <button class="delete-btn" onclick="deleteItem('experience', ${index})">
                <i class='bx bx-trash'></i> Remove
            </button>
        </div>
        <div class="item-form-grid">
            <div class="form-group">
                <label>Job Role / Learning Title</label>
                <input type="text" data-field="role" value="${exp.role || ''}" placeholder="Web Development (Learning)">
            </div>
            <div class="form-group">
                <label>Company / Organization / Self</label>
                <input type="text" data-field="company" value="${exp.company || ''}" placeholder="Academic & Self-Taught Projects">
            </div>
            <div class="form-group">
                <label>Duration</label>
                <input type="text" data-field="duration" value="${exp.duration || ''}" placeholder="2023 - Present">
            </div>
            <div class="form-group">
                <label>Icon <small>(Boxicons)</small></label>
                <input type="text" data-field="icon" value="${exp.icon || 'bx bx-briefcase'}" placeholder="bx bx-laptop">
            </div>
            <div class="form-group full">
                <label>Description</label>
                <textarea data-field="description" rows="3" placeholder="What did you build or learn...">${exp.description || ''}</textarea>
            </div>
        </div>
    `;
    return row;
}

function addExperience() {
    collectFormData();
    if (!portfolioData.experience) portfolioData.experience = [];
    portfolioData.experience.push({ role: '', company: '', duration: '', description: '', icon: 'bx bx-briefcase' });
    renderExperienceList(portfolioData.experience);
    scrollToBottom('experience-list');
}

// ==================== EDUCATION ====================
function renderEducationList(education) {
    const container = document.getElementById('education-list');
    container.innerHTML = '';
    education.forEach((edu, i) => {
        container.appendChild(createEducationRow(edu, i));
    });
}

function createEducationRow(edu, index) {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <div class="item-row-header">
            <span class="item-row-title">Education #${index + 1}</span>
            <button class="delete-btn" onclick="deleteItem('education', ${index})">
                <i class='bx bx-trash'></i> Remove
            </button>
        </div>
        <div class="item-form-grid">
            <div class="form-group">
                <label>Degree / Course</label>
                <input type="text" data-field="degree" value="${edu.degree || ''}" placeholder="B.C.A. (Bachelor of Computer Applications)">
            </div>
            <div class="form-group">
                <label>Institution / College</label>
                <input type="text" data-field="institution" value="${edu.institution || ''}" placeholder="B.P. College of Computer Studies">
            </div>
            <div class="form-group">
                <label>Year</label>
                <input type="text" data-field="year" value="${edu.year || ''}" placeholder="2023 - Present">
            </div>
            <div class="form-group">
                <label>Icon <small>(Boxicons)</small></label>
                <input type="text" data-field="icon" value="${edu.icon || 'bx bx-graduation'}" placeholder="bx bx-graduation">
            </div>
        </div>
    `;
    return row;
}

function addEducation() {
    collectFormData();
    if (!portfolioData.education) portfolioData.education = [];
    portfolioData.education.push({ degree: '', institution: '', year: '', icon: 'bx bx-graduation' });
    renderEducationList(portfolioData.education);
    scrollToBottom('education-list');
}

// ==================== DELETE ITEM ====================
function deleteItem(section, index) {
    if (!confirm('Are you sure you want to remove this item?')) return;
    collectFormData();
    if (portfolioData[section]) {
        portfolioData[section].splice(index, 1);
    }
    if (section === 'skills') renderSkillsList(portfolioData.skills);
    else if (section === 'projects') renderProjectsList(portfolioData.projects);
    else if (section === 'experience') renderExperienceList(portfolioData.experience);
    else if (section === 'education') renderEducationList(portfolioData.education);
}

// ==================== COLLECT FORM DATA ====================
function collectFormData() {
    // Hero
    portfolioData.hero = {
        name: getVal('hero-name'),
        greeting: getVal('hero-greeting'),
        roles: getVal('hero-roles').split(',').map(r => r.trim()).filter(Boolean),
        tagline: getVal('hero-tagline'),
        linkedin: getVal('hero-linkedin'),
        github: getVal('hero-github'),
        cv: getVal('hero-cv')
    };

    // Contact Email
    portfolioData.contactEmail = getVal('contact-email') || 'rajvadhavana64@gmail.com';

    // About
    portfolioData.about = {
        title: getVal('about-title'),
        short: getVal('about-short'),
        long: getVal('about-long')
    };

    // Skills
    portfolioData.skills = collectItemRows('skills-list', ['name', 'icon', 'alt']);

    // Projects
    const projectRows = document.querySelectorAll('#projects-list .item-row');
    portfolioData.projects = Array.from(projectRows).map(row => {
        const obj = {};
        row.querySelectorAll('[data-field]').forEach(el => {
            const field = el.dataset.field;
            if (field === 'tech') {
                obj[field] = el.value.split(',').map(t => t.trim()).filter(Boolean);
            } else {
                obj[field] = el.value.trim();
            }
        });
        return obj;
    });

    // Experience
    portfolioData.experience = collectItemRows('experience-list', ['role', 'company', 'duration', 'icon', 'description']);

    // Education
    portfolioData.education = collectItemRows('education-list', ['degree', 'institution', 'year', 'icon']);
}

function collectItemRows(containerId, fields) {
    const rows = document.querySelectorAll(`#${containerId} .item-row`);
    return Array.from(rows).map(row => {
        const obj = {};
        row.querySelectorAll('[data-field]').forEach(el => {
            obj[el.dataset.field] = el.value.trim();
        });
        return obj;
    });
}

// ==================== DIRECT GITHUB COMMIT ====================
async function commitToGitHubDirectly(jsonData) {

    const WORKER_URL =
        "https://raj-portfolio-api.rvadhavana74.workers.dev/";

    const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jsonData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.error || "Cloudflare Worker failed."
        );
    }

    return result;
}
// ==================== SAVE ====================
async function saveAllData() {
    collectFormData();

    // Save locally as backup
    localStorage.setItem(
        'portfolioData',
        JSON.stringify(portfolioData)
    );

    const saveBtn = document.getElementById('save-btn');

    saveBtn.disabled = true;

    saveBtn.innerHTML =
        `<i class='bx bx-loader-alt bx-spin'></i> Saving...`;

    try {
        // Send data to Cloudflare Worker
        await commitToGitHubDirectly(portfolioData);

        showToast(
            '🚀 Saved successfully to GitHub!'
        );

    } catch (e) {
        console.error('Cloudflare Worker Error:', e);

        showToast(
            `❌ Save failed: ${e.message}`
        );

    } finally {
        saveBtn.innerHTML =
            `<i class='bx bx-save'></i> Save to GitHub`;

        saveBtn.disabled = false;
    }
}
// ==================== EXPORT DATA.JSON (BACKUP) ====================
function exportDataJson() {
    collectFormData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(portfolioData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('📥 Backup data.json downloaded.');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    toastMsg.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 5000);
}

// ==================== TABS ====================
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const topbarTitle = document.getElementById('topbar-title');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.dataset.tab;

        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        tabContents.forEach(t => {
            t.classList.add('hidden');
            t.classList.remove('active');
        });

        const target = document.getElementById('tab-' + tab);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }

        topbarTitle.textContent = item.querySelector('span').textContent;

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

// ==================== MOBILE SIDEBAR ====================
const sidebarEl = document.getElementById('sidebar');
document.getElementById('menu-toggle').addEventListener('click', () => {
    sidebarEl.classList.toggle('open');
});
document.getElementById('sidebar-close').addEventListener('click', () => {
    sidebarEl.classList.remove('open');
});

// ==================== HELPERS ====================
function scrollToBottom(containerId) {
    setTimeout(() => {
        const el = document.getElementById(containerId);
        if (el) el.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}
