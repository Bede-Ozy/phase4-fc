const practiceData = {
    1: {
        question: "How does Tailwind CSS know to generate utility classes (like `bg-dark` or `text-primary`) for our custom brand colors?",
        codeBlock: null,
        options: [
            { text: "We wrote custom CSS variables like `body { background-color: var(--dark); }` in our `styles.css` file.", isCorrect: false, feedback: "Incorrect. We avoided writing custom classes for this by passing the configuration to Tailwind." },
            { text: "Tailwind reads the keys inside the `tailwind.config` object in the `<script>` tag and automatically injects the utility classes directly in the browser.", isCorrect: true, feedback: "Correct! By providing a `tailwind.config` object in our HTML, Tailwind dynamically generates the exact utility classes we need on the fly." },
            { text: "We ran an `npm build` command in the terminal to compile the colors into a CSS bundle.", isCorrect: false, feedback: "Incorrect. Since we linked Tailwind via CDN, there is no build step required." },
            { text: "We downloaded a specific version of Tailwind that already had Phase 4 FC colors hardcoded into it.", isCorrect: false, feedback: "Incorrect. We used the standard Tailwind CDN." }
        ]
    },
    2: {
        question: "Which two CSS properties are primarily responsible for creating the 'Glassmorphism' frosted-glass effect in our `.glass-card` utility class?",
        codeBlock: `.glass-card {\n    /* Missing Properties */\n}`,
        options: [
            { text: "`box-shadow` and `border-radius`", isCorrect: false, feedback: "Incorrect. While these add polish, they don't create a glass effect." },
            { text: "`background: rgba(...)` and `backdrop-filter: blur(...)`", isCorrect: true, feedback: "Correct! The semi-transparent rgba background combined with a backdrop-filter creates the signature frosted glass look." },
            { text: "`opacity: 0.5` and `filter: drop-shadow(...)`", isCorrect: false, feedback: "Incorrect. Lowering opacity affects the whole element including text, rather than blurring the background behind it." },
            { text: "`background-image: linear-gradient(...)` and `mix-blend-mode: overlay`", isCorrect: false, feedback: "Incorrect. This is used for color blending, not glassmorphism." }
        ]
    },
    3: {
        question: "Why do we connect to Firebase using module CDN links (e.g. `https://www.gstatic.com/...`) instead of running `npm install firebase`?",
        codeBlock: `import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";`,
        options: [
            { text: "Because `npm install firebase` costs money, whereas CDN links are free.", isCorrect: false, feedback: "Incorrect. Both methods are free." },
            { text: "Because we aren't using a bundler like Webpack or Vite, so importing directly via CDN allows the project to run cleanly in the browser.", isCorrect: true, feedback: "Correct! Using CDNs keeps our vanilla Javascript project simple without requiring complex build tools." },
            { text: "Because the CDN links are more secure than installing the npm package locally.", isCorrect: false, feedback: "Incorrect. Security relies on Firestore Rules, not how the SDK is imported." },
            { text: "Because Firebase doesn't support npm installations.", isCorrect: false, feedback: "Incorrect. Firebase is heavily used as an npm package in Node/React apps." }
        ]
    },
    4: {
        question: "What is the primary benefit of using Firestore's `onSnapshot()` method over a traditional REST API GET request?",
        codeBlock: `onSnapshot(qSessions, (snapshot) => {\n    this.sessions = snapshot.docs.map(doc => doc.data());\n    this.render();\n});`,
        options: [
            { text: "`onSnapshot()` downloads all data at once, whereas REST APIs fetch page by page.", isCorrect: false, feedback: "Incorrect. Both can be paginated or unpaginated." },
            { text: "`onSnapshot()` creates a persistent connection that instantly triggers the callback function whenever data changes on the server, ensuring real-time UI updates.", isCorrect: true, feedback: "Correct! It opens a WebSocket, so the moment someone scores a goal, every connected user's screen updates instantly without refreshing." },
            { text: "`onSnapshot()` automatically converts Javascript objects into secure JSON strings.", isCorrect: false, feedback: "Incorrect. That's `JSON.stringify`'s job." },
            { text: "`onSnapshot()` prevents unauthorized users from reading the data.", isCorrect: false, feedback: "Incorrect. Security is handled by Firestore Rules, not the read method." }
        ]
    },
    5: {
        question: "In our app, we use Javascript to add the `.hidden` class to hide the Admin dashboard if a user isn't logged in. Why is this insufficient for real database security?",
        codeBlock: `if (!user) {\n    adminContent.classList.add('hidden');\n}`,
        options: [
            { text: "Because Javascript cannot run on mobile devices.", isCorrect: false, feedback: "Incorrect. Javascript runs perfectly on mobile devices." },
            { text: "Because it only hides the HTML visually. A tech-savvy user could use browser dev tools to remove the `.hidden` class and see the dashboard.", isCorrect: true, feedback: "Correct! Client-side hiding is just for UX. You must secure the actual database using Firestore Security Rules (e.g., `allow write: if request.auth != null;`)." },
            { text: "Because `.hidden` is not a valid CSS class in Tailwind.", isCorrect: false, feedback: "Incorrect. `.hidden` resolves to `display: none` in Tailwind." },
            { text: "Because Firebase Authentication bypasses HTML classes altogether.", isCorrect: false, feedback: "Incorrect. They are unrelated concepts." }
        ]
    }
};

