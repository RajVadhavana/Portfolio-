// ==================== CONFIG ====================
const GH_USER = 'RajVadhavana';
const GH_REPO = 'portfolio';
const GH_BRANCH = 'main';

// ==================== CONTACT EMAIL (Dynamic from data.json/Admin) ====================
let MY_EMAIL = 'rajvadhavana64@gmail.com';

// ==================== LOAD DATA (data.json -> GitHub Raw -> localStorage) ====================
async function loadPortfolioData() {
    let data = null;

    // 1. Primary: Fetch local data.json with cache buster (instant and fresh)
    try {
        const localRes = await fetch(`./data.json?t=${Date.now()}`);
        if (localRes.ok) {
            data = await localRes.json();
        }
    } catch(e) {
        console.warn('Local data.json fetch error:', e.message);
    }

    // 2. Fallback: Fetch directly from GitHub raw repository
    if (!data) {
        try {
            const ghRawUrl = `https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/${GH_BRANCH}/data.json?t=${Date.now()}`;
            const ghRes = await fetch(ghRawUrl);
            if (ghRes.ok) {
                data = await ghRes.json();
            }
        } catch(e) {
            console.warn('GitHub raw data fetch error:', e.message);
        }
    }

    // 3. Fallback: Check localStorage cache
    if (!data) {
        const cached = localStorage.getItem('portfolioData');
        if (cached) {
            try { data = JSON.parse(cached); } catch(e) {}
        }
    }

    // Save and Render if we have data
    if (data) {
        try { localStorage.setItem('portfolioData', JSON.stringify(data)); } catch(e) {}
        if (data.contactEmail) {
            MY_EMAIL = data.contactEmail;
        }
        try { renderHero(data.hero); }       catch(e) {}
        try { renderAbout(data.about); }      catch(e) {}
        try { renderSkills(data.skills); }    catch(e) {}
        try { renderProjects(data.projects); } catch(e) {}
        try { renderExperience(data.experience, data.education); } catch(e) {}
        try { renderContact(data); }          catch(e) {}
        initTyped(data.hero?.roles || ['Frontend Developer', 'Web Designer', 'BCA Student']);
    } else {
        initTyped(['Frontend Developer', 'Web Designer', 'BCA Student']);
    }
}

// ==================== RENDER FUNCTIONS ====================
function renderHero(hero) {
    if (!hero) return;
    const greeting = document.getElementById('hero-greeting');
    const name     = document.getElementById('hero-name');
    const tagline  = document.getElementById('hero-tagline');
    const cvBtn    = document.getElementById('cv-btn');

    if (greeting) greeting.textContent = hero.greeting || "Hello, I'm Raj";
    if (name)     name.textContent     = hero.name     || 'Raj Vadhavana';
    if (tagline)  tagline.textContent  = hero.tagline  || '';
    if (cvBtn && hero.cv) cvBtn.href   = hero.cv;

    setHref('link-linkedin',   hero.linkedin);
    setHref('link-github',     hero.github);
    setHref('footer-linkedin', hero.linkedin);
    setHref('footer-github',   hero.github);
}

function setHref(id, url) {
    const el = document.getElementById(id);
    if (el && url) el.href = url;
}

function renderAbout(about) {
    if (!about) return;
    const title = document.getElementById('about-title');
    const short = document.getElementById('about-short');
    const long  = document.getElementById('about-long');
    if (title) title.textContent = about.title || 'Frontend Developer & BCA Student';
    if (short) short.textContent = about.short || '';
    if (long)  long.textContent  = about.long  || '';
}

function renderSkills(skills) {
    if (!skills || !skills.length) return;
    const container = document.getElementById('skills-container');
    if (!container) return;
    container.innerHTML = skills.map(skill => `
        <div class="skill-box">
            <img src="${skill.icon}" alt="${skill.alt || skill.name}" class="skill-icon" />
            <span>${skill.name}</span>
        </div>
    `).join('');
}

