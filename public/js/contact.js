import { initThemeSwitcher } from './theme.js';

const form = document.querySelector('#contactForm');
const status = document.querySelector('#contactStatus');
const errorMap = {
  name: 'nameError',
  email: 'emailError',
  subject: 'subjectError',
  inquiryType: 'typeError',
  message: 'messageError'
};

function clearErrors() {
  Object.values(errorMap).forEach((id) => {
    const el = document.querySelector('#' + id);
    if (el) el.textContent = '';
  });
}

function validate(data) {
  const errors = {};
  if (!data.name) errors.name = 'Enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (!data.subject) errors.subject = 'Enter a subject.';
  if (!data.inquiryType) errors.inquiryType = 'Choose an inquiry type.';
  if (!data.message) errors.message = 'Enter a message.';

  Object.entries(errors).forEach(([key, value]) => {
    const el = document.querySelector('#' + errorMap[key]);
    if (el) el.textContent = value;
  });

  return Object.keys(errors).length === 0;
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  status.textContent = '';
  const data = Object.fromEntries(new FormData(form));

  if (!document.querySelector('#contactConsent').checked) {
    status.textContent = 'Please acknowledge the product-communication note before sending.';
    return;
  }

  if (!validate(data)) return;

  const button = form.querySelector('button');
  button.disabled = true;
  button.textContent = 'Sending…';

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'Message could not be sent.');
    form.reset();
    status.textContent = 'Message sent successfully. Thanks for reaching out.';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Send message <span aria-hidden="true">→</span>';
  }
});

initThemeSwitcher();
document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
