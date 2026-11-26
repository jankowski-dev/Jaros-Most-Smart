// Байт — робо-паук. Инлайн-SVG, чтобы работать офлайн и масштабироваться.

const STATES = new Set(['idle', 'happy', 'sad', 'think', 'sleep', 'party']);

function eyes(state) {
    if (state === 'happy' || state === 'party') {
        return `
            <path d="M72 103 Q82 91 92 103" fill="none" stroke="var(--mascot-eye)" stroke-width="5" stroke-linecap="round"/>
            <path d="M108 103 Q118 91 128 103" fill="none" stroke="var(--mascot-eye)" stroke-width="5" stroke-linecap="round"/>
            <circle cx="82" cy="103" r="2.2" fill="var(--mascot-accent)"/>
            <circle cx="118" cy="103" r="2.2" fill="var(--mascot-accent)"/>`;
    }

    if (state === 'sleep') {
        return `
            <path d="M70 102h24" stroke="var(--mascot-eye)" stroke-width="4" stroke-linecap="round"/>
            <path d="M106 102h24" stroke="var(--mascot-eye)" stroke-width="4" stroke-linecap="round"/>`;
    }

    if (state === 'sad') {
        return `
            <circle cx="82" cy="102" r="9" fill="var(--mascot-eye)"/>
            <circle cx="118" cy="102" r="9" fill="var(--mascot-eye)"/>
            <circle cx="82" cy="106" r="4" fill="var(--mascot-face)"/>
            <circle cx="118" cy="106" r="4" fill="var(--mascot-face)"/>`;
    }

    if (state === 'think') {
        return `
            <circle cx="82" cy="102" r="8.5" fill="var(--mascot-eye)"/>
            <circle cx="82" cy="104" r="4" fill="var(--mascot-face)"/>
            <path d="M108 104 Q118 94 128 104" fill="none" stroke="var(--mascot-eye)" stroke-width="4" stroke-linecap="round"/>`;
    }

    return `
        <circle cx="82" cy="102" r="9.5" fill="var(--mascot-eye)"/>
        <circle cx="118" cy="102" r="9.5" fill="var(--mascot-eye)"/>
        <circle cx="84" cy="104" r="4.4" fill="var(--mascot-face)"/>
        <circle cx="120" cy="104" r="4.4" fill="var(--mascot-face)"/>
        <circle cx="80" cy="99" r="1.6" fill="#fff" opacity="0.9"/>
        <circle cx="116" cy="99" r="1.6" fill="#fff" opacity="0.9"/>`;
}

function mouth(state) {
    if (state === 'happy' || state === 'party') {
        return '<path d="M86 119 Q100 135 114 119 Q100 126 86 119Z" fill="var(--mascot-eye)"/>';
    }
    if (state === 'sad') {
        return '<path d="M88 127 Q100 118 112 127" fill="none" stroke="var(--mascot-eye)" stroke-width="3" stroke-linecap="round"/>';
    }
    if (state === 'think') {
        return '<path d="M91 124h18" stroke="var(--mascot-eye)" stroke-width="3" stroke-linecap="round"/>';
    }
    if (state === 'sleep') {
        return '<path d="M93 124h14" stroke="var(--mascot-eye)" stroke-width="3" stroke-linecap="round"/>';
    }
    return '<path d="M90 120 Q100 128 110 120" fill="none" stroke="var(--mascot-eye)" stroke-width="3" stroke-linecap="round"/>';
}

export function mascot(state = 'idle', { className = '', size = 160, label = '' } = {}) {
    const safeState = STATES.has(state) ? state : 'idle';
    const a11y = label
        ? `role="img" aria-label="${label}"`
        : 'aria-hidden="true" focusable="false"';

    return `<svg class="mascot mascot--${safeState} ${className}" data-state="${safeState}" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" ${a11y}>
        <g stroke="var(--mascot-accent)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9">
            <path class="mascot-leg" d="M58 96 32 80 20 96"/>
            <path class="mascot-leg" d="M52 111 24 112 12 128"/>
            <path class="mascot-leg" d="M56 126 32 145 24 162"/>
            <path class="mascot-leg" d="M68 138 52 162 54 180"/>
            <path class="mascot-leg" d="M142 96 168 80 180 96"/>
            <path class="mascot-leg" d="M148 111 176 112 188 128"/>
            <path class="mascot-leg" d="M144 126 168 145 176 162"/>
            <path class="mascot-leg" d="M132 138 148 162 146 180"/>
        </g>
        <line x1="100" y1="62" x2="100" y2="40" stroke="var(--mascot-accent)" stroke-width="4" stroke-linecap="round"/>
        <circle cx="100" cy="34" r="7" fill="var(--mascot-accent)" class="animate-pulse-soft"/>
        <g class="mascot-body">
            <ellipse cx="100" cy="106" rx="55" ry="48" fill="var(--mascot-body)"/>
            <ellipse cx="100" cy="112" rx="43" ry="35" fill="var(--mascot-body-dark)" opacity="0.35"/>
            <rect x="61" y="73" width="78" height="62" rx="25" fill="var(--mascot-face)"/>
            <g class="mascot-eye">${eyes(safeState)}</g>
            ${mouth(safeState)}
            <circle cx="58" cy="118" r="5" fill="var(--mascot-accent)" opacity="0.55"/>
            <circle cx="142" cy="118" r="5" fill="var(--mascot-accent)" opacity="0.55"/>
        </g>
    </svg>`;
}
