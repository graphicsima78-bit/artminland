// توابع مشترک بین index.html و admin.html - نسخه ارتقا یافته آرتمین لند
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

  // ---------- نرمال‌سازی شبکه‌های اجتماعی و پیام‌رسان‌ها ----------
  AL.normInstagram = s => {
    let v = String(s || '').trim().replace(/^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\//i, '');
    v = v.split(/[/?#]/)[0].replace(/^@+/, '');
    return /^[A-Za-z0-9._]{1,30}$/.test(v) ? v : '';
  };

  AL.normTelegram = s => {
    let v = String(s || '').trim().replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i, '').replace(/^(t\.me|telegram\.me)\//i, '');
    v = v.split(/[/?#]/)[0].replace(/^@+/, '');
    return /^[A-Za-z0-9_]{4,32}$/.test(v) ? v : '';
  };

  AL.normEitaa = s => {
    let v = String(s || '').trim().replace(/^https?:\/\/(www\.)?eitaa\.(com|org|ir)\//i, '').replace(/^eitaa\.(com|org|ir)\//i, '');
    v = v.split(/[/?#]/)[0].replace(/^@+/, '');
    return /^[A-Za-z0-9_]{3,32}$/.test(v) ? v : '';
  };

  AL.normBale = s => {
    let v = String(s || '').trim().replace(/^https?:\/\/(www\.)?ble\.(ir|im)\//i, '').replace(/^ble\.(ir|im)\//i, '');
    v = v.split(/[/?#]/)[0].replace(/^@+/, '');
    return /^[A-Za-z0-9_]{3,32}$/.test(v) ? v : '';
  };

  AL.normRubika = s => {
    let v = String(s || '').trim().replace(/^https?:\/\/(www\.)?rubika\.(ir|com)\/(joinc\/)?/i, '').replace(/^rubika\.(ir|com)\//i, '');
    v = v.split(/[/?#]/)[0].replace(/^@+/, '');
    return /^[A-Za-z0-9_]{3,32}$/.test(v) ? v : '';
  };

  AL.normEmail = s => {
    let v = String(s || '').trim().replace(/^mailto:/i, '');
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) ? v.toLowerCase() : '';
  };

  AL.normUrl = s => {
    let v = String(s || '').trim();
    if (!v) return '';
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    try {
      const u = new URL(v);
      return u.href;
    } catch (e) {
      return '';
    }
  };

  // شماره واتساپ → قالب بین‌المللی بدون + (۰۹۱۵۱۲۳۴۵۶۷ → 989151234567)
  AL.normWhatsapp = s => {
    let v = AL.normDigits(s);
    const plus = v.startsWith('+');
    v = v.replace(/\+/g, '');
    if (v.startsWith('00')) v = v.slice(2);
    else if (!plus && v.startsWith('0')) v = '98' + v.slice(1);
    else if (!plus && v.length === 10 && v.startsWith('9')) v = '98' + v;
    return /^\d{8,15}$/.test(v) ? v : '';
  };

  // ---------- آنالیزور هوشمند کدهای اسکن‌شده با دوربین یا گالری ----------
  AL.parseScanned = function (text) {
    text = String(text || '').trim();
    if (!text) return null;

    // 1. کارت ویزیت کامل (vCard)
    if (/BEGIN:VCARD/i.test(text)) {
      return { type: 'vcard', raw: text, parsed: AL.parseVCard(text) };
    }

    // 2. اینستاگرام
    let m = text.match(/(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/([A-Za-z0-9._]{1,30})/i);
    if (m) return { type: 'instagram', label: 'اینستاگرام', value: m[1] };

    // 3. تلگرام
    m = text.match(/(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{4,32})/i) ||
        text.match(/^tg:\/\/resolve\?domain=([A-Za-z0-9_]{4,32})/i);
    if (m) return { type: 'telegram', label: 'تلگرام', value: m[1] };

    // 4. ایتا
    m = text.match(/(?:https?:\/\/)?(?:www\.)?eitaa\.(?:com|org|ir)\/([A-Za-z0-9_]{3,32})/i);
    if (m) return { type: 'eitaa', label: 'ایتا', value: m[1] };

    // 5. بله
    m = text.match(/(?:https?:\/\/)?(?:www\.)?ble\.(?:ir|im)\/([A-Za-z0-9_]{3,32})/i);
    if (m) return { type: 'bale', label: 'بله', value: m[1] };

    // 6. روبیکا
    m = text.match(/(?:https?:\/\/)?(?:www\.)?rubika\.(?:ir|com)\/(?:joinc\/)?([A-Za-z0-9_]{3,32})/i);
    if (m) return { type: 'rubika', label: 'روبیکا', value: m[1] };

    // 7. واتساپ
    m = text.match(/(?:https?:\/\/)?(?:www\.)?wa\.me\/(?:\+)?(\d{8,15})/i) ||
        text.match(/(?:https?:\/\/)?api\.whatsapp\.com\/send\?phone=(?:\+)?(\d{8,15})/i);
    if (m) return { type: 'whatsapp', label: 'واتساپ', value: m[1] };

    // 8. ایمیل
    m = text.match(/^(?:mailto:)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/i);
    if (m) return { type: 'email', label: 'ایمیل', value: m[1].toLowerCase() };

    // 9. وب‌سایت
    if (/^https?:\/\//i.test(text)) {
      return { type: 'website', label: 'وب‌سایت', value: text };
    }

    // 10. شماره تلفن مستقیم
    const cleanDigits = AL.normDigits(text);
    if (cleanDigits.length >= 8 && cleanDigits.length <= 15) {
      return { type: 'phone', label: 'شماره تلفن', value: cleanDigits };
    }

    return { type: 'unknown', label: 'متن عمومی', value: text };
  };

  // تجزیه متن vCard به فیلدهای فرم
  AL.parseVCard = function (vcf) {
    const res = { phones: [] };
    const lines = String(vcf || '').split(/\r?\n/);
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      if (/^FN:/i.test(line)) res.name = line.substring(3).trim();
      else if (!res.name && /^N:/i.test(line)) {
        const parts = line.substring(2).split(';').filter(Boolean);
        res.name = parts.reverse().join(' ').trim();
      }
      else if (/^ORG:/i.test(line)) res.name = res.name || line.substring(4).trim();
      else if (/^TITLE:/i.test(line)) res.title = line.substring(6).trim();
      else if (/^NOTE:/i.test(line)) res.description = line.substring(5).trim();
      else if (/^TEL[^:]*:/i.test(line)) {
        const num = AL.normDigits(line.substring(line.indexOf(':') + 1));
        if (num && !res.phones.includes(num)) res.phones.push(num);
      }
      else if (/^EMAIL[^:]*:/i.test(line)) {
        res.email = line.substring(line.indexOf(':') + 1).trim();
      }
      else if (/^ADR[^:]*:/i.test(line)) {
        const parts = line.substring(line.indexOf(':') + 1).split(';').filter(Boolean);
        res.address = parts.join(' - ').trim();
      }
      else if (/^URL[^:]*:/i.test(line)) {
        const url = line.substring(line.indexOf(':') + 1).trim();
        const p = AL.parseScanned(url);
        if (p && p.type !== 'unknown' && p.type !== 'website') {
          res[p.type] = p.value;
        } else if (!res.website && /^https?:\/\//i.test(url)) {
          res.website = url;
        }
      }
      else if (/^X-SOCIALPROFILE/i.test(line)) {
        const val = line.substring(line.indexOf(':') + 1).trim();
        const p = AL.parseScanned(val);
        if (p && p.type !== 'unknown') res[p.type] = p.value;
      }
    }
    return res;
  };

  // لیست لینک‌های شبکه‌های اجتماعی برای نمایش و کارت
  AL.socialLinks = d => {
    const out = [];
    if (d && d.instagram) out.push({ key: 'instagram', label: 'اینستاگرام', value: '@' + d.instagram, url: 'https://instagram.com/' + encodeURIComponent(d.instagram) });
    if (d && d.telegram) out.push({ key: 'telegram', label: 'تلگرام', value: '@' + d.telegram, url: 'https://t.me/' + encodeURIComponent(d.telegram) });
    if (d && d.eitaa) out.push({ key: 'eitaa', label: 'ایتا', value: '@' + d.eitaa, url: 'https://eitaa.com/' + encodeURIComponent(d.eitaa) });
    if (d && d.bale) out.push({ key: 'bale', label: 'بله', value: '@' + d.bale, url: 'https://ble.ir/' + encodeURIComponent(d.bale) });
    if (d && d.rubika) out.push({ key: 'rubika', label: 'روبیکا', value: '@' + d.rubika, url: 'https://rubika.ir/' + encodeURIComponent(d.rubika) });
    if (d && d.whatsapp) out.push({ key: 'whatsapp', label: 'واتساپ', value: '+' + d.whatsapp, url: 'https://wa.me/' + encodeURIComponent(d.whatsapp) });
    if (d && d.email) out.push({ key: 'email', label: 'ایمیل', value: d.email, url: 'mailto:' + encodeURIComponent(d.email) });
    if (d && d.website) out.push({ key: 'website', label: 'وب‌سایت', value: d.website.replace(/^https?:\/\//i, ''), url: d.website });
    return out;
  };

  AL.hasCoords = d => d && typeof d.lat === 'number' && typeof d.lng === 'number';

  AL.googleLink = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  // ---------- ساخت vCard استاندارد ----------
  AL.buildVCard = function (d) {
    const phones = Array.isArray(d.phones) ? d.phones : (d.phone ? [d.phone] : []);
    let v = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
    v += 'N:' + AL.vEsc(d.name) + ';;;;\r\n';
    v += 'FN:' + AL.vEsc(d.name) + '\r\n';
    if (d.type === 'business') v += 'ORG:' + AL.vEsc(d.name) + '\r\n';
    if (d.title) v += 'TITLE:' + AL.vEsc(d.title) + '\r\n';
    if (d.description) v += 'NOTE:' + AL.vEsc(d.description) + '\r\n';
    phones.forEach((p, i) => { v += 'TEL;TYPE=' + (i === 0 ? 'CELL' : 'WORK') + ':' + p + '\r\n'; });
    if (d.email) v += 'EMAIL;TYPE=INTERNET:' + AL.vEsc(d.email) + '\r\n';
    if (d.address) v += 'ADR;TYPE=WORK:;;' + AL.vEsc(d.address) + ';;;;\r\n';
    if (d.website) v += 'URL;TYPE=WORK:' + d.website + '\r\n';
    if (AL.hasCoords(d)) {
      v += 'GEO:' + d.lat + ';' + d.lng + '\r\n';
      v += 'URL;TYPE=GoogleMaps:' + AL.googleLink(d.lat, d.lng) + '\r\n';
    }

    // پشتیبانی کامل استاندارد iOS و Android برای شبکه‌های اجتماعی
    if (d.instagram) {
      v += 'X-SOCIALPROFILE;type=instagram:https://instagram.com/' + d.instagram + '\r\n';
      v += 'URL;TYPE=Instagram:https://instagram.com/' + d.instagram + '\r\n';
    }
    if (d.telegram) {
      v += 'X-SOCIALPROFILE;type=telegram:https://t.me/' + d.telegram + '\r\n';
      v += 'URL;TYPE=Telegram:https://t.me/' + d.telegram + '\r\n';
    }
    if (d.eitaa) {
      v += 'X-SOCIALPROFILE;type=eitaa:https://eitaa.com/' + d.eitaa + '\r\n';
      v += 'URL;TYPE=Eitaa:https://eitaa.com/' + d.eitaa + '\r\n';
    }
    if (d.bale) {
      v += 'X-SOCIALPROFILE;type=bale:https://ble.ir/' + d.bale + '\r\n';
      v += 'URL;TYPE=Bale:https://ble.ir/' + d.bale + '\r\n';
    }
    if (d.rubika) {
      v += 'X-SOCIALPROFILE;type=rubika:https://rubika.ir/' + d.rubika + '\r\n';
      v += 'URL;TYPE=Rubika:https://rubika.ir/' + d.rubika + '\r\n';
    }
    if (d.whatsapp) {
      v += 'URL;TYPE=WhatsApp:https://wa.me/' + d.whatsapp + '\r\n';
    }

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

  // ---------- QR داخل مرورگر (بدون ارسال اطلاعات به سرور دیگر) ----------
  AL.qrCanvas = function (text, size) {
    if (typeof qrcode === 'undefined') return null;
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

  // صدای بیپ اسکنر موفق با Web Audio API (بدون فایل خارجی)
  AL.playBeep = function () {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch (e) {}
  };

  // ---------- CSV (اکسل) ----------
  const csvCell = v => {
    let s = String(v ?? '');
    if (/^[=+@\t\r]/.test(s) || /^-./.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };

  AL.toCsv = function (list) {
    let csv = '\uFEFFردیف,نام,شماره تماس,نوع,سرفصل (دسته‌بندی),عنوان شغلی,توضیحات,ایمیل,وب‌سایت,آدرس,اینستاگرام,واتساپ,تلگرام,ایتا,بله,روبیکا,عرض جغرافیایی,طول جغرافیایی,تاریخ\n';
    list.forEach((d, i) => {
      const plist = (Array.isArray(d.phones) ? d.phones : (d.phone ? [d.phone] : [])).map(p => String(p).replace(/"/g, ''));
      const phones = plist.length ? '="' + plist.join(' - ') + '"' : '';
      const type = d.type === 'business' ? 'کسب‌وکار' : (d.type === 'personal' ? 'شخصی' : '-');
      const when = d.createdAt || d.savedAt;
      const date = when ? new Date(when).toLocaleDateString('fa-IR') : '-';
      csv += [
        i + 1,
        csvCell(d.name),
        '"' + phones.replace(/"/g, '""') + '"',
        csvCell(type),
        csvCell(d.category),
        csvCell(d.title),
        csvCell(d.description),
        csvCell(d.email),
        csvCell(d.website),
        csvCell(d.address),
        csvCell(d.instagram),
        (d.whatsapp ? '"=""' + d.whatsapp + '"""' : '""'),
        csvCell(d.telegram),
        csvCell(d.eitaa),
        csvCell(d.bale),
        csvCell(d.rubika),
        csvCell(d.lat),
        csvCell(d.lng),
        csvCell(date)
      ].join(',') + '\n';
    });
    return csv;
  };

  window.AL = AL;
})();
