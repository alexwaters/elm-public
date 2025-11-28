/**
 * ELM Site JavaScript
 * - Home page gallery rotation
 * - Mobile navigation
 * - Contact form with GitHub Issues integration
 */

(function() {
  'use strict';

  // ========================================
  // HOME PAGE - Gallery Rotation
  // ========================================
  
  function initGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (galleryItems.length <= 1) return;
    
    let currentIndex = 0;
    
    function showNext() {
      galleryItems[currentIndex].classList.remove('active');
      currentIndex = (currentIndex + 1) % galleryItems.length;
      galleryItems[currentIndex].classList.add('active');
    }
    
    // Rotate every 5 seconds
    setInterval(showNext, 5000);
  }

  // ========================================
  // MOBILE NAVIGATION
  // ========================================
  
  function initMobileNav() {
    const toggle = document.getElementById('mobile-nav-toggle');
    const navList = document.getElementById('mobile-nav-list');
    
    if (!toggle || !navList) return;
    
    toggle.addEventListener('click', function() {
      navList.classList.toggle('active');
    });
  }

  // ========================================
  // CONTACT FORM
  // ========================================
  
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    const statusEl = document.getElementById('form-status');
    const submitBtn = form.querySelector('.submit-btn');
    const honeypot = form.querySelector('input[name="website"]');
    
    // Azure Function endpoint - update this after deployment
    const FORM_ENDPOINT = window.__ELM_CONTACT_ENDPOINT || 
      'https://elm-contact.azurewebsites.net/api/contact';
    
    // Track form load time for basic bot detection
    const formLoadTime = Date.now();
    const MIN_SUBMIT_TIME = 3000; // 3 seconds minimum
    
    function setStatus(message, type) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = 'form-status';
      if (type) {
        statusEl.classList.add(type);
      }
    }
    
    function clearStatus() {
      if (!statusEl) return;
      statusEl.textContent = '';
      statusEl.className = 'form-status';
    }
    
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearStatus();
      
      // Honeypot check
      if (honeypot && honeypot.value.trim() !== '') {
        setStatus('Submission blocked.', 'error');
        return;
      }
      
      // Time check - too fast = likely bot
      if (Date.now() - formLoadTime < MIN_SUBMIT_TIME) {
        setStatus('Please take a moment to complete the form.', 'error');
        return;
      }
      
      // Gather form data
      const formData = new FormData(form);
      const data = {
        name: (formData.get('firstName') + ' ' + formData.get('lastName')).trim(),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        sourcePage: window.location.href
      };
      
      // Validate
      if (!data.name || !data.email || !data.subject || !data.message) {
        setStatus('Please fill in all required fields.', 'error');
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        setStatus('Please enter a valid email address.', 'error');
        return;
      }
      
      // Disable button and show loading
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      
      try {
        const response = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Submission failed');
        }
        
        // Success
        setStatus('Thank you! Your message has been sent.', 'success');
        form.reset();
        
      } catch (error) {
        console.error('Form submission error:', error);
        setStatus('Unable to send message. Please try again later.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    });
  }

  // ========================================
  // INITIALIZE
  // ========================================
  
  document.addEventListener('DOMContentLoaded', function() {
    initGallery();
    initMobileNav();
    initContactForm();
  });

})();

