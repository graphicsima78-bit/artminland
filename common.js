// توابع مشترک بین index.html و admin.html
(function () {
  const AL = {};

  AL.$ = id => document.getElementById(id);

  AL.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // اعداد فارسی/عربی → انگلیسی و حذف کاراکترهای اضافی از شماره
  AL.normDigits = s => String(s || '')
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[^\d+]/g, '');

  AL.vEsc = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

  AL.detectDir = text => /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test((text || '').trim().charAt(0)) ? 'rtl' : 'ltr';

  AL.safeName = s => String(s || 'file').replace(/[^\w\u0600-\u06FF-]+/g, '_').slice(0, 40);

  // ---------- شبکه‌های اجتماعی ----------
  AL.normInstagram = s => {
    let v = String(s || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^instagram\.com\//i, '');
    v = v.split(/[/?#]/)[0].replace(/^@+/, '');
    return /^[A-Za-z0-9._]{1,30}$/.test(v) ? v : '';
  };
  AL.normTelegram = s => {
    let v = String(s || '').trim().replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i, '').replace(/^(t\.me|telegram\.me)\//i, '');
    v = v.split(/[/?#]/)[0].replace(/^@+/, '');
    return /^[A-Za-z0-9_]{4,32}$/.test(v) ? v : '';
  };
  // شماره واتساپ → قالب بین‌المللی بدون + (۰۹۱۵۱۲۳۴۵۶۷ → 989151234567). فرض: شماره بدون پیش‌شماره، ایرانی است.
  AL.normWhatsapp = s => {
    let v = AL.normDigits(s);
    const plus = v.startsWith('+');
    v = v.replace(/\+/g, '');
    if (v.startsWith('00')) v = v.slice(2);
    else if (!plus && v.startsWith('0')) v = '98' + v.slice(1);
    else if (!plus && v.length === 10 && v.startsWith('9')) v = '98' + v;
    return /^\d{8,15}$/.test(v) ? v : '';
  };
  AL.socialLinks = d => {
    const out = [];
    if (d && d.instagram) out.push({ key: 'instagram', label: 'Instagram', value: '@' + d.instagram, url: 'https://instagram.com/' + encodeURIComponent(d.instagram) });
    if (d && d.whatsapp) out.push({ key: 'whatsapp', label: 'WhatsApp', value: '+' + d.whatsapp, url: 'https://wa.me/' + encodeURIComponent(d.whatsapp) });
    if (d && d.telegram) out.push({ key: 'telegram', label: 'Telegram', value: '@' + d.telegram, url: 'https://t.me/' + encodeURIComponent(d.telegram) });
    return out;
  };

  AL.hasCoords = d => d && typeof d.lat === 'number' && typeof d.lng === 'number';

  AL.googleLink = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  // ---------- vCard ----------
  AL.buildVCard = function (d) {
    const phones = Array.isArray(d.phones) ? d.phones : (d.phone ? [d.phone] : []);
    let v = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
    v += 'N:' + AL.vEsc(d.name) + ';;;;\r\n';
    v += 'FN:' + AL.vEsc(d.name) + '\r\n';
    if (d.type === 'business') v += 'ORG:' + AL.vEsc(d.name) + '\r\n';
    if (d.title) v += 'TITLE:' + AL.vEsc(d.title) + '\r\n';
    if (d.description) v += 'NOTE:' + AL.vEsc(d.description) + '\r\n';
    phones.forEach((p, i) => { v += 'TEL;TYPE=' + (i === 0 ? 'CELL' : 'WORK') + ':' + p + '\r\n'; });
    if (d.address) v += 'ADR;TYPE=WORK:;;' + AL.vEsc(d.address) + ';;;;\r\n';
    if (AL.hasCoords(d)) {
      v += 'GEO:' + d.lat + ';' + d.lng + '\r\n';
      v += 'URL:' + AL.googleLink(d.lat, d.lng) + '\r\n';
    }
    AL.socialLinks(d).forEach(s => { v += 'URL;TYPE=' + s.label + ':' + s.url + '\r\n'; });
    if (d.category) v += 'CATEGORIES:' + AL.vEsc(d.category) + '\r\n';
    v += 'END:VCARD';
    return v;
  };

  AL.CREATOR_VCARD = [
    'BEGIN:VCARD', 'VERSION:3.0',
    'N:Artemin Land;;;;', 'FN:Artemin Land', 'ORG:Artemin Land',
    'TITLE:' + AL.vEsc('ساخت کیو آر کد | تولید محتوا | طراحی گرافیک | دکوراسیون داخلی'),
    'TEL;TYPE=CELL:09153136173', 'TEL;TYPE=WORK:09150086173',
    'ADR;TYPE=WORK:;;;' + AL.vEsc('مشهد') + ';;;' + AL.vEsc('ایران'),
    'NOTE:' + AL.vEsc('ساخت کیو آر کد برای شما در هر صنفی | تولید محتوا (اینستاگرام، یوتیوب و همه شبکه‌های اجتماعی) | طراحی گرافیک | دکوراسیون داخلی'),
    'END:VCARD'
  ].join('\r\n');

  // چند کارت در یک فایل .vcf (برای وارد کردن یکجا به مخاطبین)
  AL.vcardsFile = list => list.map(AL.buildVCard).join('\r\n') + '\r\n';

  // ---------- QR داخل مرورگر (بدون ارسال اطلاعات به سایت دیگر) ----------
  AL.qrCanvas = function (text, size) {
    if (typeof qrcode === 'undefined') return null;
    // کتابخانه پیش‌فرض UTF-8 را درست نمی‌فهمد؛ فارسی با این خط درست می‌شود
    qrcode.stringToBytes = s => Array.from(new TextEncoder().encode(s));
    let qr = null;
    for (const level of ['M', 'L']) {
      try {
        const q = qrcode(0, level);
        q.addData(text, 'Byte');
        q.make();
        qr = q;
        break;
      } catch (e) { qr = null; }
    }
    if (!qr) return null;
    const n = qr.getModuleCount();
    const margin = 4;
    const scale = Math.max(2, Math.floor((size || 512) / (n + margin * 2)));
    const dim = (n + margin * 2) * scale;
    const cv = document.createElement('canvas');
    cv.width = cv.height = dim;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = '#000';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
      }
    }
    return cv;
  };

  // اگر کتابخانه لود نشد، به سرویس آنلاین برمی‌گردد
  AL.qrDataUrl = function (text, size) {
    const cv = AL.qrCanvas(text, size);
    if (cv) return cv.toDataURL('image/png');
    return 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&charset-source=UTF-8&data=' + encodeURIComponent(text);
  };

  // ---------- دانلود ----------
  AL.downloadBlob = function (blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  AL.downloadText = (filename, text, mime) =>
    AL.downloadBlob(new Blob([text], { type: mime || 'text/plain;charset=utf-8' }), filename);

  AL.downloadDataUrl = function (dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ---------- CSV (اکسل) ----------
  const csvCell = v => {
    let s = String(v ?? '');
    if (/^[=+@\t\r]/.test(s) || /^-./.test(s)) s = "'" + s; // جلوگیری از فرمول مخرب
    return '"' + s.replace(/"/g, '""') + '"';
  };

  AL.toCsv = function (list) {
    let csv = '\uFEFFردیف,نام,شماره تماس,نوع,سرفصل (دسته‌بندی),عنوان شغلی,توضیحات,آدرس,اینستاگرام,واتساپ,تلگرام,عرض جغرافیایی,طول جغرافیایی,تاریخ\n';
    list.forEach((d, i) => {
      const plist = (Array.isArray(d.phones) ? d.phones : (d.phone ? [d.phone] : [])).map(p => String(p).replace(/"/g, ''));
      const phones = plist.length ? '="' + plist.join(' - ') + '"' : '';
      const type = d.type === 'business' ? 'کسب‌وکار' : (d.type === 'personal' ? 'شخصی' : '-');
      const when = d.createdAt || d.savedAt;
      const date = when ? new Date(when).toLocaleDateString('fa-IR') : '-';
      csv += [i + 1, csvCell(d.name), '"' + phones.replace(/"/g, '""') + '"', csvCell(type), csvCell(d.category),
        csvCell(d.title), csvCell(d.description), csvCell(d.address), csvCell(d.instagram), (d.whatsapp ? '"=""' + d.whatsapp + '"""' : '""'), csvCell(d.telegram), csvCell(d.lat), csvCell(d.lng), csvCell(date)].join(',') + '\n';
    });
    return csv;
  };

  window.AL = AL;
})();
