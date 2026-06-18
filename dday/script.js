// Turn a string of YYYYMMDD into Date object based on midnight time in local.
function parseDate(str) {
    if (!str || !/^\d{8}$/.test(str)) return null;

    const y = +str.slice(0, 4), m = +str.slice(4, 6) - 1, d = +str.slice(6, 8);
    const dt = new Date(y, m, d);

    if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;

    return dt;
}

// ── Calculate content/date → {label, dateText} ──
function computeDday(content, dateStr) {
    const target = parseDate(dateStr);
    if (!target) return { label: 'Invalid date', dateText: 'Format: YYYYMMDD' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / 86400000);

    let label;
    if (diff > 0) label = 'D-' + diff;
    else if (diff === 0) label = 'D-DAY';
    else label = 'D+' + Math.abs(diff);

    const dateText = target.getFullYear() + '. ' + (target.getMonth() + 1) + '. ' + target.getDate() + '.';

    return { label, dateText };
}

// Allowed sizes; anything else falls back to 'small'.
const SIZES = ['small', 'medium', 'large'];
function normalizeSize(s) {
    return SIZES.includes(s) ? s : 'small';
}

const params = new URLSearchParams(location.search);
const dateParam = params.get('date');

if (dateParam) {
    // ── Widget mode ──
    const widget = document.getElementById('widget');
    widget.style.display = 'block';

    const content = params.get('content') || 'D-Day';
    const size = normalizeSize(params.get('size'));
    widget.classList.add('size-' + size);

    const { label, dateText } = computeDday(content, dateParam);

    document.getElementById('w-content').textContent = content;
    document.getElementById('w-dday').textContent = label;
    document.getElementById('w-date').textContent = dateText;
} else {
    // ── Generator mode ──
    document.getElementById('generator').style.display = 'block';

    const inContent = document.getElementById('in-content');
    const inDate = document.getElementById('in-date');
    const outUrl = document.getElementById('out-url');
    const preview = document.getElementById('preview');
    const sizeSelect = document.getElementById('size-select');

    let selectedSize = 'small';

    // Default: today
    const t = new Date();

    inDate.value = t.getFullYear() + '-' +
        String(t.getMonth() + 1).padStart(2, '0') + '-' +
        String(t.getDate()).padStart(2, '0');

    function refresh() {
        const content = inContent.value || 'D-Day';
        // Right below line make 2026-07-05 to 20260705
        const dateStr = inDate.value.replaceAll('-', '');

        // Preview (apply size to the preview box too)
        const { label, dateText } = computeDday(content, dateStr);
        document.getElementById('p-content').textContent = content;
        document.getElementById('p-dday').textContent = label;
        document.getElementById('p-date').textContent = dateText;
        preview.classList.remove('size-small', 'size-medium', 'size-large');
        preview.classList.add('size-' + selectedSize);

        // Generate link (based on current page)
        const base = location.origin + location.pathname;
        outUrl.value = base + '?content=' + encodeURIComponent(content) +
            '&date=' + dateStr + '&size=' + selectedSize;
    }

    inContent.addEventListener('input', refresh);
    inDate.addEventListener('input', refresh);

    // Size buttons
    sizeSelect.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-size]');
        if (!btn) return;
        selectedSize = btn.dataset.size;
        sizeSelect.querySelectorAll('button').forEach(b =>
            b.classList.toggle('active', b === btn));
        refresh();
    });

    refresh();

    // Copy button
    // Try-catch fallback for clipboard API blocked.
    const copyBtn = document.getElementById('copy-btn');
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(outUrl.value);
        } catch (e) {
            outUrl.select();
            document.execCommand('copy');
        }
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });
}
