(function () {
    'use strict';

    const config = window.IO_CONFIG || {};
    const i18n = window.IO_I18N || {};
    config.lastId = -1;
    config.pollingState = false;
    config.pollingUpdatesState = false;

    document.addEventListener('DOMContentLoaded', function () {

        const ui = {
            box: document.getElementById('chat-box'),
            form: document.getElementById('chat-form'),
            input: document.getElementById('message'),
            btn: document.getElementById('send-btn'),
            micBtn: document.getElementById('mic-btn'),
            toastEl: document.getElementById('errorToast'),
            toastMsg: document.getElementById('toastMessage'),
            fileInput: document.getElementById('file-input'),
            fileBtn: document.getElementById('file-btn'),
            deleteBtn: document.getElementById('delete-btn'),
            signoutBtn: document.getElementById('signout-btn'),
            signinBtn: document.getElementById('signin-btn'),
            langBtn: document.getElementById('lang-btn'),
            previewDiv: document.getElementById('upload-preview')
        };

        if (!ui.box || !ui.form || !ui.input || !ui.btn) {
            // This page has no chat UI (shouldn't happen — auth-gate has its own template) — bail out safely.
            return;
        }

        const state = {
            selectedFiles: [], voiceBlob: null, isRecording: false, mediaRecorder: null,
            audioChunks: [], isFirstLoad: true, isThinking: false, autoMessageSent: false,
            isInitialHistoryLoad: true
        };

        const errorToast = window.bootstrap ? new bootstrap.Toast(ui.toastEl, {delay: 4000}) : null;
        let pollTimer = null;
        let updateTimer = null;
        let thinkingTimer = null;

        const showError = (msg) => {
            if (!ui.toastEl || !ui.toastMsg) return;
            ui.toastMsg.textContent = msg;
            if (errorToast) errorToast.show();
        };

        /* ---------------------------------------------------------------
           Reveal-on-scroll
           --------------------------------------------------------------- */
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                } else if (entry.boundingClientRect.top > 0) {
                    entry.target.classList.remove('is-visible');
                }
            });
        }, {threshold: 0.05, rootMargin: "0px 0px -50px 0px"});
        document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

        /* ---------------------------------------------------------------
           Hide the bottom bar while any non-chat input is focused on
           mobile (keyboard overlap avoidance)
           --------------------------------------------------------------- */
        document.addEventListener('focusin', function (e) {
            if (window.innerWidth <= 991 && e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') && e.target.id !== 'message') {
                const gb = document.querySelector('.glass-bottom');
                if (gb) gb.style.display = 'none';
            }
        });
        document.addEventListener('focusout', function (e) {
            if (window.innerWidth <= 991 && e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') && e.target.id !== 'message') {
                const gb = document.querySelector('.glass-bottom');
                if (gb) gb.style.display = '';
            }
        });

        /* ---------------------------------------------------------------
           Feature grid tap-to-highlight (mobile equivalent of hover)
           --------------------------------------------------------------- */
        const featureBoxes = document.querySelectorAll('.feature-box-inner');
        featureBoxes.forEach(box => {
            box.addEventListener('click', function () {
                const featureWrapper = document.querySelector('.features-grid-wrapper');
                const wasActive = this.classList.contains('active-feature');
                featureBoxes.forEach(b => b.classList.remove('active-feature'));
                if (wasActive) {
                    featureWrapper.classList.remove('has-active');
                } else {
                    this.classList.add('active-feature');
                    featureWrapper.classList.add('has-active');
                }
            });
        });
        document.addEventListener('click', function (e) {
            const featureWrapper = document.querySelector('.features-grid-wrapper');
            const clickedFeature = e.target.closest('.feature-box-inner');
            if (!clickedFeature && featureWrapper && featureWrapper.classList.contains('has-active')) {
                document.querySelectorAll('.feature-box-inner').forEach(b => b.classList.remove('active-feature'));
                featureWrapper.classList.remove('has-active');
            }
        });

        /* ---------------------------------------------------------------
           Language switcher
           --------------------------------------------------------------- */
        window.changeLanguage = function (lang) {
            document.cookie = "io_lang=" + lang + "; path=/; max-age=31536000";
            window.location.reload();
        };

        /* ---------------------------------------------------------------
           "Try it" demo URL launcher
           --------------------------------------------------------------- */
        window.launchDemo = function () {
            const urlField = document.getElementById('demoUrlInput');
            let urlInput = urlField ? urlField.value.trim() : '';
            if (urlInput === '') urlInput = 'https://example.com';
            if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) urlInput = 'https://' + urlInput;
            window.open('https://idealistic.ai/io/v1/portal/tryWidget/?url=' + encodeURIComponent(urlInput), '_blank');
        };
        const demoInputTarget = document.getElementById('demoUrlInput');
        if (demoInputTarget) {
            demoInputTarget.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    window.launchDemo();
                }
            });
        }

        /* ---------------------------------------------------------------
           Pricing calculator
           --------------------------------------------------------------- */
        window.recommendPlan = function () {
            const visitorInput = document.getElementById('visitorCount');
            let v = parseInt(visitorInput ? visitorInput.value : '0', 10) || 0;
            if (v <= 0) {
                alert(i18n.calc_invalid || 'Enter a valid number of visitors.');
                return;
            }
            document.getElementById('calculator-section').classList.add('d-none');
            document.getElementById('recommended-section').classList.remove('d-none');
            document.getElementById('rec-visitors').innerText = v.toLocaleString();

            let planId = 'plan-solo';
            if (v > 3000 && v <= 6000) planId = 'plan-idea';
            if (v > 6000) planId = 'plan-idealistic';

            const container = document.getElementById('rec-card-container');
            container.innerHTML = '';
            const source = document.getElementById(planId);
            if (source) {
                const clone = source.cloneNode(true);
                clone.classList.remove('col-lg-5', 'col-md-8');
                clone.classList.add('col-12');
                container.appendChild(clone);
            }
        };
        window.resetCalculator = function () {
            document.getElementById('calculator-section').classList.remove('d-none');
            document.getElementById('recommended-section').classList.add('d-none');
        };
        const visitorCountInput = document.getElementById('visitorCount');
        if (visitorCountInput) {
            visitorCountInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    window.recommendPlan();
                }
            });
        }
        const defaultSoloSlot = document.getElementById('default-solo-card');
        const soloTemplate = document.getElementById('plan-solo');
        if (defaultSoloSlot && soloTemplate) {
            const defaultSolo = soloTemplate.cloneNode(true);
            defaultSolo.classList.remove('col-lg-5', 'col-md-8');
            defaultSolo.classList.add('col-12');
            defaultSoloSlot.appendChild(defaultSolo);
        }

        /* ---------------------------------------------------------------
           Paddle checkout
           --------------------------------------------------------------- */
        window.checkout = function (priceId) {
            if (window.Paddle) {
                Paddle.Checkout.open({items: [{priceId: priceId, quantity: 1}]});
            }
        };

        /* ---------------------------------------------------------------
           Embed snippet — copy button (text stays real & correct even
           though it's visually blurred via CSS)
           --------------------------------------------------------------- */
        document.querySelectorAll('.embed-snippet-copy-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const targetId = this.dataset.copyTarget;
                const codeEl = targetId ? document.getElementById(targetId) : null;
                const text = codeEl ? codeEl.textContent : '';
                navigator.clipboard.writeText(text).then(() => {
                    const original = this.innerHTML;
                    this.innerHTML = '<i class="bi bi-check2"></i>';
                    setTimeout(() => {
                        this.innerHTML = original;
                    }, 2000);
                });
            });
        });

        /* ---------------------------------------------------------------
           Marquee carousels (reviews / platform icons)
           --------------------------------------------------------------- */
        function initCarousel(scrollId, dotsId, originalCount) {
            const scrollEl = document.getElementById(scrollId);
            const dotsEl = document.getElementById(dotsId);
            if (!scrollEl || !dotsEl || !originalCount) return;

            const cards = scrollEl.children;
            for (let i = originalCount; i < cards.length; i++) {
                cards[i].setAttribute('aria-hidden', 'true');
                cards[i].setAttribute('inert', '');
            }
            for (let i = 0; i < originalCount; i++) {
                const dot = document.createElement('div');
                dot.className = 'review-dot' + (i === 0 ? ' active' : '');
                dot.onclick = () => {
                    if (cards.length > 0) {
                        const itemWidth = cards[0].getBoundingClientRect().width;
                        const gap = parseFloat(window.getComputedStyle(scrollEl).gap) || 0;
                        scrollEl.scrollTo({left: i * (itemWidth + gap), behavior: 'smooth'});
                    }
                };
                dotsEl.appendChild(dot);
            }

            let isHovered = false, isDown = false, startX, startScrollLeft;

            const updateActiveDot = () => {
                if (cards.length > 0) {
                    const itemWidth = cards[0].getBoundingClientRect().width;
                    const gap = parseFloat(window.getComputedStyle(scrollEl).gap) || 0;
                    const currentIndex = Math.round(scrollEl.scrollLeft / (itemWidth + gap)) % originalCount;
                    if (!isNaN(currentIndex)) {
                        dotsEl.querySelectorAll('.review-dot').forEach((d, i) => d.classList.toggle('active', i === currentIndex));
                    }
                }
            };
            scrollEl.addEventListener('scroll', updateActiveDot, {passive: true});

            const scrollContent = () => {
                if (!isHovered && !isDown) {
                    scrollEl.scrollLeft += 0.8;
                    if (scrollEl.scrollLeft >= scrollEl.scrollWidth / 2) scrollEl.scrollLeft = 0;
                }
                requestAnimationFrame(scrollContent);
            };
            requestAnimationFrame(scrollContent);

            scrollEl.addEventListener('mouseenter', () => isHovered = true);
            scrollEl.addEventListener('mouseleave', () => isHovered = false);
            scrollEl.addEventListener('touchstart', () => isHovered = true, {passive: true});
            scrollEl.addEventListener('touchend', () => setTimeout(() => isHovered = false, 1500));

            scrollEl.addEventListener('mousedown', (e) => {
                isDown = true;
                startX = e.pageX - scrollEl.offsetLeft;
                startScrollLeft = scrollEl.scrollLeft;
                scrollEl.style.cursor = 'grabbing';
            });
            scrollEl.addEventListener('mouseleave', () => {
                isDown = false;
                scrollEl.style.cursor = 'grab';
            });
            scrollEl.addEventListener('mouseup', () => {
                isDown = false;
                scrollEl.style.cursor = 'grab';
            });
            scrollEl.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - scrollEl.offsetLeft;
                const walk = (x - startX) * 1.5;
                scrollEl.scrollLeft = startScrollLeft - walk;
            });
        }

        const reviewsScroll = document.getElementById('reviews-scroll-area');
        const iconsScroll = document.getElementById('icons-scroll-area');
        if (reviewsScroll) initCarousel('reviews-scroll-area', 'reviews-dots', parseInt(reviewsScroll.dataset.originalCount || '0', 10));
        if (iconsScroll) initCarousel('icons-scroll-area', 'icons-dots', parseInt(iconsScroll.dataset.originalCount || '0', 10));

        /* ---------------------------------------------------------------
           Animated tagline under the mock browser / mock phone logo.
           Previously done with a CSS `content:` trick fed by PHP; now it's
           plain JS cycling through the translated anim_* strings so the
           CSS file has zero PHP in it.
           --------------------------------------------------------------- */
        const animWords = [
            i18n.anim_widget, i18n.anim_chatbot, i18n.anim_chatbox, i18n.anim_support,
            i18n.anim_clients, i18n.anim_business, i18n.anim_modern
        ].filter(Boolean);

        if (animWords.length > 0) {
            let animIndex = 0;
            const dynamicWordEls = document.querySelectorAll('.mock-dynamic-word');
            dynamicWordEls.forEach(el => {
                el.textContent = animWords[0];
            });
            setInterval(() => {
                dynamicWordEls.forEach(el => el.classList.add('is-fading'));
                setTimeout(() => {
                    animIndex = (animIndex + 1) % animWords.length;
                    dynamicWordEls.forEach(el => {
                        el.textContent = animWords[animIndex];
                        el.classList.remove('is-fading');
                    });
                }, 350);
            }, 2500);
        }

        /* ---------------------------------------------------------------
           Placeholder marquee for the chat textarea (scrolls long
           placeholder text so it never gets visually clipped)
           --------------------------------------------------------------- */
        const measureCtx = document.createElement('canvas').getContext('2d');

        function getPhWidth(text, el) {
            measureCtx.font = window.getComputedStyle(el).font;
            return measureCtx.measureText(text).width;
        }

        setInterval(() => {
            document.querySelectorAll('textarea#message').forEach(el => {
                if (!el.dataset.origPh) {
                    el.dataset.origPh = el.placeholder;
                    el.dataset.phSpaced = el.placeholder + "    \u2022    ";
                }
                if (document.activeElement === el) {
                    if (el.placeholder !== el.dataset.origPh) el.placeholder = el.dataset.origPh;
                    return;
                }
                const textWidth = getPhWidth(el.dataset.origPh, el);
                if (textWidth > el.clientWidth - 20) {
                    let p = el.dataset.phSpaced;
                    el.dataset.phSpaced = p.substring(1) + p[0];
                    el.placeholder = el.dataset.phSpaced;
                } else if (el.placeholder !== el.dataset.origPh) {
                    el.placeholder = el.dataset.origPh;
                }
            });
        }, 100);

        /* ---------------------------------------------------------------
           Chat: mic button + send button
           (dedicated mic button next to Send, replacing the old
           "send button morphs into a record button" behavior — the mic
           button simply hides itself once there's text to send)
           --------------------------------------------------------------- */
        const setPlaceholder = (text) => {
            ui.input.placeholder = text;
            ui.input.dataset.origPh = text;
            ui.input.dataset.phSpaced = text + "    \u2022    ";
        };

        const updateMicVisibility = () => {
            if (!ui.micBtn) return;
            const hasText = ui.input.value.trim().length > 0;
            const busy = state.isThinking || state.selectedFiles.length > 0 || !!state.voiceBlob;
            const shouldHide = hasText || busy;
            ui.micBtn.classList.toggle('is-hidden', shouldHide);
        };

        const toggleUtilityButtons = (hide) => {
            [ui.deleteBtn, ui.signoutBtn, ui.signinBtn, ui.langBtn].forEach(btn => {
                if (!btn) return;
                btn.classList.toggle('d-none', hide);
                btn.classList.toggle('d-flex', !hide);
            });
        };

        const showThinking = (forceScroll) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'd-flex w-100 thinking-wrapper anim-slide-up mb-3';
            wrapper.innerHTML = '<div class="msg-bubble msg-assistant d-flex flex-column justify-content-center" style="width: 260px; height: 72px; gap: 10px;">'
                + '<div class="skeleton-block" style="width: 100%; height: 14px; border-radius: 4px;"></div>'
                + '<div class="skeleton-block" style="width: 65%; height: 14px; border-radius: 4px;"></div></div>';
            ui.box.appendChild(wrapper);
            smoothScrollToBottom(forceScroll);
            state.isThinking = true;
            ui.input.disabled = true;
            ui.btn.disabled = true;
            setPlaceholder(i18n.chat_wait_reply || 'Wait for the reply...');
            updateMicVisibility();
            thinkingTimer = setTimeout(removeThinking, 60000);
        };

        const removeThinking = () => {
            const el = document.querySelector('.thinking-wrapper');
            if (el) el.remove();
            clearTimeout(thinkingTimer);
            state.isThinking = false;
            ui.input.disabled = false;
            ui.btn.disabled = false;
            setPlaceholder(config.userTypePlaceholder || i18n.chat_message_ph || '');
            updateMicVisibility();
            ui.input.focus();
        };
        config.userTypePlaceholder = i18n.chat_message_ph || ui.input.placeholder;

        function smoothScrollToBottom(force) {
            setTimeout(() => {
                if (state.isInitialHistoryLoad && !force) return;
                const isAtBottom = ui.box.scrollHeight - ui.box.scrollTop - ui.box.clientHeight <= 150;
                if (force || isAtBottom) ui.box.scrollTo({top: ui.box.scrollHeight, behavior: 'smooth'});
            }, 10);
        }

        ui.input.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
            if (this.value === '') this.style.height = 'auto';
            const hasText = this.value.trim().length > 0;
            toggleUtilityButtons(hasText);
            updateMicVisibility();
        });

        ui.input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!ui.btn.disabled) ui.btn.click();
            }
        });

        window.clearFile = () => {
            state.selectedFiles = [];
            if (ui.fileInput) ui.fileInput.value = '';
            renderUIState();
        };
        window.clearVoice = () => {
            state.voiceBlob = null;
            renderUIState();
        };

        const renderUIState = () => {
            ui.previewDiv.innerHTML = '';
            const hasText = ui.input.value.trim().length > 0;

            if (state.voiceBlob) {
                ui.input.disabled = true;
                setPlaceholder(i18n.chat_voice_ready || 'Voice message ready to send...');
                ui.fileBtn.disabled = true;
                toggleUtilityButtons(true);
                const audioUrl = URL.createObjectURL(state.voiceBlob);
                ui.previewDiv.innerHTML = '<div class="d-flex align-items-center bg-danger rounded-pill p-1 pe-3 mb-1">'
                    + '<audio src="' + audioUrl + '" controls class="me-2 rounded-pill" style="height: 35px; max-width: 200px;"></audio>'
                    + '<i class="bi bi-x-circle-fill text-white fs-5" style="cursor:pointer" onclick="clearVoice()"></i></div>';
            } else if (state.selectedFiles.length > 0) {
                ui.input.disabled = false;
                setPlaceholder(config.userTypePlaceholder);
                toggleUtilityButtons(true);
                ui.previewDiv.innerHTML = '<span class="badge bg-secondary text-white p-2 fs-6 mb-1 me-1"><i class="bi bi-file-earmark"></i> '
                    + state.selectedFiles[0].name + ' <i class="bi bi-x-circle ms-2" style="cursor:pointer" onclick="clearFile()"></i></span>';
            } else {
                if (!state.isThinking) {
                    ui.input.disabled = false;
                    setPlaceholder(config.userTypePlaceholder);
                }
                ui.fileBtn.disabled = false;
                toggleUtilityButtons(hasText);
            }
            updateMicVisibility();
            ui.input.style.height = 'auto';
        };

        if (ui.fileBtn) ui.fileBtn.onclick = () => ui.fileInput && ui.fileInput.click();
        if (ui.fileInput) {
            ui.fileInput.onchange = (e) => {
                if (e.target.files.length > 0) {
                    state.selectedFiles = [e.target.files[0]];
                    state.voiceBlob = null;
                    renderUIState();
                }
                ui.fileInput.value = '';
            };
        }

        /* ---- Mic button: press-and-hold to record, tap again to stop --- */
        if (ui.micBtn) {
            const handleVoiceToggle = async (e) => {
                if (e.type !== 'touchstart') e.preventDefault();
                if (ui.input.value.trim().length > 0 || state.selectedFiles.length > 0 || state.isThinking) return;

                if (!state.isRecording) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
                        state.mediaRecorder = new MediaRecorder(stream);
                        state.audioChunks = [];
                        state.mediaRecorder.ondataavailable = ev => {
                            if (ev.data.size > 0) state.audioChunks.push(ev.data);
                        };
                        state.mediaRecorder.onstop = () => {
                            const type = state.mediaRecorder.mimeType || 'audio/ogg';
                            state.voiceBlob = new Blob(state.audioChunks, {type: type});
                            state.selectedFiles = [];
                            ui.input.value = '';
                            stream.getTracks().forEach(track => track.stop());
                            ui.micBtn.classList.remove('is-recording');
                            ui.micBtn.innerHTML = '<i class="bi bi-mic-fill"></i>';
                            renderUIState();
                        };
                        state.mediaRecorder.start();
                        state.isRecording = true;
                        ui.micBtn.classList.add('is-recording');
                        ui.micBtn.innerHTML = '<i class="bi bi-stop-fill"></i>';
                        ui.input.disabled = true;
                        setPlaceholder(i18n.chat_recording || 'Recording... tap to stop');
                        ui.fileBtn.disabled = true;
                    } catch (err) {
                        showError(i18n.chat_microphone_error || 'Microphone access denied or unavailable.');
                    }
                } else {
                    state.mediaRecorder.stop();
                    state.isRecording = false;
                }
            };
            ui.micBtn.addEventListener('mousedown', handleVoiceToggle);
            ui.micBtn.addEventListener('touchstart', handleVoiceToggle, {passive: true});
        }

        /* ---------------------------------------------------------------
           Chat rendering + polling
           --------------------------------------------------------------- */
        const parseText = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            let safeText = div.innerHTML;
            safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            safeText = safeText.replace(/__(.*?)__/g, '<u>$1</u>');
            const urlRegex = /(https?:\/\/[^\s<*]+[^<*.,:;"')\]\s])/g;
            safeText = safeText.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-info text-decoration-underline" style="word-break: break-all;">$1</a>');
            return safeText;
        };

        const bubbleId = (sender, id) => 'msg-' + sender + '-' + id;

        const appendMsg = (dataObj, sender, forceScroll) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'd-flex w-100 anim-slide-up mb-3';
            const msg = document.createElement('div');
            msg.className = 'msg-bubble msg-' + sender + ' d-flex flex-column';
            if (dataObj.id) msg.id = bubbleId(sender, dataObj.id);
            if (dataObj.text) {
                const textNode = document.createElement('div');
                textNode.innerHTML = parseText(dataObj.text);
                msg.appendChild(textNode);
            }
            if (dataObj.attachment) {
                const att = dataObj.attachment;
                const attBox = document.createElement('div');
                attBox.className = 'attachment-box';
                let html = '<strong><i class="bi bi-paperclip"></i> ' + (att.name || i18n.chat_file || 'File') + '</strong>';
                if (att.analyzed_description) html += '<div class="mt-2 fst-italic">"' + att.analyzed_description + '"</div>';
                attBox.innerHTML = html;
                msg.appendChild(attBox);
            }
            wrapper.appendChild(msg);
            const thinking = document.querySelector('.thinking-wrapper');
            if (thinking) ui.box.insertBefore(wrapper, thinking); else ui.box.appendChild(wrapper);
            smoothScrollToBottom(forceScroll);
        };

        const patchBubbleText = (sender, msgData) => {
            if (!msgData.id || !msgData.text) return;
            const bubble = document.getElementById(bubbleId(sender, msgData.id));
            if (!bubble) return;
            let textNode = Array.from(bubble.children).find(el => !el.classList.contains('attachment-box'));
            if (!textNode) {
                textNode = document.createElement('div');
                bubble.insertBefore(textNode, bubble.firstChild);
            }
            const newHtml = parseText(msgData.text);
            if (textNode.innerHTML !== newHtml) textNode.innerHTML = newHtml;
        };

        const request = async (url, fd) => {
            const res = await fetch(url, {method: 'POST', body: fd, credentials: 'include'});
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        };

        const sync = async () => {
            if (config.pollingState) return;
            config.pollingState = true;
            clearTimeout(pollTimer);
            try {
                const params = new URLSearchParams({
                    session_id: config.sessionId,
                    random_id: config.randomId,
                    after_id: config.lastId
                });
                if (!config.isDemo) {
                    if (config.defaultMessage) params.append('default_message', config.defaultMessage);
                    if (config.domain) params.append('default_domain', config.domain);
                }
                const fetchReq = await fetch(config.getUrl + '?' + params.toString(), {
                    method: 'GET',
                    credentials: 'include'
                });
                if (!fetchReq.ok) throw new Error("HTTP " + fetchReq.status);
                const res = await fetchReq.json();

                if (res.success === false) {
                    if (res.message && res.message.length > 0) showError(res.message);
                    return;
                }

                let fetchedNewMessages = false;

                if (res.data && res.data.history) {
                    const incomingId = parseInt(res.data.last_id, 10);
                    if (incomingId > config.lastId) config.lastId = incomingId;
                    const history = res.data.history;
                    let gotAssistant = false;
                    let lastWasUser = false;
                    for (const time in history) {
                        if (history[time].user) {
                            history[time].user.forEach(m => {
                                appendMsg(m, 'user');
                                fetchedNewMessages = true;
                            });
                            lastWasUser = true;
                        }
                        if (history[time].assistant) {
                            history[time].assistant.forEach(m => {
                                appendMsg(m, 'assistant');
                                fetchedNewMessages = true;
                            });
                            gotAssistant = true;
                            lastWasUser = false;
                        }
                    }
                    state.isInitialHistoryLoad = false;
                    if (gotAssistant) removeThinking();
                    else if (lastWasUser && !state.isThinking) showThinking();
                }

                if (!fetchedNewMessages && config.lastId > 0) {
                    const updateAfterId = Math.max(0, config.lastId - 15);
                    const updateParams = new URLSearchParams({
                        session_id: config.sessionId,
                        random_id: config.randomId,
                        after_id: updateAfterId
                    });
                    if (!config.isDemo) {
                        if (config.defaultMessage) updateParams.append('default_message', config.defaultMessage);
                        if (config.domain) updateParams.append('default_domain', config.domain);
                    }
                    const updateReq = await fetch(config.getUrl + '?' + updateParams.toString(), {
                        method: 'GET',
                        credentials: 'include'
                    });
                    if (updateReq.ok) {
                        const updateRes = await updateReq.json();
                        if (updateRes.success !== false && updateRes.data && updateRes.data.history) {
                            const history = updateRes.data.history;
                            for (const time in history) {
                                ['user', 'assistant'].forEach(sender => {
                                    if (history[time][sender]) history[time][sender].forEach(msgData => patchBubbleText(sender, msgData));
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                // fail silently, scheduler keeps running
            } finally {
                config.pollingState = false;
                const delay = (state.isFirstLoad || state.isThinking) ? 1200 : 4000;
                if (state.isFirstLoad) {
                    const loader = document.getElementById('loading-screen');
                    if (loader) {
                        loader.style.opacity = '0';
                        setTimeout(() => loader.remove(), 500);
                    }
                    state.isFirstLoad = false;
                }
                pollTimer = setTimeout(sync, delay);
            }
        };

        const syncUpdates = async () => {
            if (config.pollingUpdatesState) return;
            config.pollingUpdatesState = true;
            clearTimeout(updateTimer);
            try {
                const updateAfterId = config.lastId > 15 ? config.lastId - 15 : 0;
                const params = new URLSearchParams({
                    session_id: config.sessionId,
                    random_id: config.randomId,
                    after_id: updateAfterId
                });
                if (!config.isDemo) {
                    if (config.defaultMessage) params.append('default_message', config.defaultMessage);
                    if (config.domain) params.append('default_domain', config.domain);
                }
                const fetchReq = await fetch(config.getUrl + '?' + params.toString(), {
                    method: 'GET',
                    credentials: 'include'
                });
                if (fetchReq.ok) {
                    const res = await fetchReq.json();
                    if (res.success !== false && res.data && res.data.history) {
                        const history = res.data.history;
                        for (const time in history) {
                            ['user', 'assistant'].forEach(sender => {
                                if (history[time][sender]) history[time][sender].forEach(msgData => patchBubbleText(sender, msgData));
                            });
                        }
                    }
                }
            } catch (e) {
                // fail silently
            } finally {
                config.pollingUpdatesState = false;
                updateTimer = setTimeout(syncUpdates, state.isThinking ? 1000 : 8000);
            }
        };

        ui.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (ui.input.value.trim().length === 0 && state.selectedFiles.length === 0 && !state.voiceBlob) return;
            if (state.isThinking || ui.btn.disabled) return;

            const msg = ui.input.value.trim();
            const is2FAAttempt = config.isDemo && !config.hasEmail && msg.length === config.codeLength;
            const optData = {};
            if (msg) optData.text = msg;
            if (state.selectedFiles.length > 0) optData.attachment = {
                name: state.selectedFiles[0].name,
                format: state.selectedFiles[0].type || 'File'
            };
            if (state.voiceBlob) optData.attachment = {
                name: i18n.chat_voice_message || 'Voice Message',
                format: i18n.chat_audio || 'Audio'
            };

            appendMsg(optData, 'user', true);

            ui.input.disabled = true;
            ui.btn.disabled = true;
            const originalBtnHtml = ui.btn.innerHTML;
            ui.btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

            const fd = new FormData();
            fd.append('session_id', config.sessionId);
            fd.append('random_id', config.randomId);
            fd.append('language', config.language);
            if (!config.isDemo && config.domain) fd.append('default_domain', config.domain);

            if (state.voiceBlob) {
                fd.append('voice', state.voiceBlob, 'voice_message.ogg');
            } else {
                if (msg) fd.append('message', msg);
                if (state.selectedFiles.length > 0) fd.append('file', state.selectedFiles[0]);
            }

            ui.input.value = '';
            window.clearFile();
            window.clearVoice();
            renderUIState();
            showThinking(true);
            sync();
            syncUpdates();

            try {
                const res = await request(config.addUrl, fd);
                if (!res.success) {
                    showError(res.message);
                    removeThinking();
                    ui.btn.innerHTML = originalBtnHtml;
                } else {
                    ui.btn.innerHTML = originalBtnHtml;
                    if (is2FAAttempt) setTimeout(() => window.location.reload(), 5000);
                }
            } catch (err) {
                showError(i18n.chat_network_failed || 'The network request failed.');
                removeThinking();
                ui.btn.innerHTML = originalBtnHtml;
            }
        });

        updateMicVisibility();
        sync();
        syncUpdates();

        /* ---------------------------------------------------------------
           One-off action toast (delete history / sign in / sign out result)
           --------------------------------------------------------------- */
        if (window.IO_ACTION_TOAST && ui.toastEl && ui.toastMsg) {
            ui.toastEl.className = 'toast align-items-center border-0 text-bg-' + (window.IO_ACTION_TOAST.success ? 'success' : 'danger');
            ui.toastMsg.textContent = window.IO_ACTION_TOAST.message;
            if (window.bootstrap) new bootstrap.Toast(ui.toastEl).show();
            if (window.IO_ACTION_TOAST.success && window.history.replaceState) {
                const url = new URL(window.location);
                url.searchParams.delete('deleted');
                url.searchParams.delete('signed_out');
                url.searchParams.delete('signed_in');
                window.history.replaceState(null, '', url);
            }
        }

        /* ---------------------------------------------------------------
           Hide Paddle checkout inside in-app browsers (Android/iOS
           webviews can't reliably run the Paddle overlay / app-store rules)
           --------------------------------------------------------------- */
        if (config.isDemo) {
            const ua = navigator.userAgent || navigator.vendor || window.opera;
            const isAndroid = ua.toLowerCase().indexOf("android") > -1;
            const isAndroidWebView = ua.toLowerCase().indexOf("; wv)") > -1 || (isAndroid && ua.toLowerCase().indexOf("version/") > -1);
            const isIos = /iPhone|iPad|iPod/i.test(ua);
            const isIosWebView = isIos && !/Safari/i.test(ua);
            if (isAndroidWebView || isIosWebView) {
                const pricingBox = document.getElementById('pricingBoxContainer');
                if (pricingBox) pricingBox.style.display = 'none';
            }
        }
    });
})();