function renderProjects(projects) {
    if (!projects || !projects.length) return;
    const container = document.getElementById('projects-container');
    if (!container) return;
    container.innerHTML = projects.map(proj => {
        const techArr = Array.isArray(proj.tech)
            ? proj.tech
            : (typeof proj.tech === 'string' ? proj.tech.split(/[,\s]+/).filter(Boolean) : []);
        
        const hasGithub = proj.github && proj.github.trim() !== '' && proj.github !== '#';
        const hasLive   = proj.live && proj.live.trim() !== '' && proj.live !== '#';

        let linksHtml = '';
        if (hasGithub) {
            linksHtml += `<a href="${proj.github}" target="_blank"><i class='bx bxl-github'></i> GitHub</a>`;
        }
        if (hasLive) {
            linksHtml += `<a href="${proj.live}" target="_blank"><i class='bx bx-link-external'></i> Live Demo</a>`;
        }
        if (!hasGithub && !hasLive) {
            linksHtml = `<span class="tech-badge" style="border-color: rgba(34,211,238,0.4); color: var(--cyan); background: rgba(34,211,238,0.1);"><i class='bx bx-time'></i> In Development</span>`;
        }

        return `
        <div class="project-card">
            <div class="project-icon"><i class='${proj.icon || "bx bx-code-alt"}'></i></div>
            <h3>${proj.title}</h3>
            <p>${proj.description}</p>
            <div class="project-tech">
                ${techArr.map(t => `<span class="tech-badge">${t}</span>`).join('')}
            </div>
            <div class="project-links">
                ${linksHtml}
            </div>
        </div>`;
    }).join('');
}

function renderExperience(experience, education) {
    const expContainer = document.getElementById('experience-container');
    const eduContainer = document.getElementById('education-container');

    if (expContainer && experience && experience.length) {
        expContainer.innerHTML = experience.map(exp => `
            <div class="timeline-item">
                <div class="timeline-icon"><i class='${exp.icon || "bx bx-briefcase"}'></i></div>
                <h4>${exp.role}</h4>
                <div class="company">${exp.company}</div>
                <div class="duration">${exp.duration}</div>
                <p>${exp.description}</p>
            </div>
        `).join('');
    }

    if (eduContainer && education && education.length) {
        eduContainer.innerHTML = education.map(edu => `
            <div class="timeline-item">
                <div class="timeline-icon"><i class='${edu.icon || "bx bx-graduation"}'></i></div>
                <h4>${edu.degree}</h4>
                <div class="company">${edu.institution}</div>
                <div class="duration">${edu.year}</div>
            </div>
        `).join('');
    }
}

function renderContact(data) {
    const emailDisplay = document.getElementById('contact-email-display');
    if (emailDisplay && (data.contactEmail || data.hero?.email)) {
        const mail = data.contactEmail || data.hero?.email;
        emailDisplay.textContent = mail;
        MY_EMAIL = mail;
    }
}

function initTyped(roles) {
    if (typeof Typed === 'undefined') { setTimeout(() => initTyped(roles), 500); return; }
    const el = document.querySelector('.multiple-text');
    if (!el) return;
    new Typed('.multiple-text', {
        strings: roles && roles.length ? roles : ['Frontend Developer', 'Web Designer', 'BCA Student'],
        typeSpeed: 75, backSpeed: 50, backDelay: 1400, loop: true,
    });
}

// ==================== CONTACT FORM (Email via mailto) ====================
const contactForm = document.getElementById('contact-form');
const sendBtn     = document.getElementById('send-btn');
const successMsg  = document.getElementById('success-msg');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name    = document.getElementById('contact-name')?.value.trim();
        const email   = document.getElementById('contact-email')?.value.trim();
        const phone   = document.getElementById('contact-phone')?.value.trim();
        const subject = document.getElementById('contact-subject')?.value.trim();
        const message = document.getElementById('contact-message')?.value.trim();

        if (!name || !email || !message) {
            alert('Please fill in Name, Email and Message fields.');
            return;
        }

        // Show loading
        sendBtn.disabled = true;
        sendBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Sending...`;

        // Build mailto link — opens user's email client addressed to MY_EMAIL
        const emailSubject = subject || `Portfolio Contact from ${name}`;
        const emailBody = 
`New message from your portfolio website!

