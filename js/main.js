(function () {
  'use strict';

  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const contactForm = document.getElementById('contactForm');
  const contactSuccess = document.getElementById('contactSuccess');
  const formError = document.getElementById('formError');
  const categorySelect = document.getElementById('category');
  const companyGroup = document.getElementById('companyGroup');
  const phoneGroup = document.getElementById('phoneGroup');
  const companyInput = document.getElementById('company');
  const productSelect = document.getElementById('product');
  const submitBtn = document.getElementById('submitBtn');
  const successInquiryId = document.getElementById('successInquiryId');

  const CONTACT_API_URL =
    'https://script.google.com/macros/s/AKfycbzVXOdk26hBB3niHRDFT1Dw89wuhkij_tpD3Pmx3L709iuNyYy9WTQLPfRnjSCAJEB7/exec';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Smooth scroll with header offset ----- */
  function scrollToSection(target) {
    const el = document.querySelector(target);
    if (!el) return;
    const headerH = header ? header.offsetHeight : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = link.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      scrollToSection(href);
      closeNav();
    });
  });

  /* ----- Mobile nav ----- */
  function closeNav() {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '메뉴 열기');
    navMenu.classList.remove('is-open');
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      const open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      navToggle.setAttribute('aria-label', open ? '메뉴 열기' : '메뉴 닫기');
      navMenu.classList.toggle('is-open', !open);
    });
  }

  /* ----- Video background with poster fallback ----- */
  function initVideoBackgrounds() {
    document.querySelectorAll('.section--video').forEach(function (section) {
      const mediaBg = section.querySelector('.media-bg');
      const video = section.querySelector('.media-bg__video');
      const posterEl = section.querySelector('.media-bg__poster');
      const posterUrl = section.getAttribute('data-poster') || video?.getAttribute('poster');

      if (!mediaBg || !posterUrl) return;

      posterEl.style.backgroundImage = 'url("' + posterUrl + '")';

      if (prefersReducedMotion || !video) {
        mediaBg.classList.add('is-fallback');
        return;
      }

      function useFallback() {
        mediaBg.classList.add('is-fallback');
        video.pause();
      }

      video.addEventListener('error', useFallback);

      var loadTimeout = setTimeout(function () {
        if (video.readyState < 2) useFallback();
      }, 3000);

      video.addEventListener('canplay', function () {
        clearTimeout(loadTimeout);
        video.play().catch(useFallback);
      });

      video.play().catch(useFallback);
    });
  }

  /* ----- Scroll reveal ----- */
  function initScrollReveal() {
    if (prefersReducedMotion) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ----- Product inquiry pre-fill ----- */
  document.querySelectorAll('.product-inquiry').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var product = btn.getAttribute('data-product');
      if (product && productSelect) {
        productSelect.value = product;
      }
      scrollToSection('#contact');
      closeNav();
    });
  });

  /* ----- B2B conditional fields ----- */
  function toggleB2BFields() {
    var isB2B = categorySelect && categorySelect.value === 'b2b';
    if (companyGroup) companyGroup.hidden = !isB2B;
    if (phoneGroup) phoneGroup.hidden = !isB2B;
    if (companyInput) {
      companyInput.required = isB2B;
      if (!isB2B) companyInput.value = '';
    }
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', toggleB2BFields);
    toggleB2BFields();
  }

  /* ----- Contact form validation ----- */
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(msg) {
    if (!formError) return;
    formError.textContent = msg;
    formError.hidden = false;
  }

  function hideError() {
    if (!formError) return;
    formError.hidden = true;
    formError.textContent = '';
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? '전송 중…' : '문의 보내기';
  }

  function showSuccess(inquiryId, emailSent) {
    contactForm.hidden = true;
    if (contactSuccess) contactSuccess.hidden = false;
    if (successInquiryId && inquiryId) {
      var idText = '문의번호: ' + inquiryId;
      if (emailSent === false) {
        idText += ' (시트 저장 완료, 관리자 메일 발송 실패)';
      }
      successInquiryId.textContent = idText;
      successInquiryId.hidden = false;
    } else if (successInquiryId) {
      successInquiryId.hidden = true;
      successInquiryId.textContent = '';
    }
  }

  async function submitInquiry(payload) {
    var response = await fetch(CONTACT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    var result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || '문의 전송에 실패했습니다.');
    }
    return result;
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideError();

      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim();
      var message = document.getElementById('message').value.trim();
      var privacy = document.getElementById('privacy').checked;
      var category = categorySelect ? categorySelect.value : '';
      var company = companyInput ? companyInput.value.trim() : '';
      var phoneEl = document.getElementById('phone');
      var phone = phoneEl ? phoneEl.value.trim() : '';
      var product = productSelect ? productSelect.value : '';

      if (!category) {
        showError('문의 유형을 선택해 주세요.');
        return;
      }
      if (!name) {
        showError('이름을 입력해 주세요.');
        return;
      }
      if (!email || !validateEmail(email)) {
        showError('올바른 이메일을 입력해 주세요.');
        return;
      }
      if (category === 'b2b' && !company) {
        showError('B2B 문의는 회사명을 입력해 주세요.');
        return;
      }
      if (!message) {
        showError('문의 내용을 입력해 주세요.');
        return;
      }
      if (!privacy) {
        showError('개인정보 수집·이용에 동의해 주세요.');
        return;
      }

      var payload = {
        category: category,
        name: name,
        email: email,
        company: company,
        phone: phone,
        product: product,
        message: message,
        privacy_agree: 'Y',
      };

      setSubmitting(true);

      try {
        var result = await submitInquiry(payload);
        showSuccess(result.inquiry_id, result.email_sent);
        if (result.email_sent === false && result.email_error) {
          console.warn('Admin email failed:', result.email_error);
        }
      } catch (err) {
        showError(err.message || '다시 시도해 주세요.');
      } finally {
        setSubmitting(false);
      }
    });
  }

  initVideoBackgrounds();
  initScrollReveal();
})();
