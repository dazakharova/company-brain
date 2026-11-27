export function renderHomeScreen(container) {
  // This template is static. Use textContent for future user or server content.
  container.innerHTML = `
    <section aria-labelledby="welcome-title">
      <h1 id="welcome-title">Company Brain</h1>
      <p>Client foundation is running.</p>
    </section>
  `;
}