────────────────────────
From:    ${name}
Email:   ${email}
Phone:   ${phone || 'Not provided'}
Subject: ${subject || 'General Inquiry'}
────────────────────────

Message:
${message}

────────────────────────
Sent to: ${MY_EMAIL}
Reply to: ${email}`;

        const mailtoLink = `mailto:${MY_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        // Small delay for UX
        await new Promise(r => setTimeout(r, 600));

        // Show success to sender
        successMsg.style.display = 'block';
        contactForm.reset();
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<i class='bx bx-send'></i> Send Message`;

        // Open email client
        window.open(mailtoLink, '_blank');

        // Hide success after 6 seconds
        setTimeout(() => { successMsg.style.display = 'none'; }, 6000);
    });
}

// ==================== MOBILE MENU ====================
const menu    = document.querySelector('#menu-icon');
const navbar  = document.querySelector('.navbar');
const navLinks = document.querySelectorAll('.navbar a');

if (menu) {
    menu.onclick = () => {
        menu.classList.toggle('bx-x');
        navbar.classList.toggle('active');
    };
}
window.onscroll = () => {
    if (menu)   menu.classList.remove('bx-x');
    if (navbar) navbar.classList.remove('active');
};
navLinks.forEach(link => {
    link.addEventListener("click", () => {
        if (menu)   menu.classList.remove("bx-x");
        if (navbar) navbar.classList.remove("active");
    });
});

// ==================== READ MORE ====================
const readMoreBtn = document.querySelector(".read-more-btn");
const aboutPara   = document.querySelector(".about-para");
if (readMoreBtn) {
    readMoreBtn.addEventListener("click", function(e) {
        e.preventDefault();
        if (aboutPara) aboutPara.classList.toggle("hidden");
        const isHidden = aboutPara && aboutPara.classList.contains("hidden");
        readMoreBtn.innerHTML = isHidden
            ? `Read More <i class='bx bx-chevron-down'></i>`
            : `Read Less <i class='bx bx-chevron-up'></i>`;
    });
}

// ==================== SCROLL REVEAL ====================
window.addEventListener('load', () => {
    if (typeof ScrollReveal !== 'undefined') {
        ScrollReveal({ reset: false, distance: '50px', duration: 900, delay: 150 });
        ScrollReveal().reveal('.home-content, .section-badge', { origin: 'top' });
        ScrollReveal().reveal('.home-visual', { origin: 'bottom', delay: 300 });
        ScrollReveal().reveal('.about-content', { origin: 'left' });
        ScrollReveal().reveal('.about-img', { origin: 'right' });
        ScrollReveal().reveal('.skill-box', { origin: 'bottom', interval: 80 });
        ScrollReveal().reveal('.project-card', { origin: 'bottom', interval: 120 });
        ScrollReveal().reveal('.timeline-item', { origin: 'left', interval: 150 });
        ScrollReveal().reveal('.contact-info', { origin: 'left' });
        ScrollReveal().reveal('.contact-form', { origin: 'right' });
        ScrollReveal().reveal('.footer', { origin: 'bottom' });
    }
});

// ==================== INIT ====================
loadPortfolioData();

// ==================== LIVE UPDATE (LOCAL STORAGE) ====================
window.addEventListener('storage', (e) => {
    if (e.key === 'portfolioData' && e.newValue) {
        try {
            const data = JSON.parse(e.newValue);
            if (data) {
                if (data.contactEmail) MY_EMAIL = data.contactEmail;
                renderHero(data.hero);
                renderAbout(data.about);
                renderSkills(data.skills);
                renderProjects(data.projects);
                renderExperience(data.experience, data.education);
                renderContact(data);
            }
        } catch(err) {}
    }
});