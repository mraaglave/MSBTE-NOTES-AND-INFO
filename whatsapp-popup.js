(function () {
    if (document.getElementById('whatsappPopup')) return;

    const popupHTML = `
    <div id="whatsappPopup"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 hidden transition-opacity duration-300 opacity-0"
        style="z-index: 9999;">
        <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 text-center transform transition-all scale-95">
            <div class="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="h-12 w-12 text-blue-600"
                    fill="currentColor" style="height: 3rem; width: 3rem; color: #2563eb;">
                    <path d="M623.6 137.5L340.6 9.7c-12.7-5.7-27.4-5.7-40.1 0L16.4 137.5c-19.7 8.9-19.7 37 0 45.9L112 226.3v135.2c0 13.9 9.3 26.2 22.9 29.8C200.2 408.8 266.3 416 320 416s119.8-7.2 185.1-24.7c13.5-3.6 22.9-15.9 22.9-29.8V226.3l95.6-42.9c19.7-8.9 19.7-37 0-45.9zM512 344.6c-59.4 14.6-118 21.4-192 21.4s-132.6-6.8-192-21.4V244.3l172 77.2c12.7 5.7 27.4 5.7 40.1 0l172-77.2v100.3z"/>
                </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2" style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">🎓 DSE Admission Counselling 2026</h3>
            <p class="text-gray-600 mb-4" style="color: #4b5563; margin-bottom: 1rem; font-size: 0.9rem; line-height: 1.55;">
                DSE Counselling is now available! Get personalized college choice list guidance and 1-on-1 support for just <strong>₹1000</strong>. Click below to get the counselling, fill the form, and start now.
            </p>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.75rem; padding: 0.6rem 1rem; margin-bottom: 1.25rem; font-size: 0.85rem; color: #1e3a8a; font-weight: 600;">
                ✅ Premium Option List &nbsp;|&nbsp; ✅ Expert Guidance &nbsp;|&nbsp; ✅ 1-on-1 Support
            </div>

            <div class="space-y-3" style="display: flex; flex-direction: column; gap: 0.75rem;">
                <a href="https://forms.gle/A2eSowCKzDgSYn8C8" target="_blank"
                    id="joinWhatsappBtn"
                    style="display: block; width: 100%; background-color: #2563eb; color: white; font-weight: 700; padding: 0.75rem 1rem; border-radius: 9999px; text-decoration: none; transition: background-color 0.3s; text-align: center;"
                    onmouseover="this.style.backgroundColor='#1d4ed8'"
                    onmouseout="this.style.backgroundColor='#2563eb'">
                    Get Counselling Now
                </a>
                <button id="denyWhatsappBtn"
                    style="display: block; width: 100%; color: #9ca3af; font-size: 0.875rem; font-weight: 500; transition: color 0.3s; background: none; border: none; cursor: pointer;"
                    onmouseover="this.style.color='#4b5563'"
                    onmouseout="this.style.color='#9ca3af'">
                    Maybe Later
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

        localStorage.setItem('dseCounsellingPopupLastShown', new Date().getTime().toString());
    }

    joinBtn.addEventListener('click', closePopup);
    denyBtn.addEventListener('click', closePopup);

    const lastShown = localStorage.getItem('dseCounsellingPopupLastShown');
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (!lastShown || (now - parseInt(lastShown)) > twentyFourHours) {
        setTimeout(showPopup, 2000);
    }

})();