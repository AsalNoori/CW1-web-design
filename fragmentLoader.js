function loadFragment(targetId, url) {
    return fetch(url)
      .then(response => response.text())
      .then(html => {
        const container = document.getElementById(targetId);
        if (!container) return;
        container.innerHTML = html;
        container.querySelectorAll('script').forEach(oldScript => {
          const newScript = document.createElement('script');
          if (oldScript.src) {
            newScript.src = oldScript.src;
          } else {
            newScript.textContent = oldScript.textContent;
          }
          document.body.appendChild(newScript);
          oldScript.remove();
        });
      })
      .catch(err => console.error(`Failed to load ${url}`, err));
  }
  