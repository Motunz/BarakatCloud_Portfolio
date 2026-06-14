// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Day counter — based on the lock-in start date.
// Edit START_DATE to the actual day you began.
const START_DATE = new Date('2026-06-14T00:00:00');
const today = new Date();
const dayNum = Math.min(
  90,
  Math.max(1, Math.floor((today - START_DATE) / (1000 * 60 * 60 * 24)) + 1)
);
const dayEl = document.getElementById('day-counter');
if (dayEl) dayEl.textContent = dayNum;

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Reveal sections on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.section').forEach((section) => {
  section.style.opacity = '0';
  section.style.transform = 'translateY(20px)';
  section.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
  observer.observe(section);
});
