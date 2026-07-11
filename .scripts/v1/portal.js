(function () {
    const scriptTag = document.getElementById('idealistic-script');
    const portalId = scriptTag ? scriptTag.getAttribute('data-portal') : null;
    const defaultMessage = scriptTag ? scriptTag.getAttribute('data-default-message') : null;

    if (!portalId) return;

    const portalUrl = `https://www.idealistic.ai/io/v1/portal/view/?id=${portalId}&embedded=true`
        + (defaultMessage ? `&default_message=${encodeURIComponent(defaultMessage)}` : '');

    const style = document.createElement('style');
    style.innerHTML = `
        #idealistic-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 2147483647;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .io-snap-transition {
            transition: right 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), bottom 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
        #idealistic-widget-container.io-is-dragging {
            opacity: 0.85;
        }
        #idealistic-iframe-wrapper {
            position: relative;
            width: 380px;
            height: 600px;
            min-width: 380px;
            min-height: 600px;
            max-height: calc(100vh - 100px);
            max-width: calc(100vw - 40px);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 18px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.5);
            background: #09090b;
            display: none;
            opacity: 0;
            transform: translateY(20px) scale(0.98);
            transition: opacity 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
            margin-bottom: 15px;
            overflow: hidden;
            will-change: width, height, opacity, transform;
        }
        #idealistic-iframe-wrapper.io-open {
            display: block;
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        #idealistic-iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }
        .io-resizer-tl {
            position: absolute;
            top: 0;
            left: 0;
            width: 24px;
            height: 24px;
            cursor: nwse-resize;
            z-index: 10;
            background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 15%, transparent 15%);
            border-top-left-radius: 18px;
        }
        .io-resizer-top {
            position: absolute;
            top: 0;
            left: 24px;
            right: 0;
            height: 8px;
            cursor: ns-resize;
            z-index: 9;
        }
        .io-resizer-left {
            position: absolute;
            top: 24px;
            left: 0;
            bottom: 0;
            width: 8px;
            cursor: ew-resize;
            z-index: 9;
        }
        #idealistic-toggle {
            height: 54px;
            padding: 0 20px 0 16px;
            border-radius: 30px;
            background-color: rgba(244, 244, 245, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #09090b;
            border: 1px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.18);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease, box-shadow 0.2s ease, width 0.2s ease, border-radius 0.2s ease;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
        }
        #idealistic-toggle:hover {
            transform: scale(1.03);
            background-color: rgba(255, 255, 255, 0.95);
            box-shadow: 0 6px 20px rgba(0,0,0,0.22);
        }
        #idealistic-toggle:active {
            transform: scale(0.97);
        }
        .io-toggle-content {
            display: flex;
            align-items: center;
            gap: 10px;
            pointer-events: none;
        }
        #idealistic-toggle svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
            flex-shrink: 0;
        }
        .io-toggle-text {
            font-size: 16px;
            font-weight: 500;
            color: #52525b;
            letter-spacing: -0.2px;
        }
        #idealistic-toggle.io-btn-close {
            width: 54px;
            padding: 0;
            border-radius: 50%;
        }
        #idealistic-toggle.io-btn-close .io-toggle-text {
            display: none;
        }
        #idealistic-toggle.io-btn-close svg {
            width: 28px;
            height: 28px;
        }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'idealistic-widget-container';

    const wrapper = document.createElement('div');
    wrapper.id = 'idealistic-iframe-wrapper';

    const resizerTL = document.createElement('div');
    resizerTL.className = 'io-resizer-tl';
    const resizerT = document.createElement('div');
    resizerT.className = 'io-resizer-top';
    const resizerL = document.createElement('div');
    resizerL.className = 'io-resizer-left';

    const iframe = document.createElement('iframe');
    iframe.id = 'idealistic-iframe';
    iframe.src = portalUrl;
    iframe.setAttribute('allow', 'microphone');

    wrapper.appendChild(resizerTL);
    wrapper.appendChild(resizerT);
    wrapper.appendChild(resizerL);
    wrapper.appendChild(iframe);

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'idealistic-toggle';

    const iconChat = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>`;
    const iconClose = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

    toggleBtn.innerHTML = `
        <div class="io-toggle-content">
            ${iconChat}
            <span class="io-toggle-text">Aa</span>
        </div>
    `;

    container.appendChild(wrapper);
    container.appendChild(toggleBtn);
    document.body.appendChild(container);

    let isOpen = false;

    // --- STATE-BASED POSITION (The absolute fix) ---
    let currentRight = 20;
    let currentBottom = 20;
    container.style.right = currentRight + 'px';
    container.style.bottom = currentBottom + 'px';

    const snapToBounds = () => {
        container.classList.add('io-snap-transition');
        void container.offsetWidth; // Force CSS reflow

        const cWidth = container.offsetWidth;
        const cHeight = container.offsetHeight;

        const maxRight = Math.max(20, window.innerWidth - cWidth - 20);
        const maxBottom = Math.max(20, window.innerHeight - cHeight - 20);

        if (currentRight < 20) currentRight = 20;
        if (currentRight > maxRight) currentRight = maxRight;

        if (currentBottom < 20) currentBottom = 20;
        if (currentBottom > maxBottom) currentBottom = maxBottom;

        container.style.right = currentRight + 'px';
        container.style.bottom = currentBottom + 'px';

        setTimeout(() => {
            container.classList.remove('io-snap-transition');
        }, 400);
    };

    // --- RESIZING LOGIC ---
    let isResizing = false;
    let resizeDir = '';
    let rStartX, rStartY, rStartW, rStartH;

    const startResize = (e, dir) => {
        if (!isOpen) return;
        isResizing = true;
        resizeDir = dir;
        rStartX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        rStartY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        rStartW = wrapper.offsetWidth;
        rStartH = wrapper.offsetHeight;

        iframe.style.pointerEvents = 'none';
        document.body.style.userSelect = 'none';
        if (e.cancelable) e.preventDefault();
    };

    resizerTL.addEventListener('mousedown', (e) => startResize(e, 'both'));
    resizerT.addEventListener('mousedown', (e) => startResize(e, 'top'));
    resizerL.addEventListener('mousedown', (e) => startResize(e, 'left'));

    resizerTL.addEventListener('touchstart', (e) => startResize(e, 'both'), {passive: false});
    resizerT.addEventListener('touchstart', (e) => startResize(e, 'top'), {passive: false});
    resizerL.addEventListener('touchstart', (e) => startResize(e, 'left'), {passive: false});

    const handleResizeMove = (e) => {
        if (!isResizing) return;

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        const maxW = window.innerWidth - 40;
        const maxH = window.innerHeight - 100;

        if (resizeDir === 'both' || resizeDir === 'left') {
            let newW = rStartW + (rStartX - clientX);
            newW = Math.max(380, Math.min(newW, maxW));
            wrapper.style.width = newW + 'px';
        }
        if (resizeDir === 'both' || resizeDir === 'top') {
            let newH = rStartH + (rStartY - clientY);
            newH = Math.max(600, Math.min(newH, maxH));
            wrapper.style.height = newH + 'px';
        }
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('touchmove', handleResizeMove, {passive: false});

    const stopResize = () => {
        if (isResizing) {
            isResizing = false;
            iframe.style.pointerEvents = 'auto';
            document.body.style.userSelect = '';
            snapToBounds();
        }
    };

    window.addEventListener('mouseup', stopResize);
    window.addEventListener('touchend', stopResize);

    // --- INSTANT DISTANCE-BASED DRAG LOGIC ---
    let isMouseDown = false;
    let isDragging = false;
    let wasDragging = false;
    let dragStartX, dragStartY;
    let startRight, startBottom;

    const startDrag = (e) => {
        if (e.target.closest('[class^="io-resizer"]')) return;

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        isMouseDown = true;
        isDragging = false;
        wasDragging = false;
        dragStartX = clientX;
        dragStartY = clientY;

        // Αποθηκεύουμε την τρέχουσα state θέση, ΟΧΙ την DOM θέση
        startRight = currentRight;
        startBottom = currentBottom;
    };

    const doDrag = (e) => {
        if (!isMouseDown) return;

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        const dx = clientX - dragStartX;
        const dy = clientY - dragStartY;

        // Το threshold των 5 pixels αποκλείει τα "τρεμάμενα" κλικ.
        if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            isDragging = true;
            wasDragging = true;

            container.classList.add('io-is-dragging');
            container.style.left = 'auto';
            container.style.top = 'auto';
            container.classList.remove('io-snap-transition');
            iframe.style.pointerEvents = 'none';
        }

        if (isDragging) {
            if (e.cancelable) e.preventDefault();
            currentRight = startRight - dx;
            currentBottom = startBottom - dy;
            container.style.right = currentRight + 'px';
            container.style.bottom = currentBottom + 'px';
        }
    };

    const endDrag = () => {
        isMouseDown = false;
        if (isDragging) {
            isDragging = false;
            container.classList.remove('io-is-dragging');
            iframe.style.pointerEvents = 'auto';
            snapToBounds();
        }
    };

    toggleBtn.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', endDrag);

    toggleBtn.addEventListener('touchstart', startDrag, {passive: false});
    window.addEventListener('touchmove', doDrag, {passive: false});
    window.addEventListener('touchend', endDrag);

    // Auto-snap αν ο χρήστης αλλάξει μέγεθος στο παράθυρο (π.χ. γυρίσει το κινητό)
    window.addEventListener('resize', snapToBounds);

    toggleBtn.addEventListener('click', (e) => {
        // Αν έγινε έστω και το παραμικρό drag, το κλικ ακυρώνεται σωστά
        if (wasDragging) {
            wasDragging = false;
            return;
        }

        isOpen = !isOpen;
        if (isOpen) {
            wrapper.style.display = 'block';
            container.classList.remove('io-snap-transition');

            requestAnimationFrame(() => {
                snapToBounds();
                wrapper.classList.add('io-open');
                toggleBtn.classList.add('io-btn-close');
                toggleBtn.innerHTML = iconClose;
            });
        } else {
            wrapper.classList.remove('io-open');
            toggleBtn.classList.remove('io-btn-close');
            toggleBtn.innerHTML = `
                <div class="io-toggle-content">
                    ${iconChat}
                    <span class="io-toggle-text">Aa</span>
                </div>
            `;

            setTimeout(() => {
                if (!isOpen) {
                    wrapper.style.display = 'none';
                    snapToBounds();
                }
            }, 350);
        }
    });
})();