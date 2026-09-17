/**
 * LUMERA LAB 문의 폼 - Google Sheets 저장 + 관리자 이메일 알림
 * Google Sheets: 확장 프로그램 > Apps Script에 붙여넣기
 * 시트 탭 이름: INQUIRIES (1행 헤더 필수)
 *
 * 이메일 권한 최초 설정: 편집기에서 testAdminEmail 실행 > 권한 허용 > 새 버전 재배포
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

    const emailResult = sendAdminNotification(inquiryId, categoryLabel, data, submittedAt);
    updateEmailStatus(sheet, emailResult);

    return jsonResponse({
      success: true,
      inquiry_id: inquiryId,
      email_sent: emailResult.sent,
      email_error: emailResult.sent ? '' : emailResult.error,
    });
  } catch (err) {
    return jsonResponse({ success: false, message: String(err) });
  }
}

function buildNotificationBody(inquiryId, categoryLabel, data, submittedAt) {
  return [
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
    'Google Sheets INQUIRIES 탭에서 status를 확인하고 변경할 수 있습니다.',
  ].join('\n');
}

function sendAdminNotification(inquiryId, categoryLabel, data, submittedAt) {
  const subject = '[LUMERA LAB] 새 문의 접수 - ' + inquiryId;
  const body = buildNotificationBody(inquiryId, categoryLabel, data, submittedAt);
  const options = {
    replyTo: data.email,
    name: 'LUMERA LAB',
  };

  try {
    GmailApp.sendEmail(ADMIN_EMAIL, subject, body, options);
    return { sent: true, error: '' };
  } catch (gmailErr) {
    Logger.log('GmailApp failed: ' + gmailErr);
  }

  try {
    MailApp.sendEmail(ADMIN_EMAIL, subject, body, options);
    return { sent: true, error: '' };
  } catch (mailErr) {
    Logger.log('MailApp failed: ' + mailErr);
    return { sent: false, error: String(mailErr) };
  }
}

function updateEmailStatus(sheet, emailResult) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let statusCol = headerRow.indexOf('email_status') + 1;

  if (statusCol === 0) {
    statusCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, statusCol).setValue('email_status');
  }

  const statusValue = emailResult.sent ? 'SENT' : 'FAILED: ' + emailResult.error;
  sheet.getRange(lastRow, statusCol).setValue(statusValue);
}

function testAdminEmail() {
  const result = sendAdminNotification(
    'LM-TEST-0001',
    '테스트',
    {
      name: '테스트 고객',
      email: 'test@example.com',
      company: '',
      phone: '',
      product: 'N01 Radiance Serum',
      message: 'Apps Script 이메일 발송 테스트입니다.',
    },
    Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm')
  );

  Logger.log(result.sent ? '테스트 메일 발송 성공' : '테스트 메일 발송 실패: ' + result.error);
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
