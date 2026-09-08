document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.fp-section');
  const emailForm = document.getElementById('emailForm');
  const toast = document.getElementById('toast');

  // 메뉴 클릭 시 풀페이지 스크롤 이동
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // 이메일 알림 신청 처리
  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
      emailForm.reset();
    });
  }
});
