/**
 * LUMERA LAB 문의 폼 → Google Sheets 저장
 * Google Sheets: 확장 프로그램 → Apps Script에 붙여넣기
 * 시트 탭 이름: INQUIRIES (1행 헤더 필수)
 */
const SHEET_NAME = 'INQUIRIES';

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
    const inquiryId = makeInquiryId(now, sheet);
    const categoryLabel = data.category === 'b2b' ? 'B2B 문의' : '일반 문의';

    sheet.appendRow([
      Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm'),
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

    return jsonResponse({ success: true, inquiry_id: inquiryId });
  } catch (err) {
    return jsonResponse({ success: false, message: String(err) });
  }
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
