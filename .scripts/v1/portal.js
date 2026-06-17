(function () {
    const scriptTag = document.getElementById('idealistic-script');
    const portalId = scriptTag.getAttribute('data-portal');

    if (!portalId) {
        console.error('Idealistic: No portal ID provided.');
        return;
    }

    const portalUrl = `https://www.idealistic.ai/io/v1/portal/view/?id=${portalId}&embedded=true`;

    const style = document.createElement('style');
    style.innerHTML = `
        #idealistic-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 2147483647; /* Max z-index to stay on top of everything */
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            font-family: sans-serif;
        }
        #idealistic-iframe {
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 100px);
            max-width: calc(100vw - 40px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            background: #09090b;
            display: none;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            margin-bottom: 15px;
            overflow: hidden;
        }
        #idealistic-iframe.io-open {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }
        #idealistic-toggle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #f4f4f5; /* Light button to contrast the dark theme */
            color: #09090b;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease;
        }
        #idealistic-toggle:hover {
            transform: scale(1.05);
        }
        #idealistic-toggle svg {
            width: 28px;
            height: 28px;
            fill: currentColor;
            transition: transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'idealistic-widget-container';

    const iframe = document.createElement('iframe');
    iframe.id = 'idealistic-iframe';
    iframe.src = portalUrl;
    iframe.setAttribute('allow', 'microphone'); // Allow voice notes in the iframe

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'idealistic-toggle';

    const iconChat = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>`;
    const iconClose = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

    toggleBtn.innerHTML = iconChat;

    container.appendChild(iframe);
    container.appendChild(toggleBtn);
    document.body.appendChild(container);

    let isOpen = false;
    toggleBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            iframe.style.display = 'block';

            requestAnimationFrame(() => {
                iframe.classList.add('io-open');
            });
            toggleBtn.innerHTML = iconClose;
        } else {
            iframe.classList.remove('io-open');
            setTimeout(() => {
                if (!isOpen) iframe.style.display = 'none';
            }, 300);
            toggleBtn.innerHTML = iconChat;
        }
    });