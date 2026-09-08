document.addEventListener('DOMContentLoaded', () => {
  // 1. Navigation Active Switch
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      navLinks.forEach(l => l.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });

  // 2. Email Form Handling & Toast Alert
  const emailForm = document.getElementById('emailForm');
  const emailInput = document.getElementById('emailInput');
  const toast = document.getElementById('toast');

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (email) {
        showToast(`'${email}' (으)로 알림 신청이 완료되었습니다! 🚀`);
        emailInput.value = '';
      }
    });
  }

  // 3. Header Alert Button Scroll-to-Form
  const headerNotifyBtn = document.getElementById('headerNotifyBtn');
  if (headerNotifyBtn) {
    headerNotifyBtn.addEventListener('click', () => {
      emailInput.focus();
      emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // 4. Chat Bubble Interactive Highlight
  const chatBubbles = document.querySelectorAll('.chat-bubble');
  chatBubbles.forEach(bubble => {
    bubble.addEventListener('click', () => {
      chatBubbles.forEach(b => b.classList.remove('active'));
      bubble.classList.add('active');
    });
  });
});
