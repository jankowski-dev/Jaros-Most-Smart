// Нативный <dialog> с фокус-ловушкой браузера и возвратом фокуса.

export function confirmDialog({
    title,
    message,
    confirmText = 'Ок',
    cancelText = 'Отмена',
    danger = false
} = {}) {
    return new Promise((resolve) => {
        const previousFocus = document.activeElement;
        const root = document.getElementById('overlay-root') || document.body;

        const dialog = document.createElement('dialog');
        dialog.className = 'dialog';
        dialog.setAttribute('aria-modal', 'true');

        const card = document.createElement('div');
        card.className = 'dialog-card';

        const heading = document.createElement('h2');
        heading.className = 'dialog-title';
        heading.id = `dialog-title-${Date.now()}`;
        heading.textContent = title || 'Подтверждение';
        dialog.setAttribute('aria-labelledby', heading.id);

        const text = document.createElement('p');
        text.className = 'dialog-message';
        text.textContent = message || '';

        const actions = document.createElement('div');
        actions.className = 'dialog-actions';

        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'btn btn-ghost';
        cancel.textContent = cancelText;

        const confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
        confirm.textContent = confirmText;

        actions.append(cancel, confirm);
        card.append(heading, text, actions);
        dialog.append(card);
        root.append(dialog);

        let settled = false;

        const finish = (value) => {
            if (settled) return;
            settled = true;
            resolve(value);
            if (dialog.open) dialog.close();
            setTimeout(() => {
                dialog.remove();
                if (previousFocus && typeof previousFocus.focus === 'function') {
                    previousFocus.focus();
                }
            }, 0);
        };

        cancel.addEventListener('click', () => finish(false));
        confirm.addEventListener('click', () => finish(true));
        dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            finish(false);
        });
        dialog.addEventListener('close', () => finish(false));

        dialog.showModal();
        (danger ? cancel : confirm).focus();
    });
}
