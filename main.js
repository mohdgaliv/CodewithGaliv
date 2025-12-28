// Hamburger Menu Toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  
  // Animate hamburger
  hamburger.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    hamburger.classList.remove('active');
  });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
  } else {
    navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
  }
});

// Active navigation link on scroll
const sections = document.querySelectorAll('section');
const navLinksAll = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  let current = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    
    if (window.pageYOffset >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });
  
  navLinksAll.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').slice(1) === current) {
      link.classList.add('active');
    }
  });
});

// Skill bars animation on scroll
const skillCards = document.querySelectorAll('.skill-card');

const animateSkills = () => {
  skillCards.forEach(card => {
    const cardTop = card.getBoundingClientRect().top;
    const triggerBottom = window.innerHeight * 0.8;
    
    if (cardTop < triggerBottom) {
      card.classList.add('visible');
    }
  });
};

window.addEventListener('scroll', animateSkills);
animateSkills(); // Initial check

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.2,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.service-card, .project-card, .stat-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'all 0.6s ease';
  observer.observe(el);
});

// Contact Form Submission
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Get form values
  const formData = new FormData(contactForm);
  
  // Show success message (you can customize this)
  alert('Thank you for your message! I will get back to you soon.');
  
  // Reset form
  contactForm.reset();
  
  // In a real application, you would send this data to a server
  // Example:
  // fetch('your-api-endpoint', {
  //     method: 'POST',
  //     body: formData
  // }).then(response => response.json())
  //   .then(data => console.log(data));
});

// Typing effect for home section
const text = "Machine Learning Developer";
const typingElement = document.querySelector('.title');
let index = 0;

function typeWriter() {
  if (index < text.length) {
    typingElement.textContent = text.substring(0, index + 1);
    index++;
    setTimeout(typeWriter, 100);
  }
}

// Start typing effect when page loads
window.addEventListener('load', () => {
  setTimeout(typeWriter, 500);
});

// Counter animation for stats
const statNumbers = document.querySelectorAll('.stat-item h4');

const animateCounter = (element) => {
  const target = parseInt(element.textContent);
  const duration = 2000;
  const increment = target / (duration / 16);
  let current = 0;
  
  const updateCounter = () => {
    current += increment;
    if (current < target) {
      element.textContent = Math.floor(current) + '+';
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target + '+';
    }
  };
  
  updateCounter();
};

// Observe stats for counter animation
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const number = entry.target.querySelector('h4');
      if (number && !number.classList.contains('counted')) {
        animateCounter(number);
        number.classList.add('counted');
      }
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(stat => {
  statsObserver.observe(stat);
});

// Add loading animation
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

// Parallax effect for home section
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const homeSection = document.querySelector('.home-section');
  if (homeSection) {
    homeSection.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
});

// Add cursor trail effect (optional)
document.addEventListener('mousemove', (e) => {
  const trail = document.createElement('div');
  trail.className = 'cursor-trail';
  trail.style.left = e.pageX + 'px';
  trail.style.top = e.pageY + 'px';
  document.body.appendChild(trail);
  
  setTimeout(() => {
    trail.remove();
  }, 500);
});

// Console message
console.log('%c Welcome to Galiv.tech! ', 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 20px; padding: 10px;');
console.log('%c Looking for a developer? Let\'s connect! ', 'color: #667eea; font-size: 14px;');