function initPractice(chapterNum) {
    const container = document.getElementById('practice-container');
    if (!container) return;

    const data = practiceData[chapterNum];
    if (!data) return;

    let html = `
        <div class="glass-card p-6 md:p-8 rounded-3xl border border-primary/30 relative overflow-hidden mt-12 mb-8">
            <div class="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            
            <div class="flex items-center gap-3 mb-6">
                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h3 class="!m-0 text-xl font-black text-white">Knowledge Check</h3>
            </div>
            
            <p class="text-lg font-medium text-slate-200 mb-6">${data.question}</p>
    `;

    if (data.codeBlock) {
        html += `
            <div class="mb-6 rounded-xl overflow-hidden border border-slate-700/50">
                <pre class="!m-0 !rounded-none !bg-slate-900/80"><code class="language-javascript">${data.codeBlock}</code></pre>
            </div>
        `;
    }

    html += `<div class="space-y-3" id="options-container-${chapterNum}">`;

    data.options.forEach((opt, idx) => {
        html += `
            <button onclick="handlePracticeClick(${chapterNum}, ${idx})" id="opt-${chapterNum}-${idx}" class="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700 transition-colors flex items-start gap-4 group text-slate-300">
                <div class="w-6 h-6 shrink-0 rounded-full border-2 border-slate-500 group-hover:border-primary flex items-center justify-center mt-0.5" id="circle-${chapterNum}-${idx}">
                </div>
                <div class="flex-1">${opt.text}</div>
            </button>
            <div id="feedback-${chapterNum}-${idx}" class="hidden p-4 rounded-xl text-sm font-medium animate-in slide-in-from-top-2 duration-200"></div>
        `;
    });

    html += `</div></div>`;
    container.innerHTML = html;

    // We might need to manually trigger Prism to highlight the injected code block
    if (window.Prism && data.codeBlock) {
        Prism.highlightAllUnder(container);
    }
}

window.handlePracticeClick = function (chapterNum, optionIdx) {
    const data = practiceData[chapterNum];
    const opt = data.options[optionIdx];

    // Reset all options visually
    data.options.forEach((_, idx) => {
        const btn = document.getElementById(`opt-${chapterNum}-${idx}`);
        const feedback = document.getElementById(`feedback-${chapterNum}-${idx}`);
        const circle = document.getElementById(`circle-${chapterNum}-${idx}`);

        btn.classList.remove('border-primary', 'bg-primary/10', 'border-red-500', 'bg-red-500/10', 'border-slate-500');
        btn.classList.add('border-slate-700', 'bg-slate-800/50');

        circle.classList.remove('border-primary', 'border-red-500', 'bg-primary', 'bg-red-500');
        circle.classList.add('border-slate-500');
        circle.innerHTML = '';

        feedback.classList.add('hidden');
    });

    // Style the clicked option
    const clickedBtn = document.getElementById(`opt-${chapterNum}-${optionIdx}`);
    const clickedFeedback = document.getElementById(`feedback-${chapterNum}-${optionIdx}`);
    const clickedCircle = document.getElementById(`circle-${chapterNum}-${optionIdx}`);

    clickedFeedback.classList.remove('hidden');
    clickedFeedback.innerHTML = opt.feedback;

    if (opt.isCorrect) {
        clickedBtn.classList.replace('border-slate-700', 'border-primary');
        clickedBtn.classList.replace('bg-slate-800/50', 'bg-primary/10');
        clickedCircle.classList.replace('border-slate-500', 'border-primary');
        clickedCircle.classList.add('bg-primary');
        clickedCircle.innerHTML = `<svg class="w-4 h-4 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`;
        clickedFeedback.classList.add('bg-primary/20', 'text-primary', 'border', 'border-primary/30');
        clickedFeedback.classList.remove('bg-red-500/20', 'text-red-400', 'border-red-500/30');
    } else {
        clickedBtn.classList.replace('border-slate-700', 'border-red-500');
        clickedBtn.classList.replace('bg-slate-800/50', 'bg-red-500/10');
        clickedCircle.classList.replace('border-slate-500', 'border-red-500');
        clickedCircle.classList.add('bg-red-500');
        clickedCircle.innerHTML = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>`;
        clickedFeedback.classList.add('bg-red-500/20', 'text-red-400', 'border', 'border-red-500/30');
        clickedFeedback.classList.remove('bg-primary/20', 'text-primary', 'border-primary/30');
    }
}
