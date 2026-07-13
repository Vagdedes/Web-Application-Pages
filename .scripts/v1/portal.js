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
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .io-snap-transition {
            transition: left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), right 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), bottom 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
        #idealistic-widget-container.io-is-dragging {
            opacity: 0.85;
        }
        #idealistic-iframe-wrapper {
            position: absolute;
            bottom: calc(100% + 15px);
            left: 0;
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
            transition: opacity 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            overflow: hidden;
            will-change: width, height, opacity, transform;
        }

        /* Closed states */
        .io-anchor-right #idealistic-iframe-wrapper {
            transform-origin: bottom right;
            transform: translateY(20px) scale(0.98) translateX(calc(var(--cw, 54px) - 100%));
        }
        .io-anchor-left #idealistic-iframe-wrapper {
            transform-origin: bottom left;
            transform: translateY(20px) scale(0.98) translateX(0);
        }

        /* Open states */
        .io-anchor-right #idealistic-iframe-wrapper.io-open {
            opacity: 1;
            transform: translateY(0) scale(1) translateX(calc(var(--cw, 54px) - 100%));
        }
        .io-anchor-left #idealistic-iframe-wrapper.io-open {
            opacity: 1;
            transform: translateY(0) scale(1) translateX(0);
        }

        #idealistic-iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }

        /* Resizers */
        .io-resizer-tl, .io-resizer-tr {
            position: absolute;
            top: 0;
            width: 24px;
            height: 24px;
            z-index: 10;
        }
        .io-resizer-tl {
            left: 0;
            cursor: nwse-resize;
            border-top-left-radius: 18px;
            background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 15%, transparent 15%);
        }
        .io-resizer-tr {
            right: 0;
            cursor: nesw-resize;
            border-top-right-radius: 18px;
            background: linear-gradient(-135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 15%, transparent 15%);
        }
        .io-resizer-t {
            position: absolute;
            top: 0;
            left: 24px;
            right: 24px;
            height: 8px;
            cursor: ns-resize;
            z-index: 9;
        }
        .io-resizer-l, .io-resizer-r {
            position: absolute;
            top: 24px;
            bottom: 0;
            width: 8px;
            cursor: ew-resize;
            z-index: 9;
        }
        .io-resizer-l { left: 0; }
        .io-resizer-r { right: 0; }

        /* Conditional Resizer Display based on Anchor */
        .io-anchor-right .io-resizer-tr, .io-anchor-right .io-resizer-r { display: none !important; }
        .io-anchor-left .io-resizer-tl, .io-anchor-left .io-resizer-l { display: none !important; }

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

    // Build Resizers
    const resizerTL = document.createElement('div');
    resizerTL.className = 'io-resizer-tl';
    const resizerTR = document.createElement('div');
    resizerTR.className = 'io-resizer-tr';
    const resizerT = document.createElement('div');
    resizerT.className = 'io-resizer-t';
    const resizerL = document.createElement('div');
    resizerL.className = 'io-resizer-l';
    const resizerR = document.createElement('div');
    resizerR.className = 'io-resizer-r';

    const iframe = document.createElement('iframe');
    iframe.id = 'idealistic-iframe';
    iframe.src = portalUrl;
    iframe.setAttribute('allow', 'microphone');

    wrapper.appendChild(resizerTL);
    wrapper.appendChild(resizerTR);
    wrapper.appendChild(resizerT);
    wrapper.appendChild(resizerL);
    wrapper.appendChild(resizerR);
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
    let anchorSide = 'right';

    // Set initial position
    container.classList.add('io-anchor-right');
    container.style.right = '20px';
    container.style.bottom = '20px';

    // Observe container to update CSS variable for smooth transforming
    if (window.ResizeObserver) {
        new ResizeObserver(entries => {
            for (let entry of entries) {
                container.style.setProperty('--cw', entry.contentRect.width + 'px');
            }
        }).observe(container);
    } else {
        container.style.setProperty('--cw', '54px');
    }

    // Dynamic width & height calculation based on open/closed state
    const getEffectiveDimensions = () => {
        const btnW = toggleBtn.offsetWidth || 54;
        const btnH = toggleBtn.offsetHeight || 54;
        if (!isOpen) return {w: btnW, h: btnH};

        const wrapW = wrapper.offsetWidth || 380;
        const wrapH = wrapper.offsetHeight || 600;
        return {
            w: Math.max(btnW, wrapW),
            h: wrapH + 15 + btnH
        };
    };

    const snapToBounds = () => {
        container.classList.add('io-snap-transition');
        void container.offsetWidth; // Force CSS reflow

        const rect = container.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        let idealAnchor = center > window.innerWidth / 2 ? 'right' : 'left';

        // Predict overflow to force anchor flip if there's no space on standard side
        const wrapperW = isOpen ? wrapper.offsetWidth : 380;
        if (idealAnchor === 'right' && rect.right - wrapperW < 10) idealAnchor = 'left';
        else if (idealAnchor === 'left' && rect.left + wrapperW > window.innerWidth - 10) idealAnchor = 'right';

        let currentPos = {x: 0, y: window.innerHeight - rect.bottom};

        if (idealAnchor !== anchorSide) {
            if (idealAnchor === 'left') {
                currentPos.x = rect.left;
                container.style.left = currentPos.x + 'px';
                container.style.right = 'auto';
                container.classList.replace('io-anchor-right', 'io-anchor-left');
            } else {
                currentPos.x = window.innerWidth - rect.right;
                container.style.right = currentPos.x + 'px';
                container.style.left = 'auto';
                container.classList.replace('io-anchor-left', 'io-anchor-right');
            }
            anchorSide = idealAnchor;
        } else {
            currentPos.x = anchorSide === 'right' ? window.innerWidth - rect.right : rect.left;
        }

        // --- RIGID BOUNDS ENFORCEMENT ---
        const dims = getEffectiveDimensions();
        const maxBottom = Math.max(20, window.innerHeight - dims.h - 20);
        const maxSpace = Math.max(20, window.innerWidth - dims.w - 20);

        if (currentPos.y < 20) currentPos.y = 20;
        if (currentPos.y > maxBottom) currentPos.y = maxBottom;

        if (currentPos.x < 20) currentPos.x = 20;
        if (currentPos.x > maxSpace) currentPos.x = maxSpace;

        if (anchorSide === 'right') container.style.right = currentPos.x + 'px';
        else container.style.left = currentPos.x + 'px';
        container.style.bottom = currentPos.y + 'px';

        setTimeout(() => {
            container.classList.remove('io-snap-transition');
        }, 400);
    };

    // --- RESIZING LOGIC (WITH BOUNDARIES) ---
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

    resizerTL.addEventListener('mousedown', (e) => startResize(e, 'both-left'));
    resizerTR.addEventListener('mousedown', (e) => startResize(e, 'both-right'));
    resizerT.addEventListener('mousedown', (e) => startResize(e, 'top'));
    resizerL.addEventListener('mousedown', (e) => startResize(e, 'left'));
    resizerR.addEventListener('mousedown', (e) => startResize(e, 'right'));

    resizerTL.addEventListener('touchstart', (e) => startResize(e, 'both-left'), {passive: false});
    resizerTR.addEventListener('touchstart', (e) => startResize(e, 'both-right'), {passive: false});
    resizerT.addEventListener('touchstart', (e) => startResize(e, 'top'), {passive: false});
    resizerL.addEventListener('touchstart', (e) => startResize(e, 'left'), {passive: false});
    resizerR.addEventListener('touchstart', (e) => startResize(e, 'right'), {passive: false});

    const handleResizeMove = (e) => {
        if (!isResizing) return;

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        const cSide = anchorSide === 'right' ? (parseInt(container.style.right) || 20) : (parseInt(container.style.left) || 20);
        const dynamicMaxW = window.innerWidth - cSide - 20;
        const dynamicMaxH = window.innerHeight - (parseInt(container.style.bottom) || 20) - (toggleBtn.offsetHeight || 54) - 15 - 20;

        if (resizeDir.includes('left')) {
            let newW = rStartW + (rStartX - clientX);
            wrapper.style.width = Math.max(380, Math.min(newW, dynamicMaxW)) + 'px';
        }
        if (resizeDir.includes('right')) {
            let newW = rStartW + (clientX - rStartX);
            wrapper.style.width = Math.max(380, Math.min(newW, dynamicMaxW)) + 'px';
        }
        if (resizeDir.includes('top')) {
            let newH = rStartH + (rStartY - clientY);
            wrapper.style.height = Math.max(600, Math.min(newH, dynamicMaxH)) + 'px';
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

    // --- FRAME-BY-FRAME DRAG LOGIC (No Sticky Walls, Absolute Boundaries) ---
    let isMouseDown = false;
    let isDragging = false;
    let wasDragging = false;
    let dragStartX, dragStartY;

    const startDrag = (e) => {
        if (e.target.closest('[class^="io-resizer"]')) return;

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        isMouseDown = true;
        isDragging = false;
        wasDragging = false;
        dragStartX = clientX;
        dragStartY = clientY;
    };

    const doDrag = (e) => {
        if (!isMouseDown) return;

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        if (!isDragging) {
            const dx = clientX - dragStartX;
            const dy = clientY - dragStartY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDragging = true;
                wasDragging = true;

                container.classList.add('io-is-dragging');
                container.classList.remove('io-snap-transition');
                iframe.style.pointerEvents = 'none';

                // Reset anchor to prevent initial 5px jump
                dragStartX = clientX;
                dragStartY = clientY;
            }
            return;
        }

        if (e.cancelable) e.preventDefault();

        // Calculate Frame Deltas
        const stepX = clientX - dragStartX;
        const stepY = clientY - dragStartY;

        let currentX = anchorSide === 'right' ? (parseInt(container.style.right) || 20) : (parseInt(container.style.left) || 20);
        let currentY = parseInt(container.style.bottom) || 20;

        let newX = anchorSide === 'right' ? currentX - stepX : currentX + stepX;
        let newY = currentY - stepY;

        // Apply physical wall limits directly on coordinate generation
        const dims = getEffectiveDimensions();
        const maxBottom = Math.max(20, window.innerHeight - dims.h - 20);
        const maxSpace = Math.max(20, window.innerWidth - dims.w - 20);

        let clampedX = Math.max(20, Math.min(newX, maxSpace));
        let clampedY = Math.max(20, Math.min(newY, maxBottom));

        if (anchorSide === 'right') container.style.right = clampedX + 'px';
        else container.style.left = clampedX + 'px';
        container.style.bottom = clampedY + 'px';

        // Update frame position logic
        dragStartX = clientX;
        dragStartY = clientY;

        // Smooth Anchor Flipper mid-drag
        const rect = container.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        let idealAnchor = center > window.innerWidth / 2 ? 'right' : 'left';

        const wrapperW = isOpen ? wrapper.offsetWidth : 380;
        if (idealAnchor === 'right' && rect.right - wrapperW < 10) idealAnchor = 'left';
        else if (idealAnchor === 'left' && rect.left + wrapperW > window.innerWidth - 10) idealAnchor = 'right';

        if (idealAnchor !== anchorSide) {
            if (idealAnchor === 'left') {
                container.style.left = rect.left + 'px';
                container.style.right = 'auto';
                container.classList.replace('io-anchor-right', 'io-anchor-left');
            } else {
                container.style.right = (window.innerWidth - rect.right) + 'px';
                container.style.left = 'auto';
                container.classList.replace('io-anchor-left', 'io-anchor-right');
            }
            anchorSide = idealAnchor;
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

    window.addEventListener('resize', snapToBounds);

    toggleBtn.addEventListener('click', (e) => {
        if (wasDragging) {
            wasDragging = false;
            return;
        }

        isOpen = !isOpen;
        if (isOpen) {
            wrapper.style.display = 'block';
            container.classList.remove('io-snap-transition');

            requestAnimationFrame(() => {
                snapToBounds(); // Trigger space calculations right before rendering visual open
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