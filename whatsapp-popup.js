(function () {
    if (document.getElementById('whatsappPopup')) return;

    const popupHTML = `
    <div id="whatsappPopup"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 hidden transition-opacity duration-300 opacity-0"
        style="z-index: 9999;">
        <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 text-center transform transition-all scale-95">
            <div class="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-12 w-12 text-green-500"
                    fill="currentColor" style="height: 3rem; width: 3rem; color: #10b981;">
                    <path
                        d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2" style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">🚀 MSBTE Updates & Notes!</h3>
            <p class="text-gray-600 mb-4" style="color: #4b5563; margin-bottom: 1rem; font-size: 0.9rem;">Join our WhatsApp community for <strong>daily updates and free notes</strong> specially for MSBTE students.</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.75rem; padding: 0.6rem 1rem; margin-bottom: 1rem; font-size: 0.85rem; color: #065f46;">
                ✅ Daily Updates &nbsp;|&nbsp; ✅ Free Notes &nbsp;|&nbsp; ✅ Important Alerts
            </div>

            <div class="space-y-3" style="display: flex; flex-direction: column; gap: 0.75rem;">
                <a href="https://chat.whatsapp.com/HxKxLZy32cYETd63arG1Rc" target="_blank"
                    id="joinWhatsappBtn"
                    style="display: block; width: 100%; background-color: #10b981; color: white; font-weight: 700; padding: 0.75rem 1rem; border-radius: 9999px; text-decoration: none; transition: background-color 0.3s;"
                    onmouseover="this.style.backgroundColor='#059669'"
                    onmouseout="this.style.backgroundColor='#10b981'">
                    Join WhatsApp Group
                </a>
                <button id="denyWhatsappBtn"
                    style="display: block; width: 100%; color: #9ca3af; font-size: 0.875rem; font-weight: 500; transition: color 0.3s; background: none; border: none; cursor: pointer;"
                    onmouseover="this.style.color='#4b5563'"
                    onmouseout="this.style.color='#9ca3af'">
                    Already a Member
                </button>
            </div>
        </div>
    </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = popupHTML;
    document.body.appendChild(div);

    const popup = document.getElementById('whatsappPopup');
    const joinBtn = document.getElementById('joinWhatsappBtn');
    const denyBtn = document.getElementById('denyWhatsappBtn');

    function showPopup() {
        popup.classList.remove('hidden');
        popup.style.display = 'flex';

        setTimeout(() => {
            popup.classList.remove('opacity-0');
            popup.style.opacity = '1';

            const content = popup.querySelector('div');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
            content.style.transform = 'scale(1)';
        }, 10);
    }

    function closePopup() {
        popup.classList.add('opacity-0');
        popup.style.opacity = '0';

        const content = popup.querySelector('div');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        content.style.transform = 'scale(0.95)';

        setTimeout(() => {
            popup.classList.add('hidden');
            popup.style.display = 'none';
        }, 300);

        localStorage.setItem('whatsappPopupLastShown', new Date().getTime().toString());
    }

    joinBtn.addEventListener('click', closePopup);
    denyBtn.addEventListener('click', closePopup);

    const lastShown = localStorage.getItem('whatsappPopupLastShown');
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (!lastShown || (now - parseInt(lastShown)) > twentyFourHours) {
        setTimeout(showPopup, 2000);
    }

})();