(function () {
  'use strict';

  var client = null;
  var session = null;
  var pendingBoardOpen = false;

  var navBoardLink = document.getElementById('navBoardLink');
  var headerAuthBtn = document.getElementById('headerAuthBtn');
  var headerUserEmail = document.getElementById('headerUserEmail');
  var boardSection = document.getElementById('board');
  var boardList = document.getElementById('boardList');
  var boardEmpty = document.getElementById('boardEmpty');
  var boardForm = document.getElementById('boardForm');
  var boardTitle = document.getElementById('boardTitle');
  var boardBody = document.getElementById('boardBody');
  var boardFormError = document.getElementById('boardFormError');
  var boardSubmitBtn = document.getElementById('boardSubmitBtn');

  var authModal = document.getElementById('authModal');
  var authModalBackdrop = document.getElementById('authModalBackdrop');
  var authModalClose = document.getElementById('authModalClose');
  var authTabLogin = document.getElementById('authTabLogin');
  var authTabSignup = document.getElementById('authTabSignup');
  var loginForm = document.getElementById('loginForm');
  var signupForm = document.getElementById('signupForm');
  var loginError = document.getElementById('loginError');
  var signupError = document.getElementById('signupError');

  var header = document.getElementById('header');
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getClient() {
    if (client) return client;
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
      throw new Error('Supabase SDK를 불러오지 못했습니다.');
    }
    if (
      typeof SUPABASE_URL !== 'string' ||
      typeof SUPABASE_ANON_KEY !== 'string' ||
      SUPABASE_URL.indexOf('YOUR_SUPABASE') === 0 ||
      SUPABASE_ANON_KEY.indexOf('YOUR_SUPABASE') === 0
    ) {
      throw new Error('js/config.js 에 Supabase URL과 anon key를 설정해 주세요.');
    }
    client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  }

  function scrollToSection(target) {
    var el = document.querySelector(target);
    if (!el) return;
    var headerH = header ? header.offsetHeight : 0;
    var top = el.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
  }

  function isLoggedIn() {
    return !!(session && session.user);
  }

  function setBoardVisible(visible) {
    if (!boardSection) return;
    boardSection.hidden = !visible;
    boardSection.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function updateHeaderAuth() {
    if (!headerAuthBtn || !headerUserEmail) return;

    if (isLoggedIn()) {
      headerUserEmail.textContent = session.user.email || '';
      headerUserEmail.hidden = false;
      headerAuthBtn.textContent = '로그아웃';
      headerAuthBtn.setAttribute('data-mode', 'logout');
    } else {
      headerUserEmail.hidden = true;
      headerUserEmail.textContent = '';
      headerAuthBtn.textContent = '로그인';
      headerAuthBtn.setAttribute('data-mode', 'login');
      setBoardVisible(false);
    }
  }

  function openAuthModal(mode, options) {
    if (!authModal) return;
    pendingBoardOpen = !!(options && options.openBoardAfter);
    authModal.hidden = false;
    document.body.classList.add('modal-open');
    setAuthTab(mode === 'signup' ? 'signup' : 'login');
    clearAuthErrors();
  }

  function closeAuthModal() {
    if (!authModal) return;
    authModal.hidden = true;
    document.body.classList.remove('modal-open');
    pendingBoardOpen = false;
  }

  function clearAuthErrors() {
    if (loginError) {
      loginError.hidden = true;
      loginError.textContent = '';
    }
    if (signupError) {
      signupError.hidden = true;
      signupError.textContent = '';
    }
  }

  function setAuthTab(tab) {
    var isLogin = tab === 'login';
    if (authTabLogin) authTabLogin.classList.toggle('is-active', isLogin);
    if (authTabSignup) authTabSignup.classList.toggle('is-active', !isLogin);
    if (loginForm) loginForm.hidden = !isLogin;
    if (signupForm) signupForm.hidden = isLogin;
    clearAuthErrors();
  }

  function tryOpenBoard() {
    if (!isLoggedIn()) {
      openAuthModal('login', { openBoardAfter: true });
      return false;
    }
    setBoardVisible(true);
    loadPosts();
    scrollToSection('#board');
    return true;
  }

  async function refreshSession() {
    var sb = getClient();
    var result = await sb.auth.getSession();
    if (result.error) throw result.error;
    session = result.data.session;
    updateHeaderAuth();
    if (isLoggedIn() && boardSection && !boardSection.hidden) {
      await loadPosts();
    }
  }

  async function loadPosts() {
    if (!boardList || !isLoggedIn()) return;

    boardList.innerHTML = '';
    if (boardEmpty) boardEmpty.hidden = true;

    var sb = getClient();
    var result = await sb
      .from('board_posts')
      .select(
        'id, title, body, author_email, created_at, board_replies(id, body, author_email, created_at)'
      )
      .order('created_at', { ascending: false })
      .order('created_at', { foreignTable: 'board_replies', ascending: true });

    if (result.error) {
      boardList.innerHTML =
        '<p class="board-error">' + escapeHtml(result.error.message || '목록을 불러오지 못했습니다.') + '</p>';
      return;
    }

    var posts = result.data || [];
    if (boardEmpty) boardEmpty.hidden = posts.length > 0;

    posts.forEach(function (post) {
      var replies = post.board_replies || [];
      var repliesHtml = '';
      if (replies.length) {
        repliesHtml =
          '<div class="board-post__replies">' +
          replies
            .map(function (reply) {
              return (
                '<div class="board-post__reply">' +
                '<p class="board-post__reply-meta">' +
                escapeHtml(reply.author_email || '관리자') +
                ' · ' +
                escapeHtml(formatDate(reply.created_at)) +
                '</p>' +
                '<p class="board-post__reply-body">' +
                escapeHtml(reply.body || '') +
                '</p>' +
                '</div>'
              );
            })
            .join('') +
          '</div>';
      }

      var article = document.createElement('article');
      article.className = 'board-post';
      article.innerHTML =
        '<header class="board-post__head">' +
        '<h3 class="board-post__title">' +
        escapeHtml(post.title) +
        '</h3>' +
        '<p class="board-post__meta">' +
        escapeHtml(post.author_email || '') +
        ' · ' +
        escapeHtml(formatDate(post.created_at)) +
        '</p>' +
        '</header>' +
        '<p class="board-post__body">' +
        escapeHtml(post.body) +
        '</p>' +
        repliesHtml;
      boardList.appendChild(article);
    });
  }

  function showBoardFormError(msg) {
    if (!boardFormError) return;
    boardFormError.textContent = msg;
    boardFormError.hidden = !msg;
  }

  async function submitPost(e) {
    e.preventDefault();
    if (!isLoggedIn()) {
      openAuthModal('login', { openBoardAfter: true });
      return;
    }

    showBoardFormError('');
    var title = boardTitle ? boardTitle.value.trim() : '';
    var body = boardBody ? boardBody.value.trim() : '';

    if (!title) {
      showBoardFormError('제목을 입력해 주세요.');
      return;
    }
    if (!body) {
      showBoardFormError('내용을 입력해 주세요.');
      return;
    }

    if (boardSubmitBtn) {
      boardSubmitBtn.disabled = true;
      boardSubmitBtn.textContent = '등록 중…';
    }

    try {
      var sb = getClient();
      var user = session.user;
      var result = await sb.from('board_posts').insert({
        author_id: user.id,
        author_email: user.email || '',
        title: title,
        body: body,
      });

      if (result.error) throw result.error;

      if (boardForm) boardForm.reset();
      await loadPosts();
    } catch (err) {
      showBoardFormError(err.message || '글 등록에 실패했습니다.');
    } finally {
      if (boardSubmitBtn) {
        boardSubmitBtn.disabled = false;
        boardSubmitBtn.textContent = '글 등록';
      }
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    clearAuthErrors();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;

    try {
      var sb = getClient();
      var result = await sb.auth.signInWithPassword({ email: email, password: password });
      if (result.error) throw result.error;
      session = result.data.session;
      updateHeaderAuth();
      closeAuthModal();
      if (pendingBoardOpen) {
        pendingBoardOpen = false;
        setBoardVisible(true);
        await loadPosts();
        scrollToSection('#board');
      }
    } catch (err) {
      if (loginError) {
        loginError.textContent = err.message || '로그인에 실패했습니다.';
        loginError.hidden = false;
      }
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    clearAuthErrors();
    var email = document.getElementById('signupEmail').value.trim();
    var password = document.getElementById('signupPassword').value;
    var password2 = document.getElementById('signupPasswordConfirm').value;

    if (password.length < 6) {
      signupError.textContent = '비밀번호는 6자 이상이어야 합니다.';
      signupError.hidden = false;
      return;
    }
    if (password !== password2) {
      signupError.textContent = '비밀번호 확인이 일치하지 않습니다.';
      signupError.hidden = false;
      return;
    }

    try {
      var sb = getClient();
      var result = await sb.auth.signUp({ email: email, password: password });
      if (result.error) throw result.error;

      if (result.data.session) {
        session = result.data.session;
        updateHeaderAuth();
        closeAuthModal();
        if (pendingBoardOpen) {
          pendingBoardOpen = false;
          setBoardVisible(true);
          await loadPosts();
          scrollToSection('#board');
        }
        return;
      }

      signupError.textContent =
        '가입 요청이 접수되었습니다. 이메일 인증이 필요하면 메일함을 확인한 뒤 로그인해 주세요.';
      signupError.hidden = false;
      setAuthTab('login');
    } catch (err) {
      signupError.textContent = err.message || '회원가입에 실패했습니다.';
      signupError.hidden = false;
    }
  }

  async function handleLogout() {
    try {
      var sb = getClient();
      await sb.auth.signOut();
    } catch (err) {
      console.warn(err);
    }
    session = null;
    updateHeaderAuth();
    setBoardVisible(false);
  }

  if (navBoardLink) {
    navBoardLink.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      tryOpenBoard();
      var navMenu = document.getElementById('navMenu');
      var navToggle = document.getElementById('navToggle');
      if (navMenu && navMenu.classList.contains('is-open') && navToggle) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', '메뉴 열기');
        navMenu.classList.remove('is-open');
      }
    });
  }

  if (headerAuthBtn) {
    headerAuthBtn.addEventListener('click', function () {
      if (headerAuthBtn.getAttribute('data-mode') === 'logout') {
        handleLogout();
        return;
      }
      openAuthModal('login');
    });
  }

  if (authTabLogin) authTabLogin.addEventListener('click', function () { setAuthTab('login'); });
  if (authTabSignup) authTabSignup.addEventListener('click', function () { setAuthTab('signup'); });
  if (authModalClose) authModalClose.addEventListener('click', closeAuthModal);
  if (authModalBackdrop) authModalBackdrop.addEventListener('click', closeAuthModal);
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (signupForm) signupForm.addEventListener('submit', handleSignup);
  if (boardForm) boardForm.addEventListener('submit', submitPost);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && authModal && !authModal.hidden) closeAuthModal();
  });

  getClient().auth.onAuthStateChange(function (_event, newSession) {
    session = newSession;
    updateHeaderAuth();
  });

  refreshSession()
    .then(function () {
      if (window.location.hash === '#board') {
        if (!tryOpenBoard()) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    })
    .catch(function (err) {
      console.warn('Auth init:', err.message);
      updateHeaderAuth();
    });

  window.addEventListener('hashchange', function () {
    if (window.location.hash === '#board') tryOpenBoard();
  });
})();
