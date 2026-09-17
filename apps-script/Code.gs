/**
 * LUMERA LAB 문의 폼 → Google Sheets 저장 + 관리자 이메일 알림
 * Google Sheets: 확장 프로그램 → Apps Script에 붙여넣기
 * 시트 탭 이름: INQUIRIES (1행 헤더 필수)
 */
const SHEET_NAME = 'INQUIRIES';
const ADMIN_EMAIL = '1959.kimik@gmail.com';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!data.category || !data.name || !data.email || !data.message || data.privacy_agree !== 'Y') {
      return jsonResponse({ success: false, message: '필수값이 누락되었습니다.' });
    }

    if (data.category === 'b2b' && !data.company) {
      return jsonResponse({ success: false, message: 'B2B 문의는 회사명이 필요합니다.' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse({ success: false, message: 'INQUIRIES 시트를 찾을 수 없습니다.' });
    }

    const now = new Date();
    const submittedAt = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
    const inquiryId = makeInquiryId(now, sheet);
    const categoryLabel = data.category === 'b2b' ? 'B2B 문의' : '일반 문의';

    sheet.appendRow([
      submittedAt,
      inquiryId,
      categoryLabel,
      data.name,
      data.email,
      data.company || '',
      data.phone || '',
      data.product || '',
      data.message,
      'Y',
      'NEW',
    ]);

    let emailSent = false;
    try {
      sendAdminNotification(inquiryId, categoryLabel, data, submittedAt);
      emailSent = true;
    } catch (mailErr) {
      Logger.log('Admin email failed: ' + mailErr);
    }

    return jsonResponse({ success: true, inquiry_id: inquiryId, email_sent: emailSent });
  } catch (err) {
    return jsonResponse({ success: false, message: String(err) });
  }
}

function sendAdminNotification(inquiryId, categoryLabel, data, submittedAt) {
  const subject = '[LUMERA LAB] 새 문의 접수 - ' + inquiryId;
  const lines = [
    'LUMERA LAB 웹사이트에 새 문의가 접수되었습니다.',
    '',
    '문의번호: ' + inquiryId,
    '접수일시: ' + submittedAt,
    '문의 유형: ' + categoryLabel,
    '이름: ' + data.name,
    '이메일: ' + data.email,
    '회사명: ' + (data.company || '-'),
    '연락처: ' + (data.phone || '-'),
    '관심 제품: ' + (data.product || '-'),
    '',
    '문의 내용:',
    data.message,
    '',
    '---',
    'Google Sheets INQUIRIES 탭에서 status를 확인·변경할 수 있습니다.',
  ];

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: subject,
    body: lines.join('\n'),
    replyTo: data.email,
    name: 'LUMERA LAB 문의',
  });
}

function makeInquiryId(date, sheet) {
  const y = Utilities.formatDate(date, 'Asia/Seoul', 'yyMMdd');
  const prefix = 'LM-' + y + '-';
  const lastRow = sheet.getLastRow();

  let seq = 1;
  if (lastRow >= 2) {
    const lastId = sheet.getRange(lastRow, 2).getValue();
    if (String(lastId).startsWith(prefix)) {
      const num = parseInt(String(lastId).split('-')[2], 10);
      if (!isNaN(num)) seq = num + 1;
    }
  }

  return prefix + String(seq).padStart(4, '0');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